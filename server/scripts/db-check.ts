import { query, getPool } from '../src/db.js';
const t = await query(`select table_name from information_schema.tables where table_schema='public' order by 1`);
console.log('tables:', t.map((r: any) => r.table_name).join(', '));
console.log('settings row:', (await query('select id, profit_target_pct, stop_loss_pct, daily_investment_limit from settings'))[0]);
console.log('migrations table exists:', (await query(`select to_regclass('public.schema_migrations') as r`))[0].r);
await getPool().end();
