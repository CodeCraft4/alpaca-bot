import { alpaca } from '../src/alpaca.js';

const [acct, pos, ord] = await Promise.all([alpaca.account(), alpaca.positions(), alpaca.orders('all', 4)]);
console.log(`ALPACA account ${acct.account_number}: equity $${acct.equity}, cash $${acct.cash}, buying power $${acct.buying_power}`);
for (const p of pos) {
  console.log(`ALPACA position: ${p.symbol} qty ${p.qty} avg $${p.avg_entry_price} now $${p.current_price} mktValue $${p.market_value} P/L $${p.unrealized_pl}`);
}
for (const o of ord) {
  console.log(`ALPACA order: ${o.submitted_at.slice(11, 19)}Z ${o.side} ${o.type} ${o.notional ? '$' + o.notional : o.qty + 'sh'} -> ${o.status} filled ${o.filled_qty}@${o.filled_avg_price}`);
}

// "Aaj target cross hoga?": daily range statistics
const bars = await alpaca.bars('ABNB', '1Day', new Date(Date.now() - 60 * 864e5).toISOString());
const trs = bars.slice(1).map((b, i) => Math.max(b.h - b.l, Math.abs(b.h - bars[i].c), Math.abs(b.l - bars[i].c)));
const atr = trs.slice(-14).reduce((a, b) => a + b, 0) / 14;
const today = bars[bars.length - 1];
const px = Number(pos[0]?.current_price ?? today.c);
const entry = Number(pos[0]?.avg_entry_price ?? px);
const tp = entry * 1.05;
const sl = entry * 0.97;
console.log(`\nTODAY: open ${today.o} high ${today.h} low ${today.l} last ${today.c} | range so far ${(((today.h - today.l) / today.o) * 100).toFixed(2)}%`);
console.log(`ATR(14) = $${atr.toFixed(2)} (${((atr / px) * 100).toFixed(2)}% of price)`);
console.log(`Target $${tp.toFixed(2)} needs +${(((tp - px) / px) * 100).toFixed(2)}% = $${(tp - px).toFixed(2)} from now (${((tp - px) / atr).toFixed(2)}x a normal daily range)`);
console.log(`Stop   $${sl.toFixed(2)} is -${(((px - sl) / px) * 100).toFixed(2)}% = $${(px - sl).toFixed(2)} from now (${((px - sl) / atr).toFixed(2)}x a normal daily range)`);
const big = trs.slice(-30).filter((t) => t >= tp - px).length;
console.log(`Last 30 sessions whose full high-low range was >= the move needed: ${big}/30`);
