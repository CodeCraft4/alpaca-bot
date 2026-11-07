import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { alpaca } from '../alpaca.js';
import { config } from '../config.js';
import { fhQuote, finnhubConfigured } from './finnhub.js';

/**
 * Live price hub. Keeps the freshest known price from two sources and pushes every change to the dashboard (SSE):
 *  - Finnhub: WebSocket trades (instant when one arrives) + a REST check every 2 s
 *  - Alpaca IEX: a REST check every 4 s (shown next to Finnhub for comparison)
 * Nothing runs while no dashboard is connected, so no API calls are wasted at night.
 */
export interface FinnhubState { price: number; tradeTs: number; at: number; pc: number; open: number; high: number; low: number }
export interface AlpacaState { price: number; tradeTs: number; at: number }
export interface PriceState { finnhub: FinnhubState | null; alpaca: AlpacaState | null }

const state: PriceState = { finnhub: null, alpaca: null };
const bus = new EventEmitter();
bus.setMaxListeners(200);
let subscribers = 0;
const symbol = () => config.TRADING_SYMBOL;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getPriceState = () => state;

export function onPrice(fn: (s: PriceState) => void) {
  bus.on('price', fn);
  subscribers++;
  startPriceStream(); // no-op when already running (it is started at boot on a normal server)
}
export function offPrice(fn: (s: PriceState) => void) {
  bus.off('price', fn);
  subscribers = Math.max(0, subscribers - 1);
}
const emit = () => bus.emit('price', state);

async function pollFinnhub() {
  try {
    const q = await fhQuote(symbol(), 0);
    const tradeTs = q.t * 1000;
    const prev = state.finnhub;
    const common = { pc: q.pc, open: q.o, high: q.h, low: q.l, at: Date.now() };
    if (prev && prev.tradeTs > tradeTs) {
      state.finnhub = { ...prev, ...common }; // a WebSocket tick is newer than this REST answer: keep it
      return;
    }
    const changed = !prev || prev.price !== q.c || prev.tradeTs !== tradeTs;
    state.finnhub = { price: q.c, tradeTs, ...common };
    if (changed) emit();
  } catch {
    /* keep the last value */
  }
}

async function pollAlpaca() {
  try {
    const a = await alpaca.latestPrice(symbol());
    const tradeTs = new Date(a.time).getTime();
    const prev = state.alpaca;
    const changed = !prev || prev.price !== a.price || prev.tradeTs !== tradeTs;
    state.alpaca = { price: a.price, tradeTs, at: Date.now() };
    if (changed) emit();
  } catch {
    /* keep the last value */
  }
}

let ws: WebSocket | null = null;
let backoff = 1000;

function connectSocket() {
  if (!finnhubConfigured()) return;
  const sym = symbol();
  try {
    ws = new WebSocket(`wss://ws.finnhub.io?token=${config.FINNHUB_API_KEY}`);
  } catch (e) {
    // the live stream is a bonus: if it cannot start, the REST checks still keep the price fresh
    console.error('price stream: could not open the WebSocket:', (e as Error).message);
    return;
  }
  ws.addEventListener('open', () => {
    console.log('price stream: connected to Finnhub');
    backoff = 1000;
    ws?.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
  });
  ws.addEventListener('message', (ev) => {
    try {
      const m = JSON.parse(String(ev.data));
      if (m.type !== 'trade' || !Array.isArray(m.data)) return;
      const t = (m.data as { s: string; p: number; t: number }[]).filter((d) => d.s === sym).sort((a, b) => a.t - b.t).pop();
      if (!t) return;
      const prev = state.finnhub;
      if (prev && Math.abs(t.p - prev.price) / prev.price > 0.03) return; // ignore an obviously bad print
      if (prev && prev.tradeTs >= t.t && prev.price === t.p) return;
      state.finnhub = {
        price: t.p, tradeTs: t.t, at: Date.now(),
        pc: prev?.pc ?? 0, open: prev?.open ?? t.p, high: Math.max(prev?.high ?? t.p, t.p), low: Math.min(prev?.low ?? t.p, t.p),
      };
      emit();
    } catch {
      /* ignore malformed frames */
    }
  });
  ws.addEventListener('close', () => {
    ws = null;
    setTimeout(connectSocket, backoff);
    backoff = Math.min(backoff * 2, 30_000);
  });
  ws.addEventListener('error', () => {
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
  });
}

let started = false;
export function startPriceStream() {
  if (started) return;
  started = true;
  connectSocket();
  void (async () => {
    let n = 0;
    for (;;) {
      const t0 = Date.now();
      if (subscribers > 0) {
        await Promise.all([finnhubConfigured() ? pollFinnhub() : Promise.resolve(), n % 2 === 0 ? pollAlpaca() : Promise.resolve()]);
        n++;
      }
      await sleep(Math.max(250, (subscribers > 0 ? 2000 : 3000) - (Date.now() - t0)));
    }
  })();
}
