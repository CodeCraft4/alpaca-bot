import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { alpaca, type AlpacaOrder } from '../alpaca.js';
import { config } from '../config.js';
import { query } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { validateOrder } from '../lib/risk.js';
import { logActivity } from './activity.js';
import { defer } from '../lib/defer.js';
import { livePrice } from './market.js';
import { notifyOrder, notifyRejected } from './notify.js';
import { getSettings } from './settings.js';

export const orderSchema = z
  .object({
    symbol: z.string().min(1).default(config.TRADING_SYMBOL),
    side: z.enum(['buy', 'sell']),
    type: z.enum(['market', 'limit']).default('market'),
    qty: z.number().positive().optional(),
    notional: z.number().positive().optional(),
    limitPrice: z.number().positive().optional(),
    targetPct: z.number().positive().max(100).optional(),
    // 0 = no stop-loss (position is held until you sell it yourself)
    stopLossPct: z.number().min(0).max(100).optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();
export type OrderRequest = z.infer<typeof orderSchema>;

const OPEN_STATUSES = ['new', 'accepted', 'pending_new', 'partially_filled', 'held', 'pending_replace'];
export const isOpenStatus = (s: string) => OPEN_STATUSES.includes(s);

export async function upsertAlpacaOrder(o: AlpacaOrder, extra: Record<string, unknown> = {}) {
  const source = (extra.source as string) ?? (o.client_order_id?.startsWith('auto-') ? 'automation' : 'external');
  const rows = await query(
    `insert into orders (alpaca_order_id, client_order_id, symbol, side, type, qty, notional, filled_qty,
        avg_fill_price, limit_price, status, time_in_force, source, submitted_at, filled_at,
        target_pct, stop_loss_pct, target_price, stop_loss_price, entry_price, notes)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     on conflict (alpaca_order_id) do update set
        status = excluded.status, filled_qty = excluded.filled_qty, avg_fill_price = excluded.avg_fill_price,
        filled_at = excluded.filled_at, qty = coalesce(excluded.qty, orders.qty),
        entry_price = coalesce(orders.entry_price, excluded.entry_price)
     returning *`,
    [
      o.id, o.client_order_id, o.symbol, o.side, o.type === 'limit' ? 'limit' : 'market',
      o.qty ? Number(o.qty) : null, o.notional ? Number(o.notional) : null, Number(o.filled_qty || 0),
      o.filled_avg_price ? Number(o.filled_avg_price) : null, o.limit_price ? Number(o.limit_price) : null,
      o.status.toLowerCase(), o.time_in_force, source, o.submitted_at ?? o.created_at, o.filled_at,
      extra.targetPct ?? null, extra.stopLossPct ?? null, extra.targetPrice ?? null, extra.stopLossPrice ?? null,
      o.filled_avg_price ? Number(o.filled_avg_price) : (extra.entryPrice ?? null), extra.notes ?? null,
    ],
  );
  return rows[0];
}

/**
 * Exit rules for an open position come from the latest FILLED buy order (never from open/cancelled orders).
 * Falls back to settings defaults when no filled buy carries targets (e.g. external buys).
 */
export async function applyPositionRule(symbol: string, avgEntry: number) {
  const settings = await getSettings();
  const last = (await query(
    `select target_pct, stop_loss_pct from orders
      where symbol=$1 and side='buy' and status='filled' and target_pct is not null
      order by filled_at desc nulls last limit 1`, [symbol]))[0];
  const tp = Number(last?.target_pct ?? settings.profitTargetPct);
  const sl = Number(last?.stop_loss_pct ?? settings.stopLossPct);
  await query(
    `insert into position_rules (symbol, target_pct, stop_loss_pct, target_price, stop_price) values ($1,$2,$3,$4,$5)
     on conflict (symbol) do update set target_pct=$2, stop_loss_pct=$3, target_price=$4, stop_price=$5`,
    [symbol, tp, sl, +(avgEntry * (1 + tp / 100)).toFixed(2), sl > 0 ? +(avgEntry * (1 - sl / 100)).toFixed(2) : null],
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const deferLog = (a: Parameters<typeof logActivity>[0]) => defer(logActivity(a));

/** DB-shaped row for an Alpaca order, so the API can answer without waiting for the (remote) database write. */
function rowFromAlpaca(o: AlpacaOrder, extra: Record<string, unknown> = {}) {
  const num = (v: string | null | undefined) => (v ? Number(v) : null);
  return {
    alpaca_order_id: o.id, client_order_id: o.client_order_id, symbol: o.symbol, side: o.side,
    type: o.type === 'limit' ? 'limit' : 'market', qty: num(o.qty), notional: num(o.notional),
    filled_qty: Number(o.filled_qty || 0), avg_fill_price: num(o.filled_avg_price), limit_price: num(o.limit_price),
    status: o.status.toLowerCase(), time_in_force: o.time_in_force,
    target_pct: extra.targetPct ?? null, stop_loss_pct: extra.stopLossPct ?? null,
    target_price: extra.targetPrice ?? null, stop_loss_price: extra.stopLossPrice ?? null,
    entry_price: o.filled_avg_price ? Number(o.filled_avg_price) : (extra.entryPrice ?? null),
    source: extra.source ?? 'manual', notes: extra.notes ?? null,
    submitted_at: o.submitted_at ?? o.created_at, filled_at: o.filled_at, review_due_at: null,
  };
}

/** Save the order (with its target) right after the response has been sent; retried so a blip cannot lose the target. */
function persistInBackground(o: AlpacaOrder, extra: Record<string, unknown>) {
  defer((async () => {
    for (let i = 0; i < 4; i++) {
      try {
        await upsertAlpacaOrder(o, extra);
        return;
      } catch (e) {
        if (i === 3) {
          console.error('could not save order', o.id, (e as Error).message);
          await logActivity({ type: 'system', level: 'error', title: `Order ${o.id.slice(0, 8)} was placed but not saved`, detail: (e as Error).message });
        } else {
          await sleep(400 * (i + 1));
        }
      }
    }
  })());
}

/**
 * Place an order as fast as possible: everything the risk check needs is fetched in ONE parallel round,
 * the order goes to Alpaca, and the response is sent immediately. Saving to the database, the activity log and
 * the email all happen after that.
 */
export async function placeOrder(
  req: OrderRequest,
  source: 'manual' | 'automation' = 'manual',
  clientId?: string,
  opts: { heldQty?: number } = {},
) {
  const symbol = req.symbol.toUpperCase();
  const isSell = req.side === 'sell';

  // A market sell by share quantity needs no price at all (that saves a network call)
  const needsPrice = !isSell || !req.qty;
  const [settings, live, held] = await Promise.all([
    getSettings(), // memory cache
    needsPrice ? livePrice(symbol, 15_000) : Promise.resolve({ price: 0 }), // up to 15 s old is fine for the estimate
    isSell && opts.heldQty === undefined
      ? alpaca.positions().then((ps) => Number(ps.find((p) => p.symbol === symbol)?.qty ?? 0))
      : Promise.resolve(opts.heldQty ?? 0),
  ]);
  const price = live.price;

  const { estimatedValue } = validateOrder(
    { symbol, side: req.side, type: req.type, qty: req.qty, notional: req.notional, limitPrice: req.limitPrice, source },
    {
      allowedSymbol: config.TRADING_SYMBOL,
      settings,
      currentPrice: price,
      buyingPower: Number.POSITIVE_INFINITY, // Alpaca itself rejects an order the account cannot afford
      heldQty: held,
    },
  );

  const targetPct = isSell ? null : (req.targetPct ?? settings.profitTargetPct);
  const stopLossPct = req.stopLossPct ?? 0;
  const entry = req.type === 'limit' && req.limitPrice ? req.limitPrice : price;
  const targetPrice = !isSell && targetPct !== null ? +(entry * (1 + targetPct / 100)).toFixed(2) : null;
  const stopLossPrice = null; // stop-loss is not used

  let placed: AlpacaOrder;
  try {
    placed = await alpaca.placeOrder({
      symbol, side: req.side, type: req.type, qty: req.qty,
      notional: req.notional && !isSell && config.ALPACA_TRADING_ENV === 'paper' ? +(req.notional + config.NOTIONAL_TOP_UP).toFixed(2) : req.notional,
      limit_price: req.limitPrice, time_in_force: 'day',
      client_order_id: clientId ?? `${source === 'manual' ? 'man' : 'auto'}-${randomUUID()}`,
    });
  } catch (e) {
    deferLog({ type: 'trade', level: 'error', title: `${symbol} ${req.side} order rejected`, detail: (e as Error).message });
    defer(notifyRejected(symbol, req.side, (e as Error).message));
    throw e;
  }

  const extra = { source, targetPct, stopLossPct, targetPrice, stopLossPrice, entryPrice: entry, notes: req.notes };
  persistInBackground(placed, extra);

  deferLog({
    type: 'trade', level: 'success',
    title: `${symbol} ${req.side.toUpperCase()} order ${placed.status}`,
    detail: `${req.qty ? `${req.qty} sh` : `$${req.notional}`} ${req.type}${req.limitPrice ? ` @ $${req.limitPrice}` : ''} (~$${estimatedValue.toFixed(2)})`,
    meta: { alpacaOrderId: placed.id, source },
  });

  // Email (non-blocking) for BUY orders only. A sell is announced when it completes (trade-closed email).
  if (req.side === 'buy') {
    const shares = req.qty ?? (req.notional ? req.notional / entry : 0);
    defer((async () => {
      await sleep(1500); // let the background save land first
      await notifyOrder({
        stage: 'placed', orderId: placed.id, status: placed.status, symbol, side: 'buy', type: req.type,
        shares, entryPrice: entry, currentPrice: price, cost: estimatedValue,
        targetPct: targetPct ?? 0, targetPrice: targetPrice ?? 0, stopLossPct, stopLossPrice,
      });
    })());
  }
  return rowFromAlpaca(placed, extra);
}

export async function cancelOrder(alpacaOrderId: string) {
  await alpaca.cancelOrder(alpacaOrderId); // Alpaca rejects it if the order is not cancellable any more
  const latest = await alpaca.order(alpacaOrderId);
  persistInBackground(latest, {}); // keeps the targets already stored for this order
  deferLog({ type: 'trade', title: `Order ${alpacaOrderId.slice(0, 8)} cancelled`, detail: latest.symbol });
  return rowFromAlpaca(latest);
}

export interface Lot {
  orderId: string;
  symbol: string;
  openQty: number;
  fillPrice: number;
  amountUsd: number;
  targetPct: number;
  targetPrice: number;
  filledAt: string;
  reviewDueAt: string | null;
}

/** Shares from each filled BUY order that have not been sold yet. Targets belong to the order (lot). */
export async function openLots(symbol?: string): Promise<Lot[]> {
  const settings = await getSettings();
  const rows = await query(
    `select o.*, o.filled_qty - coalesce((select sum(t.quantity) from trades t
                                            where t.entry_alpaca_order_id = o.alpaca_order_id), 0) as open_qty
       from orders o
      where o.side = 'buy' and o.status = 'filled' and o.avg_fill_price is not null ${symbol ? 'and o.symbol = $1' : ''}
      order by o.filled_at`,
    symbol ? [symbol] : [],
  );
  return rows
    .filter((r) => Number(r.open_qty) > 1e-6) // ignore rounding dust (a millionth of a share)
    .map((r) => {
      const fill = Number(r.avg_fill_price);
      const tp = Number(r.target_pct ?? settings.profitTargetPct);
      const openQty = Number(r.open_qty);
      return {
        orderId: r.alpaca_order_id as string,
        symbol: r.symbol as string,
        openQty,
        fillPrice: fill,
        amountUsd: Math.round(openQty * fill * 100) / 100,
        targetPct: tp,
        targetPrice: +(fill * (1 + tp / 100)).toFixed(2),
        filledAt: new Date(r.filled_at ?? r.submitted_at).toISOString(),
        reviewDueAt: r.review_due_at ? new Date(r.review_due_at).toISOString() : null,
      };
    });
}

/** Push the next "target not hit, what now?" review N days from now. */
export async function snoozeReview(alpacaOrderId: string, days?: number) {
  const d = days ?? (await getSettings()).holdingReviewDays;
  await query(`update orders set review_due_at = now() + ($2 || ' days')::interval where alpaca_order_id = $1`, [alpacaOrderId, String(d)]);
}

export async function editTargets(alpacaOrderId: string, targetPct: number, stopLossPct = 0) {
  const rows = await query('select * from orders where alpaca_order_id = $1', [alpacaOrderId]);
  if (!rows.length) throw new HttpError(404, 'Order not found');
  const o = rows[0];
  const base = Number(o.avg_fill_price ?? o.entry_price ?? o.limit_price);
  const dir = o.side === 'buy' ? 1 : -1;
  const tp = +(base * (1 + (dir * targetPct) / 100)).toFixed(2);
  const sl = stopLossPct > 0 ? +(base * (1 - (dir * stopLossPct) / 100)).toFixed(2) : null;
  const updated = await query(
    `update orders set target_pct=$2, stop_loss_pct=$3, target_price=$4, stop_loss_price=$5 where alpaca_order_id=$1 returning *`,
    [alpacaOrderId, targetPct, stopLossPct, tp, sl],
  );
  if (o.side === 'buy' && o.status === 'filled') {
    await snoozeReview(alpacaOrderId); // a new target starts a fresh review window
    const pos = (await alpaca.positions()).find((p) => p.symbol === o.symbol);
    if (pos) await applyPositionRule(o.symbol, Number(pos.avg_entry_price));
  }
  await logActivity({ type: 'config', title: `Target changed for order ${alpacaOrderId.slice(0, 8)}`, detail: `Target now ${targetPct}% (${tp.toFixed(2)})` });
  return updated[0];
}

/** Manual "sell now": liquidates the whole position (or `qty`) at market. */
export async function closePosition(symbol: string, qty?: number) {
  const sym = symbol.toUpperCase();
  const placed = await alpaca.closePosition(sym, qty);
  const extra = { source: 'manual', notes: 'Manual close' };
  persistInBackground(placed, extra);
  deferLog({ type: 'trade', level: 'success', title: `${sym} position close submitted`, detail: qty ? `${qty} shares` : 'full position' });
  return rowFromAlpaca(placed, extra);
}

export async function listOrders(opts: { status?: string; limit?: number } = {}) {
  const limit = Math.min(opts.limit ?? 100, 500);
  const where = opts.status === 'open' ? `where status = any($2)` : '';
  const params: unknown[] = [limit];
  if (opts.status === 'open') params.push(OPEN_STATUSES);
  const rows = await query(`select * from orders ${where} order by submitted_at desc nulls last limit $1`, params);
  return enrichWithPl(rows);
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Adds profit/loss to every order:
 *  - filled buy  : realized (already sold part) + unrealized (still-open part at current price)
 *  - filled sell : realized profit of the lots it closed
 *  - open order  : potential profit at target / loss at stop
 */
export async function enrichWithPl(rows: any[]) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.alpaca_order_id);
  const trades = await query(
    `select entry_alpaca_order_id e, exit_alpaca_order_id x, quantity, realized_pl
       from trades where entry_alpaca_order_id = any($1) or exit_alpaca_order_id = any($1)`,
    [ids],
  );
  const prices = new Map<string, number>();
  try {
    for (const s of new Set(rows.map((r) => r.symbol as string))) prices.set(s, (await livePrice(s)).price);
  } catch { /* price unavailable: unrealized P/L is skipped */ }

  return rows.map((r) => {
    const base = mapOrder(r);
    const filled = Number(r.filled_qty);
    const fill = r.avg_fill_price !== null ? Number(r.avg_fill_price) : null;
    const tp = r.target_price !== null ? Number(r.target_price) : null;
    const sl = r.stop_loss_price !== null ? Number(r.stop_loss_price) : null;
    const price = prices.get(r.symbol) ?? NaN;
    let realizedPL = 0, unrealizedPL = 0, openQty = 0;
    let potentialProfit: number | null = null, potentialLoss: number | null = null;

    if (r.status === 'filled' && r.side === 'buy' && fill !== null) {
      const mine = trades.filter((t) => t.e === r.alpaca_order_id);
      realizedPL = mine.reduce((a, t) => a + Number(t.realized_pl), 0);
      openQty = Math.max(0, filled - mine.reduce((a, t) => a + Number(t.quantity), 0));
      if (openQty > 1e-6) {
        if (Number.isFinite(price)) unrealizedPL = openQty * (price - fill);
        if (tp !== null) potentialProfit = openQty * (tp - fill);
        if (sl !== null) potentialLoss = openQty * (sl - fill);
      }
    } else if (r.status === 'filled' && r.side === 'sell') {
      realizedPL = trades.filter((t) => t.x === r.alpaca_order_id).reduce((a, t) => a + Number(t.realized_pl), 0);
    } else if (isOpenStatus(r.status) && r.side === 'buy') {
      const entry = Number(r.limit_price ?? r.entry_price);
      const qty = r.qty !== null ? Number(r.qty) : r.notional !== null && entry ? Number(r.notional) / entry : 0;
      if (tp !== null) potentialProfit = qty * (tp - entry);
      if (sl !== null) potentialLoss = qty * (sl - entry);
    }
    return {
      ...base,
      openQty: openQty > 1e-6 ? +openQty.toFixed(8) : 0, // hide rounding dust
      realizedPL: r2(realizedPL),
      unrealizedPL: r2(unrealizedPL),
      unrealizedPLPct: fill && openQty > 1e-8 && Number.isFinite(price) ? r2(((price - fill) / fill) * 100) : null,
      potentialProfit: potentialProfit === null ? null : r2(potentialProfit),
      potentialLoss: potentialLoss === null ? null : r2(potentialLoss),
    };
  });
}

export const mapOrder = (r: any) => ({
  id: r.alpaca_order_id,
  clientOrderId: r.client_order_id,
  symbol: r.symbol,
  side: r.side,
  type: r.type,
  quantity: r.qty !== null ? Number(r.qty) : null,
  notional: r.notional !== null ? Number(r.notional) : null,
  filledQty: Number(r.filled_qty),
  avgFillPrice: r.avg_fill_price !== null ? Number(r.avg_fill_price) : null,
  limitPrice: r.limit_price !== null ? Number(r.limit_price) : null,
  status: r.status,
  timeInForce: r.time_in_force,
  targetPct: r.target_pct !== null ? Number(r.target_pct) : null,
  stopLossPct: r.stop_loss_pct !== null ? Number(r.stop_loss_pct) : null,
  targetPrice: r.target_price !== null ? Number(r.target_price) : null,
  stopLossPrice: r.stop_loss_price !== null ? Number(r.stop_loss_price) : null,
  entryPrice: r.entry_price !== null ? Number(r.entry_price) : null,
  source: r.source,
  notes: r.notes,
  submittedAt: r.submitted_at,
  filledAt: r.filled_at,
  reviewDueAt: r.review_due_at ?? null,
});
