import { Router, type Request, type Response } from 'express';
import { alpaca } from '../alpaca.js';
import { config } from '../config.js';
import { actionUrl, verifyAction, type ActionType } from '../lib/actionLinks.js';
import { after } from '../lib/defer.js';
import { esc } from '../services/emailTemplates.js';
import { livePrice } from '../services/market.js';
import { getSettings } from '../services/settings.js';
import { editTargets, openLots, placeOrder, snoozeReview } from '../services/trading.js';
import { syncAll } from '../services/sync.js';

// Pages opened from the links inside emails. GET only shows a confirm page (safe for email link scanners);
// the action happens on POST, and the link is signed and expires after 7 days.
export const actions = Router();

const page = (title: string, body: string, ok = true) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#FFF7FA;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1F1720;">
<div style="max-width:460px;margin:40px auto;padding:0 16px;">
<div style="background:#831843;color:#fff;padding:16px 22px;border-radius:16px 16px 0 0;font-weight:700;">ABNB Trading Assistant</div>
<div style="background:#fff;border:1px solid #FCE7F3;border-top:0;border-radius:0 0 16px 16px;padding:22px;">
<h2 style="margin:0 0 12px;font-size:19px;color:${ok ? '#1F1720' : '#DC2626'};">${esc(title)}</h2>${body}</div></div></body></html>`;

const btn = (label: string, color = '#BE185D') =>
  `<button type="submit" style="background:${color};color:#fff;border:0;border-radius:10px;padding:11px 22px;font-weight:700;font-size:14px;cursor:pointer;">${esc(label)}</button>`;

async function loadLot(req: Request, action: ActionType) {
  const orderId = String(req.query.o ?? '');
  const exp = Number(req.query.e);
  const sig = String(req.query.s ?? '');
  if (!verifyAction(action, orderId, exp, sig)) return { error: 'This link is invalid or has expired (links last 7 days).' } as const;
  const lot = (await openLots()).find((l) => l.orderId === orderId);
  if (!lot) return { error: 'This order has no shares left to manage. It may already be sold.' } as const;
  return { lot, orderId } as const;
}

const send = (res: Response, html: string, status = 200) => res.status(status).type('html').send(html);

actions.get('/:action', async (req, res) => {
  const action = req.params.action as ActionType;
  if (!['wait', 'edit', 'sell'].includes(action)) return send(res, page('Unknown action', '<p>Not found.</p>', false), 404);
  const r = await loadLot(req, action);
  if ('error' in r) return send(res, page('Link problem', `<p>${esc(r.error)}</p>`, false), 400);
  const { lot } = r;
  const settings = await getSettings();
  const price = (await livePrice(lot.symbol).catch(() => ({ price: lot.fillPrice }))).price;
  const pl = (price - lot.fillPrice) * lot.openQty;
  const form = (inner: string) => `<form method="post" action="${esc(req.originalUrl)}">${inner}</form>`;
  const summary = `<p style="font-size:13px;color:#827581;line-height:1.6;margin:0 0 14px;">${esc(lot.symbol)} order <b>${esc(lot.orderId.slice(0, 8))}</b>: ${lot.openQty.toFixed(4)} shares bought at $${lot.fillPrice.toFixed(2)}, now $${price.toFixed(2)} (${pl >= 0 ? '+' : '-'}$${Math.abs(pl).toFixed(2)}). Target $${lot.targetPrice.toFixed(2)} (+${lot.targetPct}%).</p>`;

  if (action === 'wait') {
    return send(res, page(`Wait ${settings.holdingReviewDays} more days?`, summary + `<p style="font-size:14px;">Keep holding. You will get the next review email in ${settings.holdingReviewDays} days. The target stays at +${lot.targetPct}%.</p>` + form(btn(`Yes, wait ${settings.holdingReviewDays} more days`))));
  }
  if (action === 'edit') {
    return send(res, page('Change the profit target', summary + form(`<label style="font-size:13px;font-weight:600;">New profit target (%)</label><br>
<input name="target" type="number" step="0.1" min="0.1" max="100" value="${esc(Math.max(0.1, +(lot.targetPct / 2).toFixed(1)))}" style="margin:8px 0 14px;padding:10px;font-size:15px;border:1px solid #FCE7F3;border-radius:10px;width:120px;"> %<br>
<p style="font-size:12px;color:#827581;margin:0 0 14px;">This order will then be sold automatically when the price reaches this new target. The ${settings.holdingReviewDays}-day review timer restarts.</p>` + btn('Save new target'))));
  }
  return send(res, page('Sell these shares now?', summary + `<p style="font-size:14px;">This sells <b>${lot.openQty.toFixed(4)} shares</b> at market now (about ${pl >= 0 ? '+' : '-'}$${Math.abs(pl).toFixed(2)} profit/loss).</p>` + form(btn('Yes, sell now', '#DC2626'))));
});

actions.post('/:action', async (req, res) => {
  const action = req.params.action as ActionType;
  if (!['wait', 'edit', 'sell'].includes(action)) return send(res, page('Unknown action', '<p>Not found.</p>', false), 404);
  const r = await loadLot(req, action);
  if ('error' in r) return send(res, page('Link problem', `<p>${esc(r.error)}</p>`, false), 400);
  const { lot, orderId } = r;
  try {
    if (action === 'wait') {
      await snoozeReview(orderId);
      return send(res, page('Done: waiting', `<p>OK, you will get the next review in ${(await getSettings()).holdingReviewDays} days.</p>`));
    }
    if (action === 'edit') {
      const target = Number(req.body?.target);
      if (!(target >= 0.1 && target <= 100)) return send(res, page('Invalid target', '<p>Enter a number between 0.1 and 100.</p>', false), 400);
      await editTargets(orderId, target, 0);
      const px = +(lot.fillPrice * (1 + target / 100)).toFixed(2);
      return send(res, page('Target updated', `<p>This order now sells automatically at <b>$${px}</b> (+${target}%). The review timer restarted.</p>`));
    }
    const held = Number((await alpaca.positions()).find((p) => p.symbol === lot.symbol)?.qty ?? 0);
    const qty = Math.min(lot.openQty, held);
    if (qty <= 0) return send(res, page('Nothing to sell', '<p>You do not hold these shares any more.</p>', false), 400);
    await placeOrder({ symbol: lot.symbol, side: 'sell', type: 'market', qty: Math.floor(qty * 1e8) / 1e8 }, 'manual', `lot-${orderId}-${Date.now()}`);
    after(8_000, () => syncAll());
    return send(res, page('Sell order sent', `<p>Selling ${qty.toFixed(4)} shares at market. You will get a confirmation email with the profit/loss in a minute.</p><p style="font-size:12px;color:#827581;">Dashboard: ${esc(config.APP_URL)}</p>`));
  } catch (e) {
    return send(res, page('Something went wrong', `<p>${esc((e as Error).message)}</p>`, false), 500);
  }
});

export { actionUrl };
