import { config } from '../config.js';

const BASE = 'https://finnhub.io/api/v1';

export const finnhubConfigured = () => Boolean(config.FINNHUB_API_KEY);

const cache = new Map<string, { at: number; value: unknown }>();

/** GET with a small TTL cache (free plan allows 60 calls/min, dashboards poll every 5s). */
async function get<T>(path: string, params: Record<string, string>, ttlMs: number): Promise<T> {
  const qs = new URLSearchParams({ ...params, token: config.FINNHUB_API_KEY }).toString();
  const key = `${path}?${qs}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const res = await fetch(`${BASE}${path}?${qs}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Finnhub ${path} failed (${res.status})`);
  const value = (await res.json()) as T;
  cache.set(key, { at: Date.now(), value });
  return value;
}

export interface FinnhubQuote {
  c: number; // current price
  d: number | null; // change
  dp: number | null; // change %
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
  t: number; // unix seconds
}

export async function fhQuote(symbol: string, maxAgeMs = 3_000): Promise<FinnhubQuote> {
  const q = await get<FinnhubQuote>('/quote', { symbol }, maxAgeMs);
  if (!q || !q.c) throw new Error('Finnhub returned no price');
  return q;
}

export interface NewsItem { headline: string; source: string; datetime: string; url: string }

export async function fhNews(symbol: string, days = 5): Promise<NewsItem[]> {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const to = new Date();
  const from = new Date(Date.now() - days * 86_400_000);
  const raw = await get<{ headline: string; source: string; datetime: number; url: string }[]>(
    '/company-news', { symbol, from: iso(from), to: iso(to) }, 30 * 60_000);
  return (raw ?? [])
    .filter((n) => n.headline)
    .slice(0, 8)
    .map((n) => ({ headline: n.headline, source: n.source, datetime: new Date(n.datetime * 1000).toISOString(), url: n.url }));
}

export interface Analysts { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; period: string }

export async function fhAnalysts(symbol: string): Promise<Analysts | null> {
  const raw = await get<Analysts[]>('/stock/recommendation', { symbol }, 12 * 3_600_000);
  return raw?.[0] ?? null;
}

export async function fhNextEarnings(symbol: string): Promise<{ date: string; daysAway: number } | null> {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const raw = await get<{ earningsCalendar?: { date: string }[] }>(
    '/calendar/earnings', { symbol, from: iso(new Date()), to: iso(new Date(Date.now() + 120 * 86_400_000)) }, 12 * 3_600_000);
  const next = raw.earningsCalendar?.[0];
  if (!next) return null;
  return { date: next.date, daysAway: Math.ceil((new Date(next.date).getTime() - Date.now()) / 86_400_000) };
}
