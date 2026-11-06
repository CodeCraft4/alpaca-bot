import type { Candle } from './indicators.js';

export function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

/** MACD(12,26,9). Needs >= 35 values for a stable signal line. */
export function macd(closes: number[]) {
  if (closes.length < 35) return null;
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const line = closes.map((_, i) => e12[i] - e26[i]);
  const signal = ema(line, 9);
  const i = closes.length - 1;
  return { macd: line[i], signal: signal[i], hist: line[i] - signal[i], prevHist: line[i - 1] - signal[i - 1] };
}

/** Bollinger Bands (20, 2). percentB: 0 = lower band, 1 = upper band. */
export function bollinger(closes: number[], period = 20, mult = 2) {
  if (closes.length < period) return null;
  const w = closes.slice(-period);
  const mean = w.reduce((a, b) => a + b, 0) / period;
  const sd = Math.sqrt(w.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
  const upper = mean + mult * sd;
  const lower = mean - mult * sd;
  const price = closes[closes.length - 1];
  return { upper, lower, mid: mean, percentB: upper === lower ? 0.5 : (price - lower) / (upper - lower), bandwidthPct: (mean ? ((upper - lower) / mean) * 100 : 0) };
}

export function atr(candles: Candle[], period = 14): number | null {
  if (candles.length <= period) return null;
  const trs = candles.slice(1).map((c, i) => Math.max(c.h - c.l, Math.abs(c.h - candles[i].c), Math.abs(c.l - candles[i].c)));
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

/** Daily volatility = stdev of daily log returns. */
export function dailySigma(closes: number[], window = 30): number | null {
  if (closes.length < 6) return null;
  const c = closes.slice(-(window + 1));
  const rets = c.slice(1).map((v, i) => Math.log(v / c[i]));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  return Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1));
}

/** Standard normal CDF (Abramowitz-Stegun). */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/**
 * Probability that price touches `barrier` at any time within `days` trading days (zero-drift random walk,
 * reflection principle). A rough guide from recent volatility, not a forecast.
 */
export function touchProbability(price: number, barrier: number, sigmaDaily: number, days: number): number {
  if (!(price > 0) || !(barrier > 0) || !(sigmaDaily > 0) || days <= 0) return 0;
  if ((barrier >= price && price >= barrier) || barrier === price) return 1;
  const dist = Math.abs(Math.log(barrier / price));
  const p = 2 * (1 - normalCdf(dist / (sigmaDaily * Math.sqrt(days))));
  return Math.min(1, Math.max(0, p));
}

/** Nearest swing levels from the last `window` bars. */
export function levels(candles: Candle[], window = 20) {
  const w = candles.slice(-window);
  return { support: Math.min(...w.map((c) => c.l)), resistance: Math.max(...w.map((c) => c.h)) };
}

export function volumeRatio(candles: Candle[]): number | null {
  if (candles.length < 21) return null;
  const v = candles.map((c) => c.v);
  const recent = v.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const base = v.slice(-25, -5).reduce((a, b) => a + b, 0) / Math.max(1, v.slice(-25, -5).length);
  return base ? recent / base : null;
}
