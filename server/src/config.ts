import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// One env file for the whole project (repo root). NODE_ENV-specific file wins, then .env.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: [path.join(root, `.env.${nodeEnv}.local`), path.join(root, '.env.local'), path.join(root, `.env.${nodeEnv}`), path.join(root, '.env'), path.join(root, 'server', '.env')], quiet: true });

const schema = z.object({
  PORT: z.coerce.number().default(4555),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  ALPACA_API_KEY_ID: z.string().default(''),
  ALPACA_API_SECRET_KEY: z.string().default(''),
  ALPACA_API_BASE_URL: z.string().default('https://paper-api.alpaca.markets'),
  ALPACA_DATA_BASE_URL: z.string().default('https://data.alpaca.markets/v2'),
  ALPACA_DATA_FEED: z.string().default('iex'),
  ALPACA_TRADING_ENV: z.enum(['paper', 'live']).default('paper'),
  ALLOW_LIVE: z.string().default('false'),
  TRADING_SYMBOL: z.string().default('ABNB'),
  DEFAULT_PROFIT_TARGET_PCT: z.coerce.number().default(3),
  DEFAULT_STOP_LOSS_PCT: z.coerce.number().default(5),
  HOLDING_REVIEW_DAYS: z.coerce.number().default(3),
  ALERT_NOTIFICATION_EMAIL: z.string().default(''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default(''),
  APP_URL: z.string().default('http://localhost:5173'),
  // Where email buttons point to (this backend). Default http://localhost:<PORT>; set to your public URL when deployed.
  API_PUBLIC_URL: z.string().default(''),
  DATABASE_URL: z.string().default(''),
  AUTOMATION_ENABLED: z.string().default('true'),
  AUTOMATION_DRY_RUN: z.string().default('true'),
  AUTOMATION_INTERVAL_SEC: z.coerce.number().default(60),
  // Market analysis: 'rules' (indicators only) | 'anthropic' | 'groq' | 'xai'
  ANALYSIS_PROVIDER: z.enum(['rules', 'anthropic', 'groq', 'xai']).default('rules'),
  ANTHROPIC_API_KEY: z.string().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
  GROQ_API_KEY: z.string().default(''),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  // Real-time price + news/earnings context (https://finnhub.io, free key). Empty = fall back to Alpaca IEX.
  // Alpaca paper fills a $N notional buy as $(N - 0.01). Added back so $20 really means $20 (paper only).
  NOTIONAL_TOP_UP: z.coerce.number().default(0.01),
  FINNHUB_API_KEY: z.string().default(''),
  XAI_API_KEY: z.string().default(''),
  XAI_MODEL: z.string().default('grok-4'),
});

export type Config = z.infer<typeof schema>;

/** Safety guard: a non-paper endpoint is only allowed when live trading is explicitly enabled. */
export function assertSafeTradingConfig(
  c: Pick<Config, 'ALPACA_API_BASE_URL' | 'ALPACA_TRADING_ENV' | 'ALLOW_LIVE'>,
) {
  const isLiveUrl = !c.ALPACA_API_BASE_URL.includes('paper-api');
  if (isLiveUrl && !(c.ALPACA_TRADING_ENV === 'live' && c.ALLOW_LIVE === 'true')) {
    throw new Error('Refusing to start: non-paper Alpaca URL requires ALPACA_TRADING_ENV=live and ALLOW_LIVE=true');
  }
  if (c.ALPACA_TRADING_ENV === 'live' && c.ALLOW_LIVE !== 'true') {
    throw new Error('Refusing to start: ALPACA_TRADING_ENV=live requires ALLOW_LIVE=true');
  }
}

export const config: Config = schema.parse(process.env);
export const flag = (v: string) => v.toLowerCase() === 'true';
