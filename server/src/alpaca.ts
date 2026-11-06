import { config } from './config.js';
import { HttpError } from './lib/errors.js';

export interface AlpacaAccount {
  id: string; account_number: string; status: string; currency: string;
  buying_power: string; cash: string; portfolio_value: string; equity: string; last_equity: string;
  trading_blocked?: boolean; account_blocked?: boolean;
}
export interface AlpacaPosition {
  asset_id: string; symbol: string; qty: string; avg_entry_price: string; market_value: string;
  cost_basis: string; unrealized_pl: string; unrealized_plpc: string; current_price: string; side: string;
}
export interface AlpacaOrder {
  id: string; client_order_id: string; created_at: string; submitted_at: string; filled_at: string | null;
  symbol: string; notional: string | null; qty: string | null; filled_qty: string;
  filled_avg_price: string | null; type: string; side: 'buy' | 'sell'; time_in_force: string;
  limit_price: string | null; status: string;
}
export interface AlpacaClock { timestamp: string; is_open: boolean; next_open: string; next_close: string }
export interface Bar { t: string; o: number; h: number; l: number; c: number; v: number }

export interface PlaceOrderInput {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  qty?: number;
  notional?: number;
  limit_price?: number;
  time_in_force?: 'day' | 'gtc';
  client_order_id?: string;
}

const authHeaders = () => ({
  'APCA-API-KEY-ID': config.ALPACA_API_KEY_ID,
  'APCA-API-SECRET-KEY': config.ALPACA_API_SECRET_KEY,
  'Content-Type': 'application/json',
});

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  if (!config.ALPACA_API_KEY_ID || !config.ALPACA_API_SECRET_KEY) {
    throw new HttpError(503, 'Alpaca credentials are not configured', 'alpaca_not_configured');
  }
  const res = await fetch(url, { ...init, headers: authHeaders() });
  if (!res.ok) {
    const body: any = await res.json().catch(() => ({}));
    const status = res.status === 422 || res.status === 404 ? res.status : 502;
    throw new HttpError(status, body.message || `Alpaca request failed (${res.status})`, 'alpaca_error');
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const T = () => config.ALPACA_API_BASE_URL.replace(/\/$/, '') + '/v2';
const D = () => config.ALPACA_DATA_BASE_URL.replace(/\/$/, '');

export const alpaca = {
  account: () => call<AlpacaAccount>(`${T()}/account`),
  clock: () => call<AlpacaClock>(`${T()}/clock`),
  positions: () => call<AlpacaPosition[]>(`${T()}/positions`),
  orders: (status = 'all', limit = 100) =>
    call<AlpacaOrder[]>(`${T()}/orders?status=${status}&limit=${limit}&direction=desc`),
  order: (id: string) => call<AlpacaOrder>(`${T()}/orders/${id}`),
  placeOrder(o: PlaceOrderInput) {
    const body: Record<string, unknown> = {
      symbol: o.symbol,
      side: o.side,
      type: o.type,
      time_in_force: o.time_in_force ?? 'day',
    };
    if (o.notional) body.notional = o.notional.toFixed(2);
    else if (o.qty) body.qty = String(o.qty);
    if (o.type === 'limit' && o.limit_price) body.limit_price = o.limit_price.toFixed(2);
    if (o.client_order_id) body.client_order_id = o.client_order_id;
    return call<AlpacaOrder>(`${T()}/orders`, { method: 'POST', body: JSON.stringify(body) });
  },
  cancelOrder: (id: string) => call<void>(`${T()}/orders/${id}`, { method: 'DELETE' }),
  closePosition: (symbol: string, qty?: number) =>
    call<AlpacaOrder>(`${T()}/positions/${encodeURIComponent(symbol)}${qty ? `?qty=${qty}` : ''}`, {
      method: 'DELETE',
    }),
  async latestPrice(symbol: string): Promise<{ price: number; time: string }> {
    const r = await call<{ trade: { p: number; t: string } }>(
      `${D()}/stocks/${symbol}/trades/latest?feed=${config.ALPACA_DATA_FEED}`,
    );
    return { price: r.trade.p, time: r.trade.t };
  },
  /**
   * Official previous-session close. Free plans cannot query *recent* SIP trades, but completed daily bars
   * from the SIP feed are allowed, and they match what Alpaca's own dashboard uses (IEX-only closes differ).
   */
  async previousClose(symbol: string): Promise<number | null> {
    try {
      const start = new Date(Date.now() - 8 * 86_400_000).toISOString();
      const r = await call<{ bars: Bar[] | null }>(
        `${D()}/stocks/${symbol}/bars?timeframe=1Day&start=${encodeURIComponent(start)}&limit=10&adjustment=raw&feed=sip`,
      );
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const done = (r.bars ?? []).filter(
        (b) => new Date(b.t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) < today,
      );
      if (done.length) return done[done.length - 1].c;
    } catch {
      /* fall through to the IEX snapshot */
    }
    const r = await call<Record<string, any>>(
      `${D()}/stocks/snapshots?symbols=${symbol}&feed=${config.ALPACA_DATA_FEED}`,
    );
    const s = r[symbol] ?? r.snapshots?.[symbol];
    return s?.prevDailyBar?.c ?? null;
  },
  async bars(symbol: string, timeframe: string, start: string, limit = 1000): Promise<Bar[]> {
    const r = await call<{ bars: Bar[] | null }>(
      `${D()}/stocks/${symbol}/bars?timeframe=${timeframe}&start=${encodeURIComponent(start)}&limit=${limit}&adjustment=raw&feed=${config.ALPACA_DATA_FEED}`,
    );
    return r.bars ?? [];
  },
};
