import { z } from 'zod';
import { config } from '../config.js';
import type { Analysis, Candle } from '../lib/indicators.js';

export type Provider = 'anthropic' | 'groq' | 'xai';

const aiSchema = z.object({
  sentiment: z.enum(['Bullish', 'Neutral', 'Bearish']),
  confidence: z.number().min(0).max(100),
  bullishPct: z.number().min(0).max(100),
  neutralPct: z.number().min(0).max(100),
  bearishPct: z.number().min(0).max(100),
  summary: z.string().min(10).max(900),
  risks: z.array(z.string().max(200)).max(5).optional(),
  advice: z.string().max(500).optional(),
});

export interface AiContext {
  price: number;
  priceSource: string;
  news: { headline: string; source: string; datetime: string }[];
  earnings: { date: string; daysAway: number } | null;
  analysts: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  position: { qty: number; avgEntry: number; targetPrice: number; stopPrice: number | null; heldDays: number; plPct: number } | null;
}

/** Extract + validate the JSON object from a model reply. Normalises the percentages to sum to 100. */
export function parseAiAnalysis(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI reply contained no JSON object');
  const a = aiSchema.parse(JSON.parse(text.slice(start, end + 1)));
  const total = a.bullishPct + a.neutralPct + a.bearishPct;
  if (total <= 0) throw new Error('AI percentages sum to zero');
  const bullishPct = Math.round((a.bullishPct / total) * 100);
  const bearishPct = Math.round((a.bearishPct / total) * 100);
  return {
    ...a,
    confidence: Math.round(a.confidence),
    bullishPct,
    bearishPct,
    neutralPct: 100 - bullishPct - bearishPct,
  };
}

export function buildPrompt(symbol: string, rules: Analysis, candles: Candle[], ctx?: AiContext) {
  const recent = candles.slice(-30).map((c) => `${c.t.slice(0, 10)} O${c.o} H${c.h} L${c.l} C${c.c} V${c.v}`).join('\n');
  const news = ctx?.news.length
    ? ctx.news.map((n) => `- [${n.datetime.slice(0, 10)}] ${n.headline} (${n.source})`).join('\n')
    : 'No recent headlines available.';
  const e = ctx?.earnings;
  const a = ctx?.analysts;
  const p = ctx?.position;
  return [
    `You are a careful, honest equity analyst for a small retail trader. Assess the short-term (next 1 to 5 trading days, and up to 2 weeks) outlook for ${symbol}.`,
    'Use ONLY the data below. Weigh technicals AND the news/earnings context. Do not invent facts, prices or events. If signals conflict, say so and lower your confidence; never exceed 80 confidence unless technicals, news and analysts all agree.',
    `Current price: $${ctx?.price ?? rules.indicators.price} (source: ${ctx?.priceSource ?? 'alpaca'}).`,
    `Technical indicators (computed from daily bars): ${JSON.stringify(rules.indicators)}`,
    `Rule-based baseline: ${rules.sentiment} (score ${rules.score}/100).`,
    `Earnings: ${e ? `next report ${e.date} (${e.daysAway} days away)${e.daysAway <= 5 ? ' -> EARNINGS RISK: large gap moves are common around earnings' : ''}` : 'no upcoming date found'}.`,
    `Analyst ratings: ${a ? `strongBuy ${a.strongBuy}, buy ${a.buy}, hold ${a.hold}, sell ${a.sell}, strongSell ${a.strongSell}` : 'n/a'}.`,
    `Recent headlines:\n${news}`,
    p
      ? `The trader holds ${p.qty.toFixed(4)} shares bought at $${p.avgEntry.toFixed(2)} (${p.plPct >= 0 ? '+' : ''}${p.plPct.toFixed(2)}% now), target $${p.targetPrice.toFixed(2)}, ${p.stopPrice ? `stop $${p.stopPrice.toFixed(2)}` : 'NO stop-loss (they chose to ignore it)'}, held ${p.heldDays.toFixed(1)} days, plans to review after ~3 days.`
      : 'The trader has no open position.',
    `Last 30 daily candles:\n${recent}`,
    'Reply with ONLY a JSON object, no markdown:',
    '{"sentiment":"Bullish|Neutral|Bearish","confidence":0-100,"bullishPct":int,"neutralPct":int,"bearishPct":int,"summary":"2-3 plain sentences","risks":["up to 4 short specific risks"],"advice":"1-2 sentences on what to watch / whether to hold, add or review, framed as considerations not orders"}',
    'The three percentages must sum to 100.',
  ].join('\n\n');
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  let lastErr: Error = new Error('AI request failed');
  // Retry transient problems (network blips, 429, 5xx) a couple of times; fail fast on real 4xx errors.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 800 * attempt));
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(45_000) });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok) return json;
      lastErr = new Error(json?.error?.message || json?.error || `AI provider HTTP ${res.status}`);
      if (res.status !== 429 && res.status < 500) throw lastErr;
    } catch (e) {
      lastErr = e as Error;
      if (lastErr.message && !/fetch failed|timeout|aborted|ECONN|ETIMEDOUT|network|HTTP 5|rate/i.test(lastErr.message)) throw lastErr;
    }
  }
  throw lastErr;
}

export async function askModel(provider: Provider, prompt: string): Promise<{ text: string; model: string }> {
  if (provider === 'anthropic') {
    if (!config.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
    const j = await postJson(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': config.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      { model: config.ANTHROPIC_MODEL, max_tokens: 600, messages: [{ role: 'user', content: prompt }] },
    );
    const text = (j.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    return { text, model: config.ANTHROPIC_MODEL };
  }
  // OpenAI-compatible providers
  const cfg = provider === 'groq'
    ? { key: config.GROQ_API_KEY, name: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', model: config.GROQ_MODEL }
    : { key: config.XAI_API_KEY, name: 'XAI_API_KEY', url: 'https://api.x.ai/v1/chat/completions', model: config.XAI_MODEL };
  if (!cfg.key) throw new Error(`${cfg.name} is not set`);
  const j = await postJson(
    cfg.url,
    { authorization: `Bearer ${cfg.key}` },
    { model: cfg.model, max_tokens: 2000, temperature: 0.2, messages: [{ role: 'user', content: prompt }] },
  );
  return { text: j.choices?.[0]?.message?.content ?? '', model: cfg.model };
}

export async function aiAnalysis(provider: Provider, symbol: string, rules: Analysis, candles: Candle[], ctx?: AiContext) {
  const { text, model } = await askModel(provider, buildPrompt(symbol, rules, candles, ctx));
  return { ...parseAiAnalysis(text), provider, model };
}
