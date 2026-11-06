// Email-safe HTML (tables + inline styles). No external images, so it renders in Gmail/Outlook/Apple Mail.

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const usd = (n: number, sign = false) =>
  `${sign && n > 0 ? '+' : n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** Dollars with cents; tiny amounts (under 1 cent) keep 4 decimals so they never show as $0.00. */
export const money = (n: number, sign = false) => {
  const a = Math.abs(n);
  const d = a > 0 && a < 0.01 ? 4 : 2;
  const body = a.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${n < 0 ? '-' : sign && n > 0 ? '+' : ''}$${body}`;
};
const cents = (n: number) => {
  const c = n * 100;
  return `${c >= 0 ? '+' : '-'}${Math.abs(c).toFixed(Math.abs(c) < 10 ? 2 : 1)}\u00A2`;
};
const pct = (n: number, sign = true) => `${sign && n > 0 ? '+' : ''}${n.toFixed(2)}%`;

const C = {
  brand: '#BE185D', dark: '#831843', bg: '#FFF7FA', card: '#FFFFFF', border: '#FCE7F3',
  text: '#1F1720', muted: '#827581', good: '#16A34A', bad: '#DC2626', goodBg: '#F0FDF4', badBg: '#FEF2F2',
};

export interface OrderEmailData {
  stage: 'placed' | 'filled';
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  orderId: string;
  status: string;
  env: string;
  shares: number; // estimated or actual
  entryPrice: number;
  currentPrice: number;
  cost: number;
  targetPct: number;
  targetPrice: number;
  stopLossPct: number;
  stopLossPrice: number | null; // null = no stop-loss
  sentiment?: { label: string; confidence: number; summary: string; provider: string } | null;
  spark: number[]; // recent daily closes, oldest -> newest
  equity?: number;
  cash?: number;
  buyingPower?: number;
  when: string;
  appUrl: string;
}

export interface AccountSnapshot {
  equity: number;
  cash: number;
  buyingPower: number;
  dayChange: number; // equity today minus equity at yesterday's close
  holdingShares: number;
  holdingValue: number;
}

export interface TradeEmailData {
  symbol: string;
  shares: number;
  entryPrice: number;
  exitPrice: number;
  investment: number;
  exitValue: number;
  pl: number; // exact (not rounded to cents)
  plPct: number;
  reason: 'Profit Target' | 'Stop Loss' | 'Manual Sell';
  holding: string;
  closedAt: string;
  env: string;
  equity?: number;
  targetPct?: number | null;
  targetPrice?: number | null;
  account?: AccountSnapshot;
  stats?: { totalTrades: number; winRate: number; totalPl: number };
  appUrl: string;
}

export const holdingText = (seconds: number) => {
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

/** Reward-to-risk and the P/L at target / stop for a position. */
export function orderMath(entry: number, shares: number, targetPrice: number, stopPrice: number | null, side: 'buy' | 'sell' = 'buy') {
  const dir = side === 'buy' ? 1 : -1;
  const profitAtTarget = dir * (targetPrice - entry) * shares;
  const lossAtStop = stopPrice === null ? null : dir * (stopPrice - entry) * shares; // negative number
  const rr = lossAtStop ? Math.abs(profitAtTarget / lossAtStop) : null;
  return { profitAtTarget: Math.round(profitAtTarget * 100) / 100, lossAtStop: lossAtStop === null ? null : Math.round(lossAtStop * 100) / 100, rr: rr ? Math.round(rr * 100) / 100 : null };
}

const shell = (opts: { preheader: string; title: string; badge: string; badgeColor: string; body: string; env: string }) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${C.text};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.card};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">
  <tr><td style="background:${C.dark};padding:20px 28px;">
    <table role="presentation" width="100%"><tr>
      <td style="color:#fff;font-size:16px;font-weight:700;letter-spacing:.3px;">ABNB Trading Assistant</td>
      <td align="right"><span style="display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;">${esc(opts.env.toUpperCase())} MODE</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 8px;">
    <span style="display:inline-block;background:${opts.badgeColor};color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:.4px;">${esc(opts.badge)}</span>
    <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;color:${C.text};">${esc(opts.title)}</h1>
  </td></tr>
  ${opts.body}
  <tr><td style="padding:20px 28px 28px;border-top:1px solid ${C.border};">
    <p style="margin:0;font-size:11px;line-height:1.6;color:${C.muted};">This is an automated message from your trading bot. Targets and analysis are estimates based on technical indicators, not financial advice. Prices can gap through stop levels and fills may differ from estimates. Trading involves risk of loss.</p>
  </td></tr>
</table></td></tr></table></body></html>`;

const kpi = (label: string, value: string, color = C.text, bg = C.bg) =>
  `<td width="50%" style="padding:6px;"><table role="presentation" width="100%" style="background:${bg};border:1px solid ${C.border};border-radius:12px;"><tr><td style="padding:12px 14px;">
  <div style="font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:.5px;">${esc(label)}</div>
  <div style="font-size:19px;font-weight:700;color:${color};margin-top:4px;">${esc(value)}</div></td></tr></table></td>`;
const kpiRow = (a: string, b: string) => `<tr>${a}${b}</tr>`;
const kpiGrid = (rows: string[]) =>
  `<tr><td style="padding:12px 22px 0;"><table role="presentation" width="100%">${rows.join('')}</table></td></tr>`;

const section = (title: string, inner: string) =>
  `<tr><td style="padding:18px 28px 0;"><div style="font-size:13px;font-weight:700;color:${C.dark};margin-bottom:10px;">${esc(title)}</div>${inner}</td></tr>`;

const detailRows = (rows: [string, string][]) =>
  `<table role="presentation" width="100%" style="font-size:13px;">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:${C.muted};border-bottom:1px solid ${C.border};">${esc(k)}</td><td align="right" style="padding:6px 0;font-weight:600;border-bottom:1px solid ${C.border};">${esc(v)}</td></tr>`)
    .join('')}</table>`;

/** Stop -> Entry -> Target bar with a marker for the current price. */
export function rangeBar(stopIn: number | null, entry: number, target: number, current: number): string {
  const stop = stopIn ?? Math.min(entry, current) * 0.99; // no stop: just a neutral left margin
  const lo = Math.min(stop, current, entry, target), hi = Math.max(stop, current, entry, target);
  const span = hi - lo || 1;
  const p = (v: number) => Math.round(((v - lo) / span) * 1000) / 10;
  const stopP = p(stop), entryP = p(entry), targetP = p(target), curP = Math.min(98, Math.max(0, p(current)));
  const seg = (w: number, color: string) => (w > 0 ? `<td width="${w}%" style="background:${color};height:12px;font-size:0;line-height:0;">&nbsp;</td>` : '');
  return `<table role="presentation" width="100%" style="border-radius:6px;overflow:hidden;"><tr>
    ${seg(stopP, '#E5E7EB')}${seg(Math.max(0, entryP - stopP), '#FCA5A5')}${seg(Math.max(0, targetP - entryP), '#86EFAC')}${seg(Math.max(0, 100 - targetP), '#E5E7EB')}
  </tr></table>
  <table role="presentation" width="100%"><tr>
    <td width="${curP}%" style="font-size:0;line-height:0;">&nbsp;</td>
    <td style="font-size:11px;color:${C.brand};font-weight:700;white-space:nowrap;">&#9650; Now ${esc(usd(current))}</td>
  </tr></table>
  <table role="presentation" width="100%" style="font-size:11px;color:${C.muted};margin-top:6px;"><tr>
    <td align="left"><span style="color:${stopIn === null ? C.muted : C.bad};font-weight:700;">${stopIn === null ? 'No stop-loss' : `Stop ${esc(usd(stop))}`}</span></td>
    <td align="center"><span style="font-weight:700;color:${C.text};">Entry ${esc(usd(entry))}</span></td>
    <td align="right"><span style="color:${C.good};font-weight:700;">Target ${esc(usd(target))}</span></td>
  </tr></table>`;
}

/** 30-day mini bar chart from daily closes. */
export function sparkBars(closes: number[]): string {
  if (closes.length < 2) return '';
  const lo = Math.min(...closes), hi = Math.max(...closes), span = hi - lo || 1;
  const cells = closes
    .map((c, i) => {
      const h = 8 + Math.round(((c - lo) / span) * 52);
      const color = i === closes.length - 1 ? C.brand : c >= (closes[i - 1] ?? c) ? '#86EFAC' : '#FCA5A5';
      return `<td valign="bottom" style="padding:0 1px;"><div style="height:${h}px;background:${color};border-radius:2px 2px 0 0;font-size:0;line-height:0;">&nbsp;</div></td>`;
    })
    .join('');
  const chg = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
  return `<table role="presentation" width="100%" style="height:64px;"><tr>${cells}</tr></table>
  <table role="presentation" width="100%" style="font-size:11px;color:${C.muted};margin-top:4px;"><tr>
    <td>${closes.length}-day low ${esc(usd(lo))}</td><td align="center" style="color:${chg >= 0 ? C.good : C.bad};font-weight:700;">${esc(pct(chg))} over period</td><td align="right">high ${esc(usd(hi))}</td></tr></table>`;
}

export function renderOrderEmail(d: OrderEmailData) {
  const m = orderMath(d.entryPrice, d.shares, d.targetPrice, d.stopLossPrice, 'buy');
  const verb = d.side === 'buy' ? 'BUY' : 'SELL';
  const title = d.stage === 'placed'
    ? `${verb} order placed: ${d.symbol}`
    : `${verb} order filled: ${d.symbol}`;
  const sent = d.sentiment;
  const sentColor = sent?.label === 'Bullish' ? C.good : sent?.label === 'Bearish' ? C.bad : C.muted;

  const body =
    kpiGrid([
      kpiRow(kpi('Position size', `${d.shares.toFixed(4)} sh`), kpi('Estimated cost', usd(d.cost))),
      kpiRow(
        kpi(`Profit at target (+${d.targetPct}%)`, usd(m.profitAtTarget, true), C.good, C.goodBg),
        m.lossAtStop === null
          ? kpi('Stop-loss', 'None (held manually)', C.muted)
          : kpi(`Loss at stop (-${d.stopLossPct}%)`, usd(m.lossAtStop, true), C.bad, C.badBg),
      ),
    ]) +
    section('Where price sits vs your plan', rangeBar(d.stopLossPrice, d.entryPrice, d.targetPrice, d.currentPrice)) +
    (d.spark.length > 1 ? section(`${d.symbol}: last ${d.spark.length} trading days`, sparkBars(d.spark)) : '') +
    section('Order details', detailRows([
      ['Symbol', d.symbol],
      ['Side / type', `${verb} · ${d.type.toUpperCase()}`],
      ['Status', d.status],
      ['Entry price', usd(d.entryPrice)],
      ['Target price', `${usd(d.targetPrice)} (${pct(d.targetPct)})`],
      ['Stop-loss price', d.stopLossPrice === null ? 'None: you decide when to sell' : `${usd(d.stopLossPrice)} (-${d.stopLossPct.toFixed(2)}%)`],
      ['Reward : Risk', m.rr ? `${m.rr} : 1` : 'n/a'],
      ...(d.equity !== undefined ? [['Account equity', money(d.equity)] as [string, string]] : []),
      ...(d.cash !== undefined ? [['Cash available', money(d.cash)] as [string, string]] : []),
      ...(d.buyingPower !== undefined ? [['Buying power', money(d.buyingPower)] as [string, string]] : []),
      ['Order ID', d.orderId.slice(0, 13)],
      ['Time', d.when],
    ])) +
    (sent
      ? section('Market analysis', `<table role="presentation" width="100%" style="background:${C.bg};border:1px solid ${C.border};border-radius:12px;"><tr><td style="padding:12px 14px;font-size:13px;line-height:1.55;">
        <span style="font-weight:700;color:${sentColor};">${esc(sent.label)}</span> <span style="color:${C.muted};">· ${sent.confidence}% confidence · ${esc(sent.provider)}</span><br>${esc(sent.summary)}</td></tr></table>`)
      : '') +
    `<tr><td style="padding:22px 28px 0;"><a href="${esc(d.appUrl)}/orders" style="display:inline-block;background:${C.brand};color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 22px;border-radius:10px;">Open dashboard</a></td></tr><tr><td style="height:8px"></td></tr>`;

  const text = [
    title, '',
    `Size: ${d.shares.toFixed(4)} sh   Cost: ${usd(d.cost)}   Entry: ${usd(d.entryPrice)}`,
    `Target: ${usd(d.targetPrice)} (${pct(d.targetPct)}) -> ${usd(m.profitAtTarget, true)}`,
    d.stopLossPrice === null ? 'Stop:   none (manual exit)' : `Stop:   ${usd(d.stopLossPrice)} (-${d.stopLossPct}%) -> ${usd(m.lossAtStop ?? 0, true)}`,
    `Reward:Risk ${m.rr ?? 'n/a'}   Status: ${d.status}   Order: ${d.orderId}`,
    sent ? `Analysis: ${sent.label} (${sent.confidence}%) ${sent.summary}` : '',
  ].filter(Boolean).join('\n');

  return {
    subject: `${d.stage === 'placed' ? '📌' : '✅'} ${verb} ${d.symbol} ${d.stage}: target ${usd(m.profitAtTarget, true)} / ${m.lossAtStop === null ? 'no stop' : `stop ${usd(m.lossAtStop, true)}`}`,
    html: shell({ preheader: `Target ${usd(d.targetPrice)} (${usd(m.profitAtTarget, true)})${d.stopLossPrice === null ? ', no stop-loss' : `, stop ${usd(d.stopLossPrice)} (${usd(m.lossAtStop ?? 0, true)})`}`, title, badge: d.stage === 'placed' ? 'ORDER PLACED' : 'ORDER FILLED', badgeColor: C.brand, body, env: d.env }),
    text,
  };
}

const accountSection = (acc: AccountSnapshot) =>
  section('Your account right now', detailRows([
    ['Total equity', money(acc.equity)],
    ['Cash available', money(acc.cash)],
    ['Buying power', money(acc.buyingPower)],
    ["Today's change", `${money(acc.dayChange, true)} (${cents(acc.dayChange)})`],
    ['Still holding', acc.holdingShares > 0 ? `${acc.holdingShares.toFixed(4)} shares (${money(acc.holdingValue)})` : 'nothing (all sold)'],
  ]));

export function renderTradeEmail(t: TradeEmailData) {
  const win = t.pl > 0;
  const flat = t.pl === 0;
  const color = flat ? C.muted : win ? C.good : C.bad;
  const bg = flat ? C.bg : win ? C.goodBg : C.badBg;
  const perShare = t.exitPrice - t.entryPrice;
  const badge =
    t.reason === 'Stop Loss' ? 'STOP LOSS TRIGGERED'
      : t.reason === 'Profit Target' && win ? 'PROFIT TARGET HIT'
        : win ? 'SOLD AT A PROFIT' : flat ? 'SOLD AT BREAK-EVEN' : 'SOLD AT A LOSS';
  const title = `${t.symbol} sold: ${win ? 'profit' : flat ? 'break-even' : 'loss'} ${money(t.pl, true)} (${pct(t.plPct)})`;
  const targetHit = t.targetPrice != null ? t.exitPrice >= t.targetPrice : null;
  const body =
    kpiGrid([
      kpiRow(kpi(win ? 'Profit' : 'Profit / loss', money(t.pl, true), color, bg), kpi('Return on this trade', pct(t.plPct), color, bg)),
      kpiRow(kpi('Points per share', `${perShare >= 0 ? '+' : '-'}$${Math.abs(perShare).toFixed(2)}`, color), kpi('In cents', cents(t.pl), color)),
    ]) +
    section('Entry, target and exit', detailRows([
      ['Entry price (bought at)', usd(t.entryPrice)],
      ...(t.targetPrice != null
        ? [['Target price', `${usd(t.targetPrice)}${t.targetPct != null ? ` (+${t.targetPct}%)` : ''} ${targetHit ? '✓ reached' : '✗ not reached'}`] as [string, string]]
        : []),
      ['Exit price (sold at)', usd(t.exitPrice)],
      ['Move per share (points)', `${perShare >= 0 ? '+' : '-'}$${Math.abs(perShare).toFixed(2)}`],
      ['Shares sold', t.shares.toFixed(4)],
      ['Money in', money(t.investment)],
      ['Money out', money(t.exitValue)],
      ['Profit / loss', money(t.pl, true)],
      ['Why it was sold', t.reason === 'Profit Target' ? 'Target price reached (automatic)' : t.reason === 'Stop Loss' ? 'Stop-loss' : 'Sold manually by you'],
      ['Held for', t.holding],
      ['Closed at', t.closedAt],
    ])) +
    (t.account ? accountSection(t.account) : t.equity !== undefined ? section('Account', detailRows([['Total equity', money(t.equity)]])) : '') +
    (t.stats
      ? section('Your track record', detailRows([
          ['Completed trades', String(t.stats.totalTrades)],
          ['Win rate', `${t.stats.winRate.toFixed(1)}%`],
          ['Total realized profit / loss', money(t.stats.totalPl, true)],
        ]))
      : '') +
    `<tr><td style="padding:22px 28px 0;"><a href="${esc(t.appUrl)}/history" style="display:inline-block;background:${C.brand};color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 22px;border-radius:10px;">View trade history</a></td></tr><tr><td style="height:8px"></td></tr>`;
  return {
    subject: `${win ? '💰' : flat ? '➖' : '🔻'} ${t.symbol} sold ${money(t.pl, true)} (${cents(t.pl)}) · ${t.reason}`,
    html: shell({ preheader: `${money(t.pl, true)} on ${t.symbol}: bought ${usd(t.entryPrice)}, sold ${usd(t.exitPrice)}`, title, badge, badgeColor: color, body, env: t.env }),
    text: `${title}\nBought ${usd(t.entryPrice)} -> sold ${usd(t.exitPrice)} x ${t.shares.toFixed(4)} (${perShare >= 0 ? '+' : '-'}$${Math.abs(perShare).toFixed(2)} per share)\nProfit/loss ${money(t.pl, true)} (${cents(t.pl)})\nReason: ${t.reason}. Held: ${t.holding}`,
  };
}

export function renderRejectedEmail(d: { symbol: string; side: string; reason: string; env: string; appUrl: string; when: string }) {
  const title = `${d.side.toUpperCase()} ${d.symbol} order rejected`;
  const body = section('What happened', `<table role="presentation" width="100%" style="background:${C.badBg};border:1px solid #FECACA;border-radius:12px;"><tr><td style="padding:14px;font-size:13px;line-height:1.6;color:${C.text};">${esc(d.reason)}</td></tr></table>`) +
    section('Details', detailRows([['Symbol', d.symbol], ['Side', d.side.toUpperCase()], ['Time', d.when]])) + '<tr><td style="height:16px"></td></tr>';
  return { subject: `⚠️ ${title}`, html: shell({ preheader: d.reason, title, badge: 'ORDER REJECTED', badgeColor: C.bad, body, env: d.env }), text: `${title}\n${d.reason}` };
}

export interface ReviewEmailData {
  symbol: string;
  orderShort: string;
  shares: number;
  fillPrice: number;
  price: number;
  amountUsd: number;
  targetPct: number;
  targetPrice: number;
  heldDays: number;
  reviewDays: number;
  editUrl: string;
  waitUrl: string;
  sellUrl: string;
  env: string;
  appUrl: string;
  sentiment?: { label: string; confidence: number; summary: string } | null;
}

/** "Your target was not reached in N days: edit it, wait, or sell." One email per buy order. */
export function renderReviewEmail(d: ReviewEmailData) {
  const pl = (d.price - d.fillPrice) * d.shares;
  const plPct = ((d.price - d.fillPrice) / d.fillPrice) * 100;
  const win = pl >= 0;
  const color = win ? C.good : C.bad;
  const needPct = ((d.targetPrice - d.price) / d.price) * 100;
  const needUsd = (d.targetPrice - d.price) * d.shares;
  const title = `${d.symbol} target not reached after ${Math.floor(d.heldDays)} days: what now?`;
  const button = (href: string, label: string, bg: string, fg = '#fff', border = bg) =>
    `<a href="${esc(href)}" style="display:block;text-align:center;background:${bg};color:${fg};border:2px solid ${border};text-decoration:none;font-weight:700;font-size:14px;padding:12px 16px;border-radius:10px;margin-bottom:10px;">${esc(label)}</a>`;
  const body =
    `<tr><td style="padding:6px 28px 0;font-size:14px;line-height:1.6;color:${C.text};">You set a <b>+${d.targetPct}% target ($${d.targetPrice.toFixed(2)})</b> on this order. It has not been reached in <b>${d.heldDays.toFixed(1)} days</b> (your review window is ${d.reviewDays} days). It is still open and nothing was sold.</td></tr>` +
    kpiGrid([
      kpiRow(kpi('Profit / loss now', usd(pl, true), color, win ? C.goodBg : C.badBg), kpi('Return', pct(plPct), color, win ? C.goodBg : C.badBg)),
      kpiRow(kpi('Still needed for target', needPct > 0 ? `${pct(needPct)} (${usd(needUsd, true)})` : 'reached'), kpi('Invested', usd(d.amountUsd))),
    ]) +
    section('This order', detailRows([
      ['Order', d.orderShort],
      ['Shares', d.shares.toFixed(4)],
      ['Bought at', usd(d.fillPrice)],
      ['Price now', usd(d.price)],
      ['Target', `${usd(d.targetPrice)} (+${d.targetPct}%)`],
      ['Stop-loss', 'None (you decide)'],
    ])) +
    (d.sentiment
      ? section('Latest market analysis', `<table role="presentation" width="100%" style="background:${C.bg};border:1px solid ${C.border};border-radius:12px;"><tr><td style="padding:12px 14px;font-size:13px;line-height:1.55;"><b>${esc(d.sentiment.label)}</b> · ${d.sentiment.confidence}% confidence<br>${esc(d.sentiment.summary)}</td></tr></table>`)
      : '') +
    section('Choose what to do', button(d.editUrl, 'Change the target (e.g. 5% → 2%)', C.brand) + button(d.waitUrl, `Wait ${d.reviewDays} more days`, '#FFFFFF', C.brand, C.brand) + button(d.sellUrl, 'Sell these shares now', '#FFFFFF', C.bad, C.bad)) +
    `<tr><td style="padding:4px 28px 0;font-size:12px;color:${C.muted};line-height:1.6;">If you do nothing, the order stays open and we will remind you again in ${d.reviewDays} days. If you lower the target, this order sells automatically when the price reaches the new target. Each button opens a confirm page first.</td></tr><tr><td style="height:16px"></td></tr>`;
  return {
    subject: `⏰ ${d.symbol}: ${Math.floor(d.heldDays)} days, target not reached (${usd(pl, true)}). Edit, wait or sell?`,
    html: shell({ preheader: `Target $${d.targetPrice.toFixed(2)} not reached. P/L ${usd(pl, true)}. Edit it, wait, or sell.`, title, badge: 'TARGET REVIEW', badgeColor: C.brand, body, env: d.env }),
    text: `${title}
Target ${usd(d.targetPrice)} (+${d.targetPct}%), now ${usd(d.price)} (${usd(pl, true)}).
Change target: ${d.editUrl}
Wait: ${d.waitUrl}
Sell: ${d.sellUrl}`,
  };
}
