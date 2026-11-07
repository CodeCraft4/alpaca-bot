// Thin client for the backend. Base URL is the only frontend env value (non-secret, optional).
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

/** True when the app knows where the backend is: a configured URL, or the dev server's /api proxy. */
// The /api proxy only exists on the local dev server. A deployed site (even one built in development mode by mistake)
// must have VITE_API_URL, otherwise /api would hit the static host itself and return index.html.
const onLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const API_CONFIGURED = Boolean(BASE) || onLocalhost;
const NOT_CONFIGURED = 'Backend URL is not set. In Vercel, add the environment variable VITE_API_URL (your backend URL) and redeploy.';

/** Full URL of a backend path (used by the live price stream). */
export const apiUrl = (path: string) => `${BASE}/api${path}`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_CONFIGURED) throw new ApiError(0, NOT_CONFIGURED);
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  // A host without the backend answers every URL with index.html (HTTP 200). Never treat that as data.
  const isJson = (res.headers.get('content-type') ?? '').includes('json');
  if (!isJson) throw new ApiError(res.status || 502, `The backend did not answer with JSON (HTTP ${res.status}). Check that VITE_API_URL points to your backend.`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`);
  if (body === null) throw new ApiError(502, 'Empty answer from the backend.');
  return body as T;
}

export const TRADING_SYMBOL = 'ABNB';
