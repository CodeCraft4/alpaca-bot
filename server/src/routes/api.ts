import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { alpaca } from '../alpaca.js';
import { config, flag } from '../config.js';
import { dbConfigProblem, dbConfigured, query } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { emailConfigured, sendTestEmail, verifyEmail } from '../services/notify.js';
import { listActivity } from '../services/activity.js';
import { automationState, runAutomationOnce } from '../services/automation.js';
import { offPrice, onPrice, type PriceState } from '../services/priceStream.js';
import { TIMEFRAMES, getAnalysis, getBars, getOutlook, getQuote, livePrice, type Timeframe } from '../services/market.js';
import { getSettings, resetSettings, settingsPatchSchema, updateSettings } from '../services/settings.js';
import { listTrades, plSeries, syncAll, tradeStats } from '../services/sync.js';
import {
  cancelOrder, closePosition, editTargets, listOrders, openLots, orderSchema, placeOrder, mapOrder,
} from '../services/trading.js';

type H = (req: Request, res: Response) => Promise<unknown>;
const wrap = (fn: H) => (req: Request, res: Response, next: NextFunction) =>
  fn(req, res).then((data) => data !== undefined && res.json(data)).catch(next);

const parse = <T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> => {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), 'validation');
  return r.data;
};

export const api = Router();

const analysisLabel = () => {
  const p = config.ANALYSIS_PROVIDER;
  if (p === 'rules') return 'Indicators (rules)';
  const key = p === 'groq' ? config.GROQ_API_KEY : p === 'anthropic' ? config.ANTHROPIC_API_KEY : config.XAI_API_KEY;
  const model = p === 'groq' ? config.GROQ_MODEL : p === 'anthropic' ? config.ANTHROPIC_MODEL : config.XAI_MODEL;
  return key ? `${p}: ${model}` : `${p} key missing (using rules)`;
};

api.get('/health', wrap(async () => {
  const check = async (fn: () => Promise<unknown>) => {
    try { await fn(); return 'ok'; } catch (e) { return `error: ${(e as Error).message}`; }
  };
  const [alpacaStatus, dbStatus, emailStatus] = await Promise.all([
    config.ALPACA_API_KEY_ID ? check(() => alpaca.clock()) : Promise.resolve('not configured'),
    dbConfigured() ? check(() => query('select 1')) : Promise.resolve(dbConfigProblem() ?? 'not configured'),
    emailConfigured() ? verifyEmail() : Promise.resolve('not configured'),
  ]);
  return {
    status: 'ok',
    env: config.ALPACA_TRADING_ENV,
    port: config.PORT,
    alpaca: alpacaStatus,
    database: dbStatus,
    analysis: analysisLabel(),
    email: emailStatus,
    automation: { enabled: flag(config.AUTOMATION_ENABLED), dryRun: flag(config.AUTOMATION_DRY_RUN), ...automationState },
  };
}));

// --- Live price stream (Server-Sent Events) ---------------------------------
api.get('/stream/price', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();

  let timer: NodeJS.Timeout | null = null;
  let latest: PriceState | null = null;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const send = (s: PriceState) => {
    const f = s.finnhub;
    if (!f) return;
    const change = f.pc ? r2(f.price - f.pc) : null;
    res.write(`data: ${JSON.stringify({
      price: f.price, change, changePct: f.pc ? r2(((f.price - f.pc) / f.pc) * 100) : null,
      lastTradeTs: f.tradeTs, high: f.high, low: f.low,
      alpaca: s.alpaca ? { price: s.alpaca.price, lastTradeTs: s.alpaca.tradeTs } : null,
      sentAt: Date.now(),
    })}\n\n`);
  };
  // at most ~10 messages per second, always the newest values
  const handler = (s: PriceState) => {
    latest = s;
    if (!timer) timer = setTimeout(() => { timer = null; if (latest) send(latest); }, 100);
  };
  onPrice(handler);
  // first message right away, so the page does not wait for the next trade
  void import('../services/priceStream.js').then((m) => send(m.getPriceState()));
  const hb = setInterval(() => res.write(': ping\n\n'), 15_000);
  req.on('close', () => {
    offPrice(handler);
    clearInterval(hb);
    if (timer) clearTimeout(timer);
  });
});

// --- Account ---------------------------------------------------------------
api.get('/account', wrap(async () => {
  const a = await alpaca.account();
  const equity = Number(a.equity);
  return {
    accountNumber: a.account_number,
    status: a.status,
    currency: a.currency,
    equity,
    cash: Number(a.cash),
    buyingPower: Number(a.buying_power),
    lastEquity: Number(a.last_equity),
    dayChange: Math.round((equity - Number(a.last_equity)) * 100) / 100,
    env: config.ALPACA_TRADING_ENV,
  };
}));

// --- Market ----------------------------------------------------------------
api.get('/market/quote', wrap(() => getQuote()));
api.get('/market/bars', wrap(async (req) => {
  const tf = String(req.query.timeframe ?? '1D').toUpperCase() as Timeframe;
  if (!TIMEFRAMES.includes(tf)) throw new HttpError(400, `timeframe must be one of ${TIMEFRAMES.join(', ')}`);
  return { timeframe: tf, bars: await getBars(tf) };
}));
api.get('/market/outlook', wrap(() => getOutlook()));
api.get('/market/analysis', wrap((req) => getAnalysis({ refresh: req.query.refresh === 'true' })));

// --- Positions -------------------------------------------------------------
api.get('/positions', wrap(async () => {
  const [positions, rules, lots] = await Promise.all([alpaca.positions(), query('select * from position_rules'), openLots()]);
  // One live price (Finnhub when configured) so every number on the dashboard agrees
  const prices = new Map<string, number>();
  for (const s of new Set(positions.map((p) => p.symbol))) {
    prices.set(s, await livePrice(s).then((x) => x.price).catch(() => Number(positions.find((p) => p.symbol === s)!.current_price)));
  }
  return positions.filter((p) => Number(p.qty) > 1e-6).map((p) => { // hide rounding dust
    const r = rules.find((x) => x.symbol === p.symbol);
    const mine = lots.filter((l) => l.symbol === p.symbol);
    const nearest = mine.length ? mine.reduce((a, b) => (b.targetPrice < a.targetPrice ? b : a)) : null;
    const qty = Number(p.qty);
    const avg = Number(p.avg_entry_price);
    const price = prices.get(p.symbol)!;
    return {
      id: p.asset_id,
      symbol: p.symbol,
      quantity: qty,
      avgEntry: avg,
      currentPrice: price,
      marketValue: Math.round(qty * price * 100) / 100,
      unrealizedPL: Math.round(qty * (price - avg) * 100) / 100,
      unrealizedPLPct: Math.round(((price - avg) / avg) * 10000) / 100,
      // Targets belong to each buy order; the position shows the nearest one. Stop-loss is not used.
      targetPrice: nearest ? nearest.targetPrice : r ? Number(r.target_price) : null,
      targetPct: nearest ? nearest.targetPct : r ? Number(r.target_pct) : null,
      lots: mine.length,
      stopLossPrice: null,
      stopLossPct: 0,
    };
  });
}));

const closeSchema = z.object({ qty: z.number().positive().optional() }).strict();
api.post('/positions/:symbol/close', wrap(async (req) => {
  const { qty } = parse(closeSchema, req.body ?? {});
  const order = mapOrder(await closePosition(String(req.params.symbol), qty));
  setTimeout(() => void syncAll().catch(() => undefined), 8_000); // pick up the fill -> trade -> email quickly
  return order;
}));

// --- Orders ----------------------------------------------------------------
api.get('/orders', wrap(async (req) =>
  listOrders({ status: req.query.status as string | undefined, limit: Number(req.query.limit) || undefined })));

api.post('/orders', wrap(async (req, res) => {
  const body = parse(orderSchema, req.body);
  res.status(201);
  return mapOrder(await placeOrder(body, 'manual'));
}));

const sellSchema = z.object({ qty: z.number().positive().optional() }).strict();
api.post('/orders/:id/sell', wrap(async (req) => {
  const { qty: wanted } = parse(sellSchema, req.body ?? {});
  const id = String(req.params.id);
  let symbol = config.TRADING_SYMBOL;
  let want = wanted;
  let heldHint: number | undefined;

  if (want === undefined) {
    // No quantity given (e.g. called by hand): look the order up and check the position
    const [lot, positions] = await Promise.all([openLots().then((ls) => ls.find((l) => l.orderId === id)), alpaca.positions()]);
    if (!lot) throw new HttpError(404, 'This order has no shares left to sell');
    symbol = lot.symbol;
    heldHint = Number(positions.find((p) => p.symbol === symbol)?.qty ?? 0);
    want = Math.min(lot.openQty, heldHint);
  }
  // Fast path (dashboard): trust the quantity it shows; Alpaca refuses a sell larger than the position anyway.
  // Round DOWN by a hair: database quantities have 8 decimals, Alpaca holds 9.
  const qty = Math.floor(want * 1e8 - 1) / 1e8;
  if (!(qty > 0)) throw new HttpError(409, 'You do not hold these shares any more');
  const row = await placeOrder({ symbol, side: 'sell', type: 'market', qty }, 'manual', `lot-${id}-${Date.now()}`, { heldQty: heldHint ?? Number.POSITIVE_INFINITY });
  setTimeout(() => void syncAll().catch(() => undefined), 8_000); // fill -> trade -> "sold" email
  return mapOrder(row);
}));

api.delete('/orders/:id', wrap(async (req) => mapOrder(await cancelOrder(String(req.params.id)))));

const targetsSchema = z.object({ targetPct: z.number().positive().max(100), stopLossPct: z.number().min(0).max(100).optional() }).strict();
api.patch('/orders/:id/targets', wrap(async (req) => {
  const b = parse(targetsSchema, req.body);
  return mapOrder(await editTargets(String(req.params.id), b.targetPct, b.stopLossPct ?? 0));
}));

// --- Trades / P&L ----------------------------------------------------------
api.get('/trades', wrap(async (req) => listTrades({
  limit: Number(req.query.limit) || undefined,
  offset: Number(req.query.offset) || undefined,
  exitReason: req.query.exitReason as string | undefined,
  from: req.query.from as string | undefined,
})));
api.get('/trades/stats', wrap(() => tradeStats()));
api.get('/trades/pl-series', wrap(async (req) => plSeries(req.query.days ? Number(req.query.days) : undefined)));

// --- Settings --------------------------------------------------------------
api.get('/settings', wrap(() => getSettings()));
api.put('/settings', wrap(async (req) => updateSettings(parse(settingsPatchSchema, req.body))));
api.post('/settings/reset', wrap(() => resetSettings()));

// --- Activity / sync / automation -----------------------------------------
api.get('/activity', wrap((req) => listActivity(Number(req.query.limit) || 50)));
api.post('/notifications/test', wrap(async () => sendTestEmail()));
api.post('/sync', wrap(() => syncAll()));
api.post('/automation/run', wrap(async (req) => runAutomationOnce({ force: req.query.force === 'true' })));
api.get('/automation/status', wrap(async () => ({
  enabled: flag(config.AUTOMATION_ENABLED), dryRun: flag(config.AUTOMATION_DRY_RUN),
  intervalSec: config.AUTOMATION_INTERVAL_SEC, ...automationState,
})));
