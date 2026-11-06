import { actionUrl } from '../src/lib/actionLinks.js';
import { getPool, query } from '../src/db.js';

const id = (await query(`select alpaca_order_id i from orders where alpaca_order_id like '2829f854%'`))[0].i as string;
const stage = process.argv[2];

if (stage === 'due') {
  await query(`update orders set review_due_at = now() - interval '1 minute' where alpaca_order_id = $1`, [id]);
  console.log('review timer set to the past for', id.slice(0, 8));
}
if (stage === 'check') {
  const o = (await query(`select target_pct, target_price, review_due_at from orders where alpaca_order_id = $1`, [id]))[0];
  console.log('order', id.slice(0, 8), '| target', o.target_pct, '% $' + o.target_price, '| next review', o.review_due_at);
  console.log('emails:', (await query(`select kind, subject from sent_notifications where kind = 'target_review' order by sent_at desc limit 3`)).map((r: any) => `${r.kind}: ${r.subject}`));
}
if (stage === 'pages') {
  for (const a of ['edit', 'wait', 'sell'] as const) {
    const url = actionUrl(a, id);
    const r = await fetch(url);
    const t = await r.text();
    console.log(a.padEnd(5), 'GET', r.status, '|', (t.match(/<h2[^>]*>(.*?)<\/h2>/) ?? [])[1]);
  }
  const bad = await fetch(actionUrl('edit', id).replace(/s=[0-9a-f]+/, 's=deadbeef'));
  console.log('tampered link ->', bad.status, '(expect 400)');
  const e = await fetch(actionUrl('edit', id), { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'target=0.01' });
  console.log('POST edit target=0.01 ->', e.status, ((await e.text()).match(/<h2[^>]*>(.*?)<\/h2>/) ?? [])[1]);
}
await getPool().end();
