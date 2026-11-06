import { query } from '../db.js';

export interface ActivityInput {
  type: 'trade' | 'config' | 'system' | 'automation' | 'analysis';
  level?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
  meta?: unknown;
}

export async function logActivity(a: ActivityInput) {
  try {
    await query('insert into activity_log (type, level, title, detail, meta) values ($1,$2,$3,$4,$5)', [
      a.type,
      a.level ?? 'info',
      a.title,
      a.detail ?? null,
      a.meta ? JSON.stringify(a.meta) : null,
    ]);
  } catch (e) {
    console.error('activity log failed:', (e as Error).message);
  }
}

export async function listActivity(limit = 50) {
  return query(
    `select id, type, level, title, detail, meta, created_at as "createdAt"
       from activity_log order by created_at desc limit $1`,
    [Math.min(limit, 200)],
  );
}
