import { actionUrl } from '../src/lib/actionLinks.js';
import { getPool, query } from '../src/db.js';

const API = 'http://localhost:4555/api';
const id = (await query(`select alpaca_order_id i from orders where alpaca_order_id like '2829f854%'`))[0].i as string;

// 1) Change the target of THIS order only, exactly like the email button does
const e = await fetch(actionUrl('edit', id), { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'target=0.1' });
console.log('edit target 0.1% ->', e.status, ((await e.text()).match(/<h2[^>]*>(.*?)<\/h2>/) ?? [])[1]);
const o = (await query(`select target_pct, target_price, avg_fill_price from orders where alpaca_order_id = $1`, [id]))[0];
console.log(`order target is now ${o.target_pct}% = $${o.target_price} (bought at $${o.avg_fill_price})`);
const others = await query(`select left(alpaca_order_id,8) i, target_pct, target_price from orders where side='buy' and status='filled' and alpaca_order_id <> $1`, [id]);
console.log('other orders keep their own targets:', others.map((r: any) => `${r.i}: ${r.target_pct}% $${r.target_price}`).join(' | '));

// 2) Wait for the price to reach it; the worker (every 60s) must sell only this order
const start = Date.now();
while (Date.now() - start < 9 * 60_000) {
  const q: any = await (await fetch(`${API}/market/quote`)).json();
  const orders: any[] = await (await fetch(`${API}/orders`)).json();
  const sell = orders.find((x) => x.side === 'sell' && String(x.clientOrderId).startsWith(`auto-tp-${id}`));
  if (sell) {
    console.log(`AUTO-SELL happened: ${sell.status}, ${sell.filledQty} sh @ ${sell.avgFillPrice}, client id ${sell.clientOrderId.slice(0, 20)}...`);
    await new Promise((r) => setTimeout(r, 8000));
    await fetch(`${API}/sync`, { method: 'POST' });
    const t = (await query(`select quantity, entry_price, exit_price, realized_pl, exit_reason, left(entry_alpaca_order_id,8) e from trades order by closed_at desc limit 2`));
    console.log('latest trades:', JSON.stringify(t));
    const left: any[] = await (await fetch(`${API}/orders`)).json();
    console.log('open orders afterwards:', left.filter((x) => x.side === 'buy' && x.openQty > 0).map((x) => `${x.id.slice(0, 8)} open ${x.openQty}`).join(' | '));
    const em = await query(`select kind, subject from sent_notifications order by sent_at desc limit 2`);
    console.log('emails:', em.map((r: any) => r.subject));
    await getPool().end();
    process.exit(0);
  }
  console.log(new Date().toISOString().slice(11, 19), `price ${q.price} vs target ${o.target_price}  (waiting)`);
  await new Promise((r) => setTimeout(r, 20_000));
}
console.log('TIMEOUT: price never reached the target in 9 minutes');
await getPool().end();
