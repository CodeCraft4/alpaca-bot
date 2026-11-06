import pg from 'pg';
import { config } from './config.js';

let pool: pg.Pool | null = null;

export const dbConfigured = () => /^postgres(ql)?:\/\//.test(config.DATABASE_URL);
export const dbConfigProblem = () =>
  !config.DATABASE_URL
    ? 'DATABASE_URL is not set'
    : dbConfigured()
      ? null
      : 'DATABASE_URL must be a postgresql:// connection string (Supabase > Connect > Session pooler), not the https project URL';

export function getPool(): pg.Pool {
  if (!dbConfigured()) throw new Error(dbConfigProblem()!);
  if (!pool) {
    pool = new pg.Pool({
      connectionString: config.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: process.env.VERCEL ? 2 : 5, // many short-lived instances: keep each one small
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query<T>(text, params as any[]);
  return res.rows;
}
