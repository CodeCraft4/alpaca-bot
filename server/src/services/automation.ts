import { alpaca } from '../alpaca.js';
import { config, flag } from '../config.js';
import { query } from '../db.js';
import { logActivity } from './activity.js';
import { livePrice } from './market.js';
import { notifyReview } from './notify.js';
import { getSettings } from './settings.js';
import { syncAll } from './sync.js';
import { openLots, placeOrder, snoozeReview } from './trading.js';

let timer: NodeJS.Timeout | null = null;
let running = false;
export const automationState = { lastRun: null as string | null, lastResult: null as unknown, running: false };

const OPEN_SELL = ['new', 'accepted', 'pending_new', 'partially_filled', 'held', 'pending_replace'];

/**
 * One automation pass.
 *  1. sync orders/trades from Alpaca
 *  2. review reminders: for every buy order whose target was not reached within the review window, send ONE email
 *     (edit target / wait / sell) and schedule the next reminder
 *  3. profit target: for every buy order whose OWN target price is reached, sell exactly that order's shares
 * There is deliberately no stop-loss selling.
 */
export async function runAutomationOnce(opts: { force?: boolean } = {}) {
  if (running) return { skipped: 'already running' };
  running = true;
  try {
    const dryRun = flag(config.AUTOMATION_DRY_RUN);
    const settings = await getSettings();
    if (settings.emergencyKillSwitch) return { skipped: 'kill switch on' };

    await syncAll();
    const symbol = config.TRADING_SYMBOL;
    const lots = await openLots(symbol);
    const actions: unknown[] = [];

    if (lots.length) {
      const price = (await livePrice(symbol)).price;

      // ---- 2. review reminders (works any time, market open or not) ----
      if (settings.holdingPeriodReminder) {
        const windowMs = settings.holdingReviewDays * 86_400_000;
        for (const lot of lots) {
          if (price >= lot.targetPrice) continue; // target hit: handled below, no reminder needed
          const due = lot.reviewDueAt ? new Date(lot.reviewDueAt).getTime() : new Date(lot.filledAt).getTime() + windowMs;
          if (Date.now() < due) continue;
          const heldDays = (Date.now() - new Date(lot.filledAt).getTime()) / 86_400_000;
          const res = await notifyReview({
            orderId: lot.orderId, dueKey: new Date(due).toISOString(), symbol: lot.symbol, shares: lot.openQty,
            fillPrice: lot.fillPrice, price, amountUsd: lot.amountUsd, targetPct: lot.targetPct,
            targetPrice: lot.targetPrice, heldDays, reviewDays: settings.holdingReviewDays,
          });
          // If nobody answers, ask again after another review window
          await snoozeReview(lot.orderId, settings.holdingReviewDays);
          await logActivity({
            type: 'automation', level: 'warning',
            title: `Review ${lot.symbol} order ${lot.orderId.slice(0, 8)}: ${heldDays.toFixed(1)} days, target $${lot.targetPrice} not reached`,
            detail: `now $${price.toFixed(2)}; email ${(res as { sent?: boolean }).sent ? 'sent' : 'not sent'}. Next reminder in ${settings.holdingReviewDays} days`,
          });
          actions.push({ order: lot.orderId.slice(0, 8), result: 'review reminder', emailed: (res as { sent?: boolean }).sent ?? false });
        }
      }

      // ---- 3. profit target auto-sell (market hours only) ----
      if (settings.autoProfitTargetExit) {
        const clock = await alpaca.clock();
        if (!clock.is_open && !opts.force) {
          actions.push({ result: 'market closed: no target selling' });
        } else {
          const pending = await query(`select 1 from orders where symbol = $1 and side = 'sell' and status = any($2) limit 1`, [symbol, OPEN_SELL]);
          if (pending.length) {
            actions.push({ result: 'a sell order is already pending' });
          } else {
            const held = Number((await alpaca.positions()).find((p) => p.symbol === symbol)?.qty ?? 0);
            let remainingHeld = held;
            for (const lot of lots.filter((l) => price >= l.targetPrice)) {
              const qty = Math.floor(Math.min(lot.openQty, remainingHeld) * 1e8) / 1e8;
              if (qty <= 0) continue;
              const profit = qty * (price - lot.fillPrice);
              if (dryRun) {
                await logActivity({
                  type: 'automation', level: 'warning', title: `[DRY RUN] Target hit for order ${lot.orderId.slice(0, 8)}`,
                  detail: `$${price.toFixed(2)} >= $${lot.targetPrice}; would sell ${qty} shares (~${profit >= 0 ? '+' : ''}$${profit.toFixed(2)})`,
                });
                actions.push({ order: lot.orderId.slice(0, 8), result: 'dry-run' });
                continue;
              }
              try {
                await placeOrder({ symbol, side: 'sell', type: 'market', qty }, 'automation', `auto-tp-${lot.orderId}-${Date.now()}`);
                remainingHeld -= qty;
                await logActivity({
                  type: 'automation', level: 'success', title: `Profit target hit: selling order ${lot.orderId.slice(0, 8)}`,
                  detail: `${qty} shares near $${price.toFixed(2)} (target $${lot.targetPrice}, ~${profit >= 0 ? '+' : ''}$${profit.toFixed(2)})`,
                });
                actions.push({ order: lot.orderId.slice(0, 8), result: 'sold', qty });
              } catch (e) {
                actions.push({ order: lot.orderId.slice(0, 8), result: `sell failed: ${(e as Error).message}` });
              }
            }
          }
        }
      }
    }

    const result = { dryRun, openOrders: lots.length, actions };
    automationState.lastRun = new Date().toISOString();
    automationState.lastResult = result;
    return result;
  } catch (e) {
    const msg = (e as Error).message;
    automationState.lastResult = { error: msg };
    await logActivity({ type: 'automation', level: 'error', title: 'Automation pass failed', detail: msg });
    throw e;
  } finally {
    running = false;
  }
}

export function startAutomation() {
  if (!flag(config.AUTOMATION_ENABLED) || timer) return;
  automationState.running = true;
  timer = setInterval(() => runAutomationOnce().catch((e) => console.error('automation:', e.message)),
    config.AUTOMATION_INTERVAL_SEC * 1000);
  console.log(`automation: every ${config.AUTOMATION_INTERVAL_SEC}s (dryRun=${config.AUTOMATION_DRY_RUN})`);
}

export function stopAutomation() {
  if (timer) clearInterval(timer);
  timer = null;
  automationState.running = false;
}
