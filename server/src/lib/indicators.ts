export interface Candle { t: string; o: number; h: number; l: number; c: number; v: number }

export const sma = (values: number[], period: number): number | null =>
  values.length < period ? null : values.slice(-period).reduce((a, b) => a + b, 0) / period;

/** Wilder's RSI. */
export function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgG = gain / period;
  let avgL = loss / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgG = (avgG * (period - 1) + Math.max(d, 0)) / period;
    avgL = (avgL * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgL === 0) return 100;
  return 100 - 100 / (1 + avgG / avgL);
}

import { atr, bollinger, dailySigma, levels, macd, volumeRatio } from './stats.js';

const clamp = (n: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, n));
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface Analysis {
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  confidence: number;
  bullishPct: number;
  neutralPct: number;
  bearishPct: number;
  score: number;
  summary: string;
  indicators: {
    price: number;
    sma20: number | null;
    sma50: number | null;
    rsi14: number | null;
    momentum5d: number | null;
    signals: Record<string, number>;
    macdHist: number | null;
    macdCross: 'bullish' | 'bearish' | null;
    bollingerPctB: number | null;
    bollingerBandwidthPct: number | null;
    atr14: number | null;
    sigmaDaily: number | null; // daily volatility (fraction)
    volumeRatio: number | null; // last 5d avg volume / prior 20d
    support: number;
    resistance: number;
    rangePos: number; // 0..100: where price sits between support and resistance
  };
}

/** Deterministic technical analysis from daily candles (oldest -> newest). */
export function analyze(candles: Candle[]): Analysis {
  if (candles.length < 20) throw new Error('Not enough data: need at least 20 daily bars');
  const closes = candles.map((c) => c.c);
  const price = closes[closes.length - 1];
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  const r = rsi(closes, 14);
  const mom = closes.length > 5 ? ((price - closes[closes.length - 6]) / closes[closes.length - 6]) * 100 : null;

  const signals: Record<string, number> = {};
  if (s20) signals.trend = clamp(((price - s20) / s20) * 20); // +-5% from SMA20 = full signal
  if (s20 && s50) signals.crossover = clamp(((s20 - s50) / s50) * 25);
  if (r !== null) signals.rsi = r > 70 ? -clamp((r - 70) / 15) : r < 30 ? clamp((30 - r) / 15) : clamp((r - 50) / 40);
  if (mom !== null) signals.momentum = clamp(mom / 5);

  const mc = macd(closes);
  if (mc) signals.macd = clamp((mc.hist / price) * 400); // histogram as % of price
  const bb = bollinger(closes);
  // Mean-reversion flavour: touching the upper band is a caution, the lower band a bounce candidate
  if (bb) signals.bollinger = bb.percentB > 1 ? -clamp((bb.percentB - 1) * 2) : bb.percentB < 0 ? clamp(-bb.percentB * 2) : clamp((bb.percentB - 0.5) * 0.6);
  const vr = volumeRatio(candles);
  // Volume only confirms the direction of the recent move
  if (vr !== null && mom !== null) signals.volume = clamp((vr - 1) * 0.5) * Math.sign(mom);
  const lv = levels(candles);
  const at = atr(candles);
  const sigma = dailySigma(closes);

  const vals = Object.values(signals);
  const s = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

  const neutralPct = Math.round(40 * (1 - Math.abs(s)) + 10);
  const rest = 100 - neutralPct;
  const bullishPct = Math.round((rest * (1 + s)) / 2);
  const bearishPct = rest - bullishPct;
  const sentiment = s > 0.25 ? 'Bullish' : s < -0.25 ? 'Bearish' : 'Neutral';
  const confidence = Math.round(50 + 50 * Math.abs(s));

  const parts = [
    s20 ? `Price is ${price >= s20 ? 'above' : 'below'} the 20-day average ($${r2(s20)})` : null,
    s20 && s50 ? `20-day average is ${s20 >= s50 ? 'above' : 'below'} the 50-day` : null,
    r !== null ? `RSI(14) is ${r2(r)}${r > 70 ? ' (overbought)' : r < 30 ? ' (oversold)' : ''}` : null,
    mom !== null ? `5-day momentum is ${mom >= 0 ? '+' : ''}${r2(mom)}%` : null,
    mc ? `MACD histogram is ${mc.hist >= 0 ? 'positive' : 'negative'}${Math.sign(mc.hist) !== Math.sign(mc.prevHist) ? ' (just crossed)' : ''}` : null,
    bb && (bb.percentB > 1 || bb.percentB < 0) ? `price is ${bb.percentB > 1 ? 'above the upper' : 'below the lower'} Bollinger band` : null,
    `support ~$${r2(lv.support)}, resistance ~$${r2(lv.resistance)}`,
  ].filter(Boolean);

  return {
    sentiment,
    confidence,
    bullishPct,
    neutralPct,
    bearishPct,
    score: r2(s * 100),
    summary: `${sentiment} bias. ${parts.join('; ')}.`,
    indicators: {
      price,
      sma20: s20 ? r2(s20) : null,
      sma50: s50 ? r2(s50) : null,
      rsi14: r !== null ? r2(r) : null,
      momentum5d: mom !== null ? r2(mom) : null,
      signals,
      macdHist: mc ? r2(mc.hist) : null,
      macdCross: mc && Math.sign(mc.hist) !== Math.sign(mc.prevHist) ? (mc.hist > 0 ? 'bullish' : 'bearish') : null,
      bollingerPctB: bb ? r2(bb.percentB) : null,
      bollingerBandwidthPct: bb ? r2(bb.bandwidthPct) : null,
      atr14: at !== null ? r2(at) : null,
      sigmaDaily: sigma !== null ? Math.round(sigma * 10000) / 10000 : null,
      volumeRatio: vr !== null ? r2(vr) : null,
      support: r2(lv.support),
      resistance: r2(lv.resistance),
      rangePos: lv.resistance > lv.support ? Math.round(((price - lv.support) / (lv.resistance - lv.support)) * 100) : 50,
    },
  };
}
