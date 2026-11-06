import { alpaca } from '../alpaca.js';
import { query } from '../db.js';
import { matchFifo, computeStats } from '../lib/trades.js';
import { logActivity } from './activity.js';
import { getSettings } from './settings.js';
import { notifyTrade } from './notify.js';
import { applyPositionRule, upsertAlpacaOrder } from './trading.js';

/** Pull orders from Alpaca into Supabase, rebuild completed trades, refresh position rules, snapshot equity. */
export async function syncAll() {
  const [orders, positions, account] = await Promise.all([
    alpaca.orders('all', 200),
    alpaca.positions(),
    alpaca.account(),
  ]);

  for (const o of orders) await upsertAlpacaOrder(o);

  const created = await rebuildTrades();
  const newTrades = created.length;
  await sendPendingEmails(created);

  // Position rules: derived from the latest filled buy; prices follow the real avg entry.
  const held = new Set(positions.map((p) => p.symbol));
  for (const p of positions) await applyPositionRule(p.symbol, Number(p.avg_entry_price));
  const rules = await query<{ symbol: string }>('select symbol from position_rules');
  for (const r of rules) if (!held.has(r.symbol)) await query('delete from position_rules where symbol = $1', [r.symbol]);

  await query('insert into account_snapshots (equity, cash) values ($1,$2)', [account.equity, account.cash]);
  return { orders: orders.length, positions: positions.length, newTrades };
}

export async function rebuildTrades() {
  const rows = await query(
    `select alpaca_order_id, client_order_id, side, filled_qty, avg_fill_price, coalesce(filled_at, submitted_at) as at, symbol
       from orders where status = 'filled' and filled_qty > 0 and avg_fill_price is not null`,
  );
  const bySymbol = new Map<string, typeof rows>();
  for (const r of rows) bySymbol.set(r.symbol, [...(bySymbol.get(r.symbol) ?? []), r]);

  const inserted: (ReturnType<typeof matchFifo>[number] & { symbol: string })[] = [];
  for (const [symbol, list] of bySymbol) {
    const matched = matchFifo(
      list.map((r) => ({
        alpacaOrderId: r.alpaca_order_id,
        clientOrderId: r.client_order_id,
        side: r.side,
        qty: Number(r.filled_qty),
        price: Number(r.avg_fill_price),
        at: new Date(r.at).toISOString(),
      })),
    );
    for (const t of matched) {
      const res = await query(
        `insert into trades (symbol, quantity, entry_price, exit_price, investment, exit_value, realized_pl, return_pct,
            exit_reason, entered_at, closed_at, holding_seconds, entry_alpaca_order_id, exit_alpaca_order_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         on conflict (entry_alpaca_order_id, exit_alpaca_order_id) do update set
           investment = excluded.investment, exit_value = excluded.exit_value,
           realized_pl = excluded.realized_pl, return_pct = excluded.return_pct
         returning id, (xmax = 0) as inserted`,
        [symbol, t.quantity, t.entryPrice, t.exitPrice, t.investment, t.exitValue, t.realizedPl, t.returnPct,
         t.exitReason, t.enteredAt, t.closedAt, t.holdingSeconds, t.entryOrderId, t.exitOrderId],
      );
      if (res.length && res[0].inserted) {
        inserted.push({ ...t, symbol });
        await logActivity({
          type: 'trade', level: t.realizedPl >= 0 ? 'success' : 'warning',
          title: `${symbol} trade closed (${t.exitReason})`,
          detail: `${t.quantity} sh, P/L ${t.realizedPl >= 0 ? '+' : ''}$${t.realizedPl.toFixed(2)} (${t.returnPct}%)`,
        });
      }
    }
  }
  return inserted;
}

const RECENT_MS = 24 * 3600_000;

/** Emails for events from the last 24h only (so a first sync never floods the inbox). Idempotent via sent_notifications. */
async function sendPendingEmails(created: Awaited<ReturnType<typeof rebuildTrades>>) {
  for (const t of created) {
    if (Date.now() - new Date(t.closedAt).getTime() < RECENT_MS) await notifyTrade(t);
  }
}

export const mapTrade = (r: any) => ({
  id: r.id,
  symbol: r.symbol,
  side: r.side,
  quantity: Number(r.quantity),
  entryPrice: Number(r.entry_price),
  exitPrice: Number(r.exit_price),
  investment: Number(r.investment),
  exitValue: Number(r.exit_value),
  realizedPL: Number(r.realized_pl),
  returnPct: Number(r.return_pct),
  exitReason: r.exit_reason,
  enteredAt: r.entered_at,
  closedAt: r.closed_at,
  holdingSeconds: Number(r.holding_seconds),
  notes: r.notes,
});

export async function listTrades(opts: { limit?: number; offset?: number; exitReason?: string; from?: string } = {}) {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (opts.exitReason) { params.push(opts.exitReason); conds.push(`exit_reason = $${params.length}`); }
  if (opts.from) { params.push(opts.from); conds.push(`closed_at >= $${params.length}`); }
  const where = conds.length ? `where ${conds.join(' and ')}` : '';
  const total = Number((await query(`select count(*) c from trades ${where}`, params))[0].c);
  params.push(Math.min(opts.limit ?? 50, 500), opts.offset ?? 0);
  const rows = await query(
    `select * from trades ${where} order by closed_at desc limit $${params.length - 1} offset $${params.length}`,
    params,
  );
  return { total, items: rows.map(mapTrade) };
}

export async function tradeStats() {
  const rows = await query<{ realized_pl: string }>('select realized_pl from trades');
  return computeStats(rows.map((r) => Number(r.realized_pl)));
}

/** Cumulative P/L per day for the history chart. */
export async function plSeries(days?: number) {
  const rows = await query<{ d: string; pl: string }>(
    `select (closed_at at time zone 'America/New_York')::date::text as d, sum(realized_pl) as pl
       from trades ${days ? `where closed_at >= now() - ($1 || ' days')::interval` : ''}
      group by 1 order by 1`,
    days ? [String(days)] : [],
  );
  let cum = 0;
  return rows.map((r) => {
    cum += Number(r.pl);
    return { date: r.d, dailyPL: Math.round(Number(r.pl) * 100) / 100, cumulativePL: Math.round(cum * 100) / 100 };
  });
}
