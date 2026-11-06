import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

export type ActionType = 'wait' | 'edit' | 'sell';

// Key derived from secrets that already live only on the server (no extra env var to manage).
const key = () => createHash('sha256').update(`${config.DATABASE_URL}|${config.ALPACA_API_SECRET_KEY}|abnb-action-links`).digest();

export const apiBase = () => (config.API_PUBLIC_URL || `http://localhost:${config.PORT}`).replace(/\/$/, '');

export function signAction(action: ActionType, orderId: string, exp: number): string {
  return createHmac('sha256', key()).update(`${action}.${orderId}.${exp}`).digest('hex');
}

/** Signed, expiring link used inside emails. It only opens a confirm page; nothing happens until the button is pressed. */
export function actionUrl(action: ActionType, orderId: string, ttlDays = 7): string {
  const exp = Date.now() + ttlDays * 86_400_000;
  const q = new URLSearchParams({ o: orderId, e: String(exp), s: signAction(action, orderId, exp) });
  return `${apiBase()}/api/actions/${action}?${q.toString()}`;
}

export function verifyAction(action: ActionType, orderId: string, exp: number, sig: string): boolean {
  if (!orderId || !Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = Buffer.from(signAction(action, orderId, exp), 'hex');
  let given: Buffer;
  try {
    given = Buffer.from(sig, 'hex');
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
