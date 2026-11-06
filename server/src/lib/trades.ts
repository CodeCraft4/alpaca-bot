export type ExitReason = 'Profit Target' | 'Stop Loss' | 'Manual Sell';

export interface FilledOrder {
  alpacaOrderId: string;
  clientOrderId: string | null;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  at: string; // ISO
}

export interface MatchedTrade {
  entryOrderId: string;
  exitOrderId: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  investment: number;
  exitValue: number;
  realizedPl: number;
  returnPct: number;
  exitReason: ExitReason;
  enteredAt: string;
  closedAt: string;
  holdingSeconds: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;
const EPS = 1e-9;

/** Sells placed for one specific buy order carry its id: `auto-tp-<uuid>-<ts>` or `lot-<uuid>-<ts>`. */
export function lotIdOf(clientOrderId: string | null): string | null {
  const m = /^(?:auto-tp|auto-sl|lot)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i.exec(clientOrderId ?? '');
  return m ? m[1] : null;
}

export function exitReasonOf(clientOrderId: string | null): ExitReason {
  if (clientOrderId?.startsWith('auto-tp-')) return 'Profit Target';
  if (clientOrderId?.startsWith('auto-sl-')) return 'Stop Loss';
  return 'Manual Sell';
}

/**
 * FIFO-match filled buys with filled sells. Deterministic: running it again on the same
 * orders always produces the same (entry, exit) pairs, so inserts can be idempotent.
 */
export function matchFifo(orders: FilledOrder[]): MatchedTrade[] {
  const sorted = [...orders].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const lots: { id: string; qty: number; price: number; at: string }[] = [];
  const out: MatchedTrade[] = [];

  for (const o of sorted) {
    if (o.side === 'buy') {
      lots.push({ id: o.alpacaOrderId, qty: o.qty, price: o.price, at: o.at });
      continue;
    }
    let remaining = o.qty;
    const wanted = lotIdOf(o.clientOrderId); // sell aimed at one buy order: close that one first
    while (remaining > EPS && lots.length) {
      const lot = (wanted && lots.find((l) => l.id === wanted && l.qty > EPS)) || lots[0];
      const take = Math.min(lot.qty, remaining);
      const investment = take * lot.price;
      const exitValue = take * o.price;
      out.push({
        entryOrderId: lot.id,
        exitOrderId: o.alpacaOrderId,
        quantity: take,
        entryPrice: lot.price,
        exitPrice: o.price,
        investment: r4(investment),
        exitValue: r4(exitValue),
        realizedPl: r4(exitValue - investment),
        returnPct: r2(((o.price - lot.price) / lot.price) * 100),
        exitReason: exitReasonOf(o.clientOrderId),
        enteredAt: lot.at,
        closedAt: o.at,
        holdingSeconds: Math.max(0, Math.round((new Date(o.at).getTime() - new Date(lot.at).getTime()) / 1000)),
      });
      lot.qty -= take;
      remaining -= take;
      if (lot.qty <= EPS) lots.splice(lots.indexOf(lot), 1);
    }
  }
  return out;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number | null;
  bestTrade: number;
  worstTrade: number;
}

export function computeStats(pls: number[]): TradeStats {
  const wins = pls.filter((p) => p > 0);
  const losses = pls.filter((p) => p < 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  return {
    totalTrades: pls.length,
    wins: wins.length,
    losses: losses.length,
    winRate: pls.length ? r2((wins.length / pls.length) * 100) : 0,
    totalPl: r2(pls.reduce((a, b) => a + b, 0)),
    avgWin: wins.length ? r2(grossWin / wins.length) : 0,
    avgLoss: losses.length ? r2(-grossLoss / losses.length) : 0,
    profitFactor: grossLoss > 0 ? r2(grossWin / grossLoss) : null,
    bestTrade: pls.length ? Math.max(...pls) : 0,
    worstTrade: pls.length ? Math.min(...pls) : 0,
  };
}

/** Decide whether a position should be exited. Pure function used by automation. */
export function exitDecision(opts: {
  avgEntry: number;
  price: number;
  targetPct: number;
  stopLossPct: number;
  autoTarget: boolean;
  autoStop: boolean;
}): 'target' | 'stop' | null {
  const chg = ((opts.price - opts.avgEntry) / opts.avgEntry) * 100;
  if (opts.autoTarget && chg >= opts.targetPct) return 'target';
  if (opts.autoStop && opts.stopLossPct > 0 && chg <= -opts.stopLossPct) return 'stop'; // 0 = no stop-loss
  return null;
}
