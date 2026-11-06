import { waitUntil } from '@vercel/functions';

/**
 * Run work AFTER the response has been sent (saving the order, activity log, emails, delayed sync).
 * On a normal server the promise simply keeps running. On Vercel the function is frozen the moment it answers,
 * so waitUntil keeps it alive until the work is finished.
 */
export function defer(work: Promise<unknown>): void {
  const safe = work.catch((e) => console.error('background task failed:', (e as Error).message));
  if (process.env.VERCEL) waitUntil(safe);
}

export const after = (ms: number, fn: () => Promise<unknown>) => defer(new Promise((r) => setTimeout(r, ms)).then(fn));
