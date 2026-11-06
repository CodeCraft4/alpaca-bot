import { HttpError } from './errors.js';

export interface RiskSettings {
  emergencyKillSwitch: boolean;
  manualBuyOnly: boolean;
}

export interface RiskInput {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  qty?: number;
  notional?: number;
  limitPrice?: number;
  source: 'manual' | 'automation';
}

export interface RiskContext {
  allowedSymbol: string;
  settings: RiskSettings;
  currentPrice: number;
  buyingPower: number;
  heldQty: number;
}

/** Estimated dollar value of the order. */
export function estimateValue(i: RiskInput, price: number): number {
  if (i.notional) return i.notional;
  const px = i.type === 'limit' && i.limitPrice ? i.limitPrice : price;
  return (i.qty ?? 0) * px;
}

/** Throws HttpError(422/403) when the order must not be placed. */
export function validateOrder(i: RiskInput, c: RiskContext): { estimatedValue: number } {
  if (i.symbol.toUpperCase() !== c.allowedSymbol.toUpperCase()) {
    throw new HttpError(422, `Only ${c.allowedSymbol} can be traded`, 'symbol_not_allowed');
  }
  if (!i.qty && !i.notional) throw new HttpError(422, 'qty or notional is required', 'missing_size');
  if (i.qty && i.notional) throw new HttpError(422, 'Provide qty or notional, not both', 'ambiguous_size');
  if ((i.qty ?? 0) < 0 || (i.notional ?? 0) < 0) throw new HttpError(422, 'Size must be positive', 'bad_size');
  if (i.type === 'limit' && !(i.limitPrice && i.limitPrice > 0)) {
    throw new HttpError(422, 'limit_price is required for limit orders', 'missing_limit');
  }
  if (i.notional && i.type === 'limit') {
    throw new HttpError(422, 'Dollar-amount orders must be market orders', 'notional_limit');
  }

  const estimatedValue = estimateValue(i, c.currentPrice);

  if (i.side === 'buy') {
    if (c.settings.emergencyKillSwitch) {
      throw new HttpError(403, 'Emergency kill switch is ON: new buys are blocked', 'kill_switch');
    }
    if (i.source === 'automation' && c.settings.manualBuyOnly) {
      throw new HttpError(403, 'Manual-buy-only is enabled: automation cannot buy', 'manual_only');
    }
    if (estimatedValue > c.buyingPower + 1e-9) {
      throw new HttpError(422, `Insufficient buying power ($${c.buyingPower.toFixed(2)})`, 'insufficient_funds');
    }
  } else {
    const sellQty = i.qty ?? (i.notional ? i.notional / c.currentPrice : 0);
    if (sellQty > c.heldQty + 1e-9) {
      throw new HttpError(422, `Cannot sell ${sellQty} shares; only ${c.heldQty} held`, 'insufficient_shares');
    }
  }

  return { estimatedValue };
}
