import { alpaca } from '../alpaca.js';
import { config } from '../config.js';
import { query } from '../db.js';
import { analyze, type Analysis } from '../lib/indicators.js';
import { touchProbability } from '../lib/stats.js';
import { logActivity } from './activity.js';
import { aiAnalysis, type AiContext, type Provider } from './ai.js';
import { getPriceState } from './priceStream.js';
import { fhAnalysts, fhNews, fhNextEarnings, fhQuote, finnhubConfigured } from './finnhub.js';

export const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const nyDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const r2 = (n: number) => Math.round(n * 100) / 100;

export type PriceSource = 'finnhub' | 'alpaca-iex';

/** Single source of truth for "the current price": Finnhub when a key is set, else Alpaca IEX. */
export async function livePrice(symbol = config.TRADING_SYMBOL, maxAgeMs = 3_000): Promise<{ price: number; source: PriceSource; time: string }> {
  const hub = getPriceState().finnhub; // kept fresh every 2 s while a dashboard is open, and by WebSocket ticks
  if (hub && Date.now() - hub.at <= Math.max(maxAgeMs, 3_000)) {
    return { price: hub.price, source: 'finnhub', time: new Date(hub.tradeTs).toISOString() };
  }
  if (finnhubConfigured()) {
    try {
      const q = await fhQuote(symbol, maxAgeMs);
      return { price: q.c, source: 'finnhub', time: new Date(q.t * 1000).toISOString() };
    } catch {
      /* fall back below */
    }
  }
  const a = await alpaca.latestPrice(symbol);
  return { price: a.price, source: 'alpaca-iex', time: a.time };
}

export async function getQuote(symbol = config.TRADING_SYMBOL) {
  const clock = await alpaca.clock();
  const base = { symbol, marketOpen: clock.is_open, nextOpen: clock.next_open, nextClose: clock.next_close };

  if (finnhubConfigured()) {
    try {
      const q = await fhQuote(symbol);
      const hub = getPriceState().finnhub;
      const useHub = hub && hub.tradeTs >= q.t * 1000; // a WebSocket tick can be newer than the REST answer
      const price = useHub ? hub.price : q.c;
      const change = price - q.pc;
      return {
        ...base, source: 'finnhub' as PriceSource, price, time: new Date(useHub ? hub.tradeTs : q.t * 1000).toISOString(),
        previousClose: q.pc, change: r2(change), changePct: r2(q.pc ? (change / q.pc) * 100 : 0),
        open: q.o, high: Math.max(q.h, price), low: Math.min(q.l, price),
      };
    } catch {
      /* fall back to Alpaca */
    }
  }
  const [{ price, time }, prevClose] = await Promise.all([alpaca.latestPrice(symbol), alpaca.previousClose(symbol).catch(() => null)]);
  const change = prevClose ? price - prevClose : 0;
  return {
    ...base, source: 'alpaca-iex' as PriceSource, price, time, previousClose: prevClose,
    change: r2(change), changePct: prevClose ? r2((change / prevClose) * 100) : 0, open: null, high: null, low: null,
  };
}

export async function getBars(timeframe: Timeframe, symbol = config.TRADING_SYMBOL) {
  const spec: Record<Timeframe, { tf: string; start: string }> = {
    '1D': { tf: '5Min', start: daysAgo(5) },
    '1W': { tf: '1Hour', start: daysAgo(8) },
    '1M': { tf: '1Day', start: daysAgo(32) },
    '3M': { tf: '1Day', start: daysAgo(95) },
    '1Y': { tf: '1Week', start: daysAgo(370) },
  };
  let bars = await alpaca.bars(symbol, spec[timeframe].tf, spec[timeframe].start);
  if (timeframe === '1D' && bars.length) {
    const last = nyDate(bars[bars.length - 1].t);
    bars = bars.filter((b) => nyDate(b.t) === last); // most recent session only
  }
  return bars.map((b, i, arr) => {
    const slice = arr.slice(Math.max(0, i - 6), i + 1);
    return {
      time: b.t,
      open: b.o, high: b.h, low: b.l, price: b.c, volume: b.v,
      ma: i >= 6 ? r2(slice.reduce((a, x) => a + x.c, 0) / 7) : null,
    };
  });
}

/** Today's range stats and normal daily movement (ATR14), used to judge how far a target is. */
export async function getOutlook(symbol = config.TRADING_SYMBOL) {
  const bars = await alpaca.bars(symbol, '1Day', daysAgo(60));
  if (bars.length < 16) throw new Error('Not enough daily bars');
  const trs = bars.slice(1).map((b, i) => Math.max(b.h - b.l, Math.abs(b.h - bars[i].c), Math.abs(b.l - bars[i].c)));
  const atr = trs.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const today = bars[bars.length - 1];
  const live = await livePrice(symbol).catch(() => null);
  const last = live?.price ?? today.c;
  return {
    symbol,
    source: live?.source ?? 'alpaca-iex',
    today: {
      open: today.o,
      high: Math.max(today.h, last),
      low: Math.min(today.l, last),
      last,
      rangePct: r2(((Math.max(today.h, last) - Math.min(today.l, last)) / today.o) * 100),
    },
    atr14: r2(atr),
    atrPct: r2((atr / last) * 100),
  };
}

/** The open position (if any) with probabilities of touching target / stop within 1, 3 and 5 trading days. */
export async function getPositionOutlook(symbol: string, sigmaDaily: number | null) {
  const pos = (await alpaca.positions().catch(() => [])).find((p) => p.symbol === symbol);
  if (!pos) return null;
  const { price } = await livePrice(symbol);
  const qty = Number(pos.qty);
  const avgEntry = Number(pos.avg_entry_price);
  const { openLots } = await import('./trading.js'); // dynamic: trading.ts imports this module
  const lots = await openLots(symbol);
  const targetPrice = lots.length ? Math.min(...lots.map((l) => l.targetPrice)) : avgEntry * (1 + config.DEFAULT_PROFIT_TARGET_PCT / 100);
  const stopPrice: number | null = null; // stop-loss is not used
  const opened = (await query(`select min(filled_at) t from orders where symbol=$1 and side='buy' and status='filled'`, [symbol]))[0]?.t;
  const heldDays = opened ? (Date.now() - new Date(opened).getTime()) / 86_400_000 : 0;
  const probs = (barrier: number) =>
    sigmaDaily ? { d1: r2(touchProbability(price, barrier, sigmaDaily, 1) * 100), d3: r2(touchProbability(price, barrier, sigmaDaily, 3) * 100), d5: r2(touchProbability(price, barrier, sigmaDaily, 5) * 100) } : null;
  return {
    qty, avgEntry, price, targetPrice: r2(targetPrice), stopPrice: stopPrice ? r2(stopPrice) : null,
    plPct: r2(((price - avgEntry) / avgEntry) * 100),
    needToTargetPct: r2(((targetPrice - price) / price) * 100),
    heldDays: r2(heldDays),
    probabilities: { target: probs(targetPrice), stop: stopPrice ? probs(stopPrice) : null },
  };
}

const CACHE_MINUTES = 15;

export async function getAnalysis(opts: { refresh?: boolean; symbol?: string } = {}) {
  const symbol = opts.symbol ?? config.TRADING_SYMBOL;
  let row: any = null;
  let cached = false;
  let aiError: string | undefined;

  if (!opts.refresh) {
    row = (await query(
      `select * from market_analyses where symbol = $1 and created_at > now() - ($2 || ' minutes')::interval
        order by created_at desc limit 1`,
      [symbol, String(CACHE_MINUTES)],
    ))[0] ?? null;
    cached = Boolean(row);
  }

  if (!row) {
    const bars = await alpaca.bars(symbol, '1Day', daysAgo(160));
    const rules: Analysis = analyze(bars);
    const live = await livePrice(symbol).catch(() => ({ price: rules.indicators.price, source: 'alpaca-iex' as PriceSource, time: '' }));

    // Context from Finnhub (each call is optional: analysis still works without it)
    const settle = async <T>(p: Promise<T>): Promise<T | null> => p.catch(() => null);
    const [news, earnings, analysts, posInfo] = await Promise.all([
      finnhubConfigured() ? settle(fhNews(symbol)) : Promise.resolve(null),
      finnhubConfigured() ? settle(fhNextEarnings(symbol)) : Promise.resolve(null),
      finnhubConfigured() ? settle(fhAnalysts(symbol)) : Promise.resolve(null),
      settle(getPositionOutlook(symbol, rules.indicators.sigmaDaily)),
    ]);
    const ctx: AiContext = {
      price: live.price, priceSource: live.source, news: news ?? [], earnings, analysts,
      position: posInfo ? { qty: posInfo.qty, avgEntry: posInfo.avgEntry, targetPrice: posInfo.targetPrice, stopPrice: posInfo.stopPrice, heldDays: posInfo.heldDays, plPct: posInfo.plPct } : null,
    };

    let out: { sentiment: string; confidence: number; bullishPct: number; neutralPct: number; bearishPct: number; summary: string; provider: string; model: string | null; risks?: string[]; advice?: string } = { ...rules, provider: 'rules', model: null };
    if (config.ANALYSIS_PROVIDER !== 'rules') {
      try {
        out = { ...out, ...(await aiAnalysis(config.ANALYSIS_PROVIDER as Provider, symbol, rules, bars, ctx)) };
      } catch (e) {
        aiError = (e as Error).message;
        await logActivity({ type: 'analysis', level: 'warning', title: `${config.ANALYSIS_PROVIDER} analysis failed, using rules`, detail: aiError });
      }
    }
    const stored = {
      ...rules.indicators,
      ai: { risks: out.risks ?? [], advice: out.advice ?? null },
      context: { news: ctx.news.slice(0, 5), earnings, analysts, priceSource: live.source },
    };
    row = (await query(
      `insert into market_analyses (symbol, sentiment, confidence, bullish_pct, neutral_pct, bearish_pct, score, summary, indicators, provider, model)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
      [symbol, out.sentiment, out.confidence, out.bullishPct, out.neutralPct, out.bearishPct, rules.score, out.summary,
       JSON.stringify(stored), out.provider, out.model],
    ))[0];
    await logActivity({ type: 'analysis', title: `${symbol} analysis (${out.provider}): ${out.sentiment}`, detail: out.summary });
  }

  const a = mapAnalysis(row);
  // The position block is always fresh (live price + current position), even for a cached analysis.
  const position = await getPositionOutlook(symbol, a.indicators?.sigmaDaily ?? null).catch(() => null);
  return { ...a, cached, position, ...(aiError ? { aiError } : {}) };
}

const mapAnalysis = (r: any) => ({
  symbol: r.symbol,
  sentiment: r.sentiment,
  confidence: r.confidence,
  bullishPct: r.bullish_pct,
  neutralPct: r.neutral_pct,
  bearishPct: r.bearish_pct,
  score: Number(r.score),
  summary: r.summary,
  indicators: r.indicators,
  risks: (r.indicators?.ai?.risks ?? []) as string[],
  advice: (r.indicators?.ai?.advice ?? null) as string | null,
  context: r.indicators?.context ?? { news: [], earnings: null, analysts: null, priceSource: null },
  provider: r.provider,
  model: r.model,
  createdAt: r.created_at,
  disclaimer: 'Technical indicators and public news only. Not financial advice; probabilities are rough estimates from recent volatility.',
});
