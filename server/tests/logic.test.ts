import { describe, expect, it } from 'vitest';
import { assertSafeTradingConfig } from '../src/config.js';
import { analyze, rsi, sma } from '../src/lib/indicators.js';
import { validateOrder, type RiskContext } from '../src/lib/risk.js';
import { computeStats, exitDecision, exitReasonOf, matchFifo } from '../src/lib/trades.js';

const ctx = (over: Partial<RiskContext> = {}, s: Partial<RiskContext['settings']> = {}): RiskContext => ({
  allowedSymbol: 'ABNB',
  currentPrice: 100,
  buyingPower: 1000,
  heldQty: 0,
  settings: { emergencyKillSwitch: false, manualBuyOnly: true, ...s },
  ...over,
});
const buy = (o: object = {}) => ({ symbol: 'ABNB', side: 'buy' as const, type: 'market' as const, source: 'manual' as const, ...o });

describe('risk validation', () => {
  it('allows a buy of any size the account can afford (there is no daily limit)', () => {
    expect(validateOrder(buy({ notional: 40 }), ctx()).estimatedValue).toBe(40);
  });
  it('rejects other symbols', () => {
    expect(() => validateOrder(buy({ symbol: 'TSLA', notional: 10 }), ctx())).toThrow(/Only ABNB/);
  });
  it('has no daily spending cap', () => {
    expect(validateOrder(buy({ notional: 900 }), ctx({ buyingPower: 5000 })).estimatedValue).toBe(900);
  });
  it('blocks buys when kill switch is on but allows sells', () => {
    const c = ctx({ heldQty: 1 }, { emergencyKillSwitch: true });
    expect(() => validateOrder(buy({ notional: 10 }), c)).toThrow(/kill switch/i);
    expect(() => validateOrder({ ...buy({ qty: 1 }), side: 'sell' }, c)).not.toThrow();
  });
  it('blocks automation buys when manual-buy-only', () => {
    expect(() => validateOrder(buy({ notional: 10, source: 'automation' }), ctx())).toThrow(/Manual-buy-only/);
  });
  it('rejects selling more than held', () => {
    expect(() => validateOrder({ ...buy({ qty: 2 }), side: 'sell' }, ctx({ heldQty: 1 }))).toThrow(/only 1 held/);
  });
  it('needs exactly one of qty / notional and a limit price for limit orders', () => {
    expect(() => validateOrder(buy({}), ctx())).toThrow(/required/);
    expect(() => validateOrder(buy({ qty: 1, notional: 10 }), ctx())).toThrow(/not both/);
    expect(() => validateOrder(buy({ qty: 1, type: 'limit' }), ctx())).toThrow(/limit_price/);
  });
  it('rejects insufficient buying power', () => {
    expect(() => validateOrder(buy({ notional: 40 }), ctx({ buyingPower: 10 }))).toThrow(/buying power/);
  });
});

describe('config guard', () => {
  it('refuses a live URL without explicit enable', () => {
    expect(() => assertSafeTradingConfig({ ALPACA_API_BASE_URL: 'https://api.alpaca.markets', ALPACA_TRADING_ENV: 'paper', ALLOW_LIVE: 'false' })).toThrow();
    expect(() => assertSafeTradingConfig({ ALPACA_API_BASE_URL: 'https://paper-api.alpaca.markets', ALPACA_TRADING_ENV: 'live', ALLOW_LIVE: 'false' })).toThrow();
  });
  it('accepts paper', () => {
    expect(() => assertSafeTradingConfig({ ALPACA_API_BASE_URL: 'https://paper-api.alpaca.markets', ALPACA_TRADING_ENV: 'paper', ALLOW_LIVE: 'false' })).not.toThrow();
  });
});

describe('FIFO trade matching', () => {
  const o = (id: string, side: 'buy' | 'sell', qty: number, price: number, at: string, cid: string | null = null) =>
    ({ alpacaOrderId: id, clientOrderId: cid, side, qty, price, at });

  it('pairs a full round trip and computes P/L', () => {
    const t = matchFifo([o('b1', 'buy', 2, 100, '2026-01-01T10:00:00Z'), o('s1', 'sell', 2, 110, '2026-01-01T12:00:00Z')]);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ realizedPl: 20, returnPct: 10, holdingSeconds: 7200, exitReason: 'Manual Sell' });
  });
  it('splits one sell across multiple buy lots (FIFO)', () => {
    const t = matchFifo([
      o('b1', 'buy', 1, 100, '2026-01-01T10:00:00Z'),
      o('b2', 'buy', 1, 120, '2026-01-01T11:00:00Z'),
      o('s1', 'sell', 1.5, 130, '2026-01-02T10:00:00Z'),
    ]);
    expect(t.map((x) => [x.entryOrderId, x.quantity, x.realizedPl])).toEqual([['b1', 1, 30], ['b2', 0.5, 5]]);
  });
  it('leaves unsold lots open and is deterministic', () => {
    const input = [o('b1', 'buy', 3, 10, '2026-01-01T10:00:00Z'), o('s1', 'sell', 1, 11, '2026-01-01T11:00:00Z')];
    expect(matchFifo(input)).toEqual(matchFifo([...input].reverse()));
    expect(matchFifo(input)[0].quantity).toBe(1);
  });
  it('derives exit reason from client order id', () => {
    expect(exitReasonOf('auto-tp-ABNB-1')).toBe('Profit Target');
    expect(exitReasonOf('auto-sl-ABNB-1')).toBe('Stop Loss');
    expect(exitReasonOf('man-xyz')).toBe('Manual Sell');
  });
});

describe('stats + exit rules', () => {
  it('computes win rate and profit factor', () => {
    const s = computeStats([10, -5, 20, -5]);
    expect(s).toMatchObject({ totalTrades: 4, wins: 2, losses: 2, winRate: 50, totalPl: 20, profitFactor: 3 });
  });
  it('handles no trades', () => {
    expect(computeStats([])).toMatchObject({ totalTrades: 0, winRate: 0, profitFactor: null });
  });
  const base = { avgEntry: 100, targetPct: 3, stopLossPct: 5, autoTarget: true, autoStop: true };
  it('triggers target / stop / nothing', () => {
    expect(exitDecision({ ...base, price: 103 })).toBe('target');
    expect(exitDecision({ ...base, price: 95 })).toBe('stop');
    expect(exitDecision({ ...base, price: 101 })).toBeNull();
  });
  it('respects auto toggles', () => {
    expect(exitDecision({ ...base, price: 103, autoTarget: false })).toBeNull();
    expect(exitDecision({ ...base, price: 90, autoStop: false })).toBeNull();
  });
});

describe('indicators', () => {
  const candles = (closes: number[]) => closes.map((c, i) => ({ t: String(i), o: c, h: c, l: c, c, v: 1 }));
  it('sma and rsi basics', () => {
    expect(sma([1, 2, 3, 4], 2)).toBe(3.5);
    expect(rsi(Array.from({ length: 30 }, (_, i) => i + 1))).toBe(100);
  });
  it('rising market is Bullish, falling is Bearish, percentages sum to 100', () => {
    const up = analyze(candles(Array.from({ length: 60 }, (_, i) => 100 + i * 0.8 + (i % 3))));
    const down = analyze(candles(Array.from({ length: 60 }, (_, i) => 160 - i * 0.8 - (i % 3))));
    expect(up.sentiment).toBe('Bullish');
    expect(down.sentiment).toBe('Bearish');
    for (const a of [up, down]) expect(a.bullishPct + a.neutralPct + a.bearishPct).toBe(100);
  });
  it('needs enough data', () => {
    expect(() => analyze(candles([1, 2, 3]))).toThrow(/Not enough data/);
  });
});

import { parseAiAnalysis } from '../src/services/ai.js';
describe('AI reply parsing', () => {
  it('extracts JSON from fenced/chatty text and normalises percentages', () => {
    const r = parseAiAnalysis('Sure!\n```json\n{"sentiment":"Bullish","confidence":71.6,"bullishPct":60,"neutralPct":30,"bearishPct":20,"summary":"Uptrend with healthy momentum."}\n```');
    expect(r.bullishPct + r.neutralPct + r.bearishPct).toBe(100);
    expect(r).toMatchObject({ sentiment: 'Bullish', confidence: 72 });
  });
  it('rejects garbage and invalid sentiment', () => {
    expect(() => parseAiAnalysis('no json here')).toThrow();
    expect(() => parseAiAnalysis('{"sentiment":"Moon","confidence":1,"bullishPct":1,"neutralPct":1,"bearishPct":1,"summary":"xxxxxxxxxxxx"}')).toThrow();
  });
});

import { orderMath, renderOrderEmail, renderTradeEmail, esc, rangeBar } from '../src/services/emailTemplates.js';
describe('email templates', () => {
  const base = { stage: 'placed' as const, symbol: 'ABNB', side: 'buy' as const, type: 'market', orderId: 'abc-1234567890', status: 'accepted', env: 'paper',
    shares: 0.5, entryPrice: 200, currentPrice: 201, cost: 100, targetPct: 3, targetPrice: 206, stopLossPct: 5, stopLossPrice: 190,
    spark: [190, 195, 200, 201], when: 'now', appUrl: 'http://x', sentiment: { label: 'Bullish', confidence: 80, summary: 'Up <b>trend</b>', provider: 'groq' } };
  it('computes profit at target, loss at stop and reward:risk', () => {
    expect(orderMath(200, 0.5, 206, 190)).toEqual({ profitAtTarget: 3, lossAtStop: -5, rr: 0.6 });
  });
  it('renders an order email with the key numbers and escapes HTML', () => {
    const m = renderOrderEmail(base);
    expect(m.subject).toContain('target +$3.00');
    expect(m.html).toContain('$206.00');
    expect(m.html).toContain('-$5.00');
    expect(m.html).not.toContain('<b>trend</b>');
    expect(m.html).toContain('Up &lt;b&gt;trend&lt;/b&gt;');
  });
  it('renders a trade-closed email for a win and a loss', () => {
    const t = { symbol: 'ABNB', shares: 1, entryPrice: 100, exitPrice: 103, investment: 100, exitValue: 103, pl: 3, plPct: 3, reason: 'Profit Target' as const, holding: '2h 5m', closedAt: 'now', env: 'paper', appUrl: 'http://x' };
    expect(renderTradeEmail(t).subject).toContain('+$3.00');
    expect(renderTradeEmail({ ...t, pl: -5, plPct: -5, reason: 'Stop Loss' }).html).toContain('STOP LOSS TRIGGERED');
  });
  it('escapes and builds a range bar', () => {
    expect(esc('<a>&')).toBe('&lt;a&gt;&amp;');
    expect(rangeBar(190, 200, 206, 201)).toContain('Target $206.00');
  });
});

import { bollinger, dailySigma, ema, macd, normalCdf, touchProbability } from '../src/lib/stats.js';
describe('analysis math', () => {
  it('normal CDF basics', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 5);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });
  it('touch probability: farther barrier and shorter time are less likely; ~1 at the price', () => {
    const near = touchProbability(100, 102, 0.02, 3);
    const far = touchProbability(100, 108, 0.02, 3);
    expect(near).toBeGreaterThan(far);
    expect(touchProbability(100, 105, 0.02, 5)).toBeGreaterThan(touchProbability(100, 105, 0.02, 1));
    expect(touchProbability(100, 100, 0.02, 1)).toBe(1);
    expect(touchProbability(100, 110, 0, 3)).toBe(0);
  });
  it('known value: 1-sigma barrier in 1 day is ~31.7%', () => {
    expect(touchProbability(100, 100 * Math.exp(0.02), 0.02, 1)).toBeCloseTo(0.317, 2);
  });
  it('ema, macd, bollinger, sigma', () => {
    expect(ema([1, 1, 1], 3)).toEqual([1, 1, 1]);
    const up = Array.from({ length: 60 }, (_, i) => 100 + i);
    expect(macd(up)!.hist).toBeDefined();
    expect(macd(up)!.macd).toBeGreaterThan(0);
    expect(macd([1, 2, 3])).toBeNull();
    const flat = Array(25).fill(50);
    expect(bollinger(flat)!.percentB).toBe(0.5);
    expect(dailySigma(Array(40).fill(10))).toBe(0);
  });
});

describe('no stop-loss (0 = ignore)', () => {
  it('never triggers a stop when stopLossPct is 0, still triggers the target', () => {
    const base = { avgEntry: 100, targetPct: 5, stopLossPct: 0, autoTarget: true, autoStop: true };
    expect(exitDecision({ ...base, price: 50 })).toBeNull();
    expect(exitDecision({ ...base, price: 105 })).toBe('target');
  });
  it('order math and email handle a missing stop', () => {
    expect(orderMath(100, 1, 105, null)).toEqual({ profitAtTarget: 5, lossAtStop: null, rr: null });
    const m = renderOrderEmail({ stage: 'placed', symbol: 'ABNB', side: 'buy', type: 'market', orderId: 'abcdefghijklmnop', status: 'accepted', env: 'paper', shares: 1, entryPrice: 100, currentPrice: 100, cost: 100, targetPct: 5, targetPrice: 105, stopLossPct: 0, stopLossPrice: null, spark: [], when: 'now', appUrl: 'http://x' });
    expect(m.subject).toContain('no stop');
    expect(m.html).toContain('None (held manually)');
  });
});

import { lotIdOf } from '../src/lib/trades.js';
import { signAction, verifyAction } from '../src/lib/actionLinks.js';
describe('per-order (lot) sells and email action links', () => {
  const A = '11111111-1111-1111-1111-111111111111';
  const B = '22222222-2222-2222-2222-222222222222';
  const o = (id: string, side: 'buy' | 'sell', qty: number, price: number, at: string, cid: string | null = null) =>
    ({ alpacaOrderId: id, clientOrderId: cid, side, qty, price, at });

  it('parses the lot id from the client order id', () => {
    expect(lotIdOf(`auto-tp-${B}-1730000000`)).toBe(B);
    expect(lotIdOf(`lot-${A}-5`)).toBe(A);
    expect(lotIdOf('man-abc')).toBeNull();
    expect(lotIdOf(null)).toBeNull();
  });
  it('a target sell for the NEWER buy order closes that order, not the oldest (FIFO would be wrong)', () => {
    const t = matchFifo([
      o(A, 'buy', 1, 100, '2026-01-01T10:00:00Z'),
      o(B, 'buy', 1, 120, '2026-01-02T10:00:00Z'),
      o('s1', 'sell', 1, 126, '2026-01-03T10:00:00Z', `auto-tp-${B}-1`),
    ]);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ entryOrderId: B, realizedPl: 6, exitReason: 'Profit Target' });
  });
  it('a lot sell larger than the lot spills into the others', () => {
    const t = matchFifo([
      o(A, 'buy', 1, 100, '2026-01-01T10:00:00Z'),
      o(B, 'buy', 0.5, 120, '2026-01-02T10:00:00Z'),
      o('s1', 'sell', 1, 130, '2026-01-03T10:00:00Z', `lot-${B}-1`),
    ]);
    expect(t.map((x) => [x.entryOrderId, x.quantity])).toEqual([[B, 0.5], [A, 0.5]]);
  });
  it('email links verify, expire, and cannot be reused for another action or order', () => {
    const exp = Date.now() + 60_000;
    const sig = signAction('edit', A, exp);
    expect(verifyAction('edit', A, exp, sig)).toBe(true);
    expect(verifyAction('sell', A, exp, sig)).toBe(false);
    expect(verifyAction('edit', B, exp, sig)).toBe(false);
    expect(verifyAction('edit', A, exp, 'zz')).toBe(false);
    const past = Date.now() - 1000;
    expect(verifyAction('edit', A, past, signAction('edit', A, past))).toBe(false);
  });
});
