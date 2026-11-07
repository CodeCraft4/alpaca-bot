import nodemailer, { type Transporter } from 'nodemailer';
import { alpaca } from '../alpaca.js';
import { config, flag } from '../config.js';
import { query } from '../db.js';
import { actionUrl } from '../lib/actionLinks.js';
import { logActivity } from './activity.js';
import { holdingText, type AccountSnapshot, renderReviewEmail, renderOrderEmail, renderRejectedEmail, renderTradeEmail, type OrderEmailData } from './emailTemplates.js';
import { getSettings, type Settings } from './settings.js';

let transporter: Transporter | null = null;

export const emailConfigured = () => Boolean(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);

function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: flag(config.SMTP_SECURE), // true for 465, false (STARTTLS) for 587
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });
  }
  return transporter;
}

let verifyCache: { at: number; value: string } | null = null;

export async function verifyEmail() {
  if (!emailConfigured()) return 'not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)';
  if (verifyCache && Date.now() - verifyCache.at < 60_000) return verifyCache.value;
  let value = 'ok';
  try { await getTransport().verify(); } catch (e) { value = `error: ${(e as Error).message}`; }
  verifyCache = { at: Date.now(), value };
  return value;
}

type Flag = 'orderPlaced' | 'orderFilled' | 'profitTargetFilled' | 'stopLossFilled' | 'manualSellFilled' | 'orderRejected';

function allowed(s: Settings, f: Flag | null) {
  if (!s.emailNotificationsEnabled) return false;
  if (!f) return true;
  const n = s.notifications as Record<string, boolean | undefined>;
  return n[f] ?? true; // new flags default to on
}

async function deliver(opts: { key: string | null; kind: string; flag: Flag | null; mail: { subject: string; html: string; text: string }; force?: boolean }) {
  const settings = await getSettings();
  const to = settings.recipientEmail || config.ALERT_NOTIFICATION_EMAIL;
  if (!opts.force && !allowed(settings, opts.flag)) return { sent: false, reason: 'disabled in settings' };
  if (!emailConfigured()) return { sent: false, reason: 'SMTP not configured' };
  if (!to) return { sent: false, reason: 'no recipient email' };

  if (opts.key) {
    const claimed = await query(
      `insert into sent_notifications (key, kind, recipient, subject) values ($1,$2,$3,$4) on conflict (key) do nothing returning key`,
      [opts.key, opts.kind, to, opts.mail.subject],
    );
    if (!claimed.length) return { sent: false, reason: 'already sent' };
  }
  try {
    await getTransport().sendMail({
      from: config.EMAIL_FROM || `ABNB Trading Bot <${config.SMTP_USER}>`,
      to, subject: opts.mail.subject, html: opts.mail.html, text: opts.mail.text,
    });
    return { sent: true, to };
  } catch (e) {
    if (opts.key) await query('delete from sent_notifications where key = $1', [opts.key]).catch(() => {});
    await logActivity({ type: 'system', level: 'error', title: `Email failed: ${opts.kind}`, detail: (e as Error).message });
    return { sent: false, reason: (e as Error).message };
  }
}

async function context(symbol: string) {
  const [spark, analysis, account] = await Promise.all([
    alpaca.bars(symbol, '1Day', new Date(Date.now() - 50 * 86_400_000).toISOString()).then((b) => b.slice(-30).map((x) => x.c)).catch(() => []),
    query(`select * from market_analyses where symbol=$1 order by created_at desc limit 1`, [symbol]).then((r) => r[0]).catch(() => null),
    alpaca.account().catch(() => null),
  ]);
  return {
    spark,
    equity: account ? Number(account.equity) : undefined,
    cash: account ? Number(account.cash) : undefined,
    buyingPower: account ? Number(account.buying_power) : undefined,
    sentiment: analysis ? { label: analysis.sentiment, confidence: analysis.confidence, summary: analysis.summary, provider: analysis.model ? `${analysis.provider} / ${analysis.model}` : analysis.provider } : null,
  };
}

const whenStr = (d = new Date()) => d.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' ET';

export interface PlacedInfo {
  count?: number;
  stage: 'placed' | 'filled';
  orderId: string; status: string; symbol: string; side: 'buy' | 'sell'; type: string;
  shares: number; entryPrice: number; currentPrice: number; cost: number;
  targetPct: number; targetPrice: number; stopLossPct: number; stopLossPrice: number | null;
}

export async function notifyOrder(i: PlacedInfo) {
  try {
    const ctx = await context(i.symbol);
    const data: OrderEmailData = { ...i, env: config.ALPACA_TRADING_ENV, when: whenStr(), appUrl: config.APP_URL, ...ctx };
    return await deliver({
      key: `${i.stage}:${i.orderId}`, kind: `order_${i.stage}`,
      flag: i.stage === 'placed' ? 'orderPlaced' : 'orderFilled', mail: renderOrderEmail(data),
    });
  } catch (e) {
    await logActivity({ type: 'system', level: 'warning', title: 'Order email skipped', detail: (e as Error).message });
    return { sent: false, reason: (e as Error).message };
  }
}

async function accountSnapshot(): Promise<AccountSnapshot | undefined> {
  try {
    const [a, positions] = await Promise.all([alpaca.account(), alpaca.positions()]);
    const p = positions.filter((x) => x.symbol === config.TRADING_SYMBOL);
    return {
      equity: Number(a.equity),
      cash: Number(a.cash),
      buyingPower: Number(a.buying_power),
      dayChange: Number(a.equity) - Number(a.last_equity),
      holdingShares: p.reduce((s2, x) => s2 + Number(x.qty), 0),
      holdingValue: p.reduce((s2, x) => s2 + Number(x.market_value), 0),
    };
  } catch {
    return undefined;
  }
}

export async function notifyTrade(t: {
  symbol: string; quantity: number; entryPrice: number; exitPrice: number; investment: number; exitValue: number;
  realizedPl: number; returnPct: number; exitReason: 'Profit Target' | 'Stop Loss' | 'Manual Sell';
  holdingSeconds: number; closedAt: string; entryOrderId: string; exitOrderId: string;
}) {
  try {
    const [account, stats, entry] = await Promise.all([
      accountSnapshot(),
      query(`select count(*)::int c, coalesce(sum(realized_pl),0) pl, count(*) filter (where realized_pl>0)::int w from trades`).then((r) => r[0]),
      query(`select target_pct, avg_fill_price from orders where alpaca_order_id = $1`, [t.entryOrderId]).then((r) => r[0]),
    ]);
    const exactPl = (t.exitPrice - t.entryPrice) * t.quantity; // not rounded to cents
    const targetPct = entry?.target_pct != null ? Number(entry.target_pct) : null;
    const mail = renderTradeEmail({
      symbol: t.symbol, shares: t.quantity, entryPrice: t.entryPrice, exitPrice: t.exitPrice,
      investment: t.entryPrice * t.quantity, exitValue: t.exitPrice * t.quantity, pl: exactPl, plPct: t.returnPct,
      reason: t.exitReason, holding: holdingText(t.holdingSeconds), closedAt: whenStr(new Date(t.closedAt)),
      env: config.ALPACA_TRADING_ENV, account, targetPct,
      targetPrice: targetPct != null ? +(t.entryPrice * (1 + targetPct / 100)).toFixed(2) : null,
      stats: { totalTrades: stats.c, winRate: stats.c ? (stats.w / stats.c) * 100 : 0, totalPl: Number(stats.pl) },
      appUrl: config.APP_URL,
    });
    const flagName: Flag = t.exitReason === 'Profit Target' ? 'profitTargetFilled' : t.exitReason === 'Stop Loss' ? 'stopLossFilled' : 'manualSellFilled';
    return await deliver({ key: `trade:${t.entryOrderId}:${t.exitOrderId}`, kind: 'trade_closed', flag: flagName, mail });
  } catch (e) {
    await logActivity({ type: 'system', level: 'warning', title: 'Trade email skipped', detail: (e as Error).message });
    return { sent: false, reason: (e as Error).message };
  }
}

export async function notifyRejected(symbol: string, side: string, reason: string) {
  return deliver({
    key: null, kind: 'order_rejected', flag: 'orderRejected',
    mail: renderRejectedEmail({ symbol, side, reason, env: config.ALPACA_TRADING_ENV, appUrl: config.APP_URL, when: whenStr() }),
  }).catch(() => ({ sent: false }));
}

/** Sends a sample "order placed" email built from live ABNB data, ignoring toggles. */
export async function sendTestEmail() {
  const symbol = config.TRADING_SYMBOL;
  const { price } = await alpaca.latestPrice(symbol);
  const s = await getSettings();
  const shares = Math.round((25 / price) * 10000) / 10000;
  const ctx = await context(symbol);
  const data: OrderEmailData = {
    stage: 'placed', symbol, side: 'buy', type: 'market', orderId: `TEST-${Date.now()}`, status: 'sample (not a real order)',
    env: config.ALPACA_TRADING_ENV, shares, entryPrice: price, currentPrice: price, cost: shares * price,
    targetPct: s.profitTargetPct, targetPrice: +(price * (1 + s.profitTargetPct / 100)).toFixed(2),
    stopLossPct: s.stopLossPct, stopLossPrice: +(price * (1 - s.stopLossPct / 100)).toFixed(2),
    when: whenStr(), appUrl: config.APP_URL, ...ctx,
  };
  return deliver({ key: null, kind: 'test', flag: null, force: true, mail: renderOrderEmail(data) });
}

/** One review email per buy order whose target was not reached within the review window. */
export async function notifyReview(i: {
  orderId: string; dueKey: string; symbol: string; shares: number; fillPrice: number; price: number; amountUsd: number;
  targetPct: number; targetPrice: number; heldDays: number; reviewDays: number;
}) {
  try {
    const ctx = await context(i.symbol);
    const mail = renderReviewEmail({
      symbol: i.symbol, orderShort: i.orderId.slice(0, 8), shares: i.shares, fillPrice: i.fillPrice, price: i.price,
      amountUsd: i.amountUsd, targetPct: i.targetPct, targetPrice: i.targetPrice, heldDays: i.heldDays, reviewDays: i.reviewDays,
      editUrl: actionUrl('edit', i.orderId), waitUrl: actionUrl('wait', i.orderId), sellUrl: actionUrl('sell', i.orderId),
      env: config.ALPACA_TRADING_ENV, appUrl: config.APP_URL, sentiment: ctx.sentiment,
    });
    return await deliver({ key: `review:${i.orderId}:${i.dueKey}`, kind: 'target_review', flag: null, mail });
  } catch (e) {
    return { sent: false, reason: (e as Error).message };
  }
}
