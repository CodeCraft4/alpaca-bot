import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from '../src/db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

async function main() {
  const pool = getPool();
  await pool.query(
    'create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())',
  );
  const done = new Set((await pool.query('select name from schema_migrations')).rows.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const f of files) {
    if (done.has(f)) {
      console.log(`skip   ${f}`);
      continue;
    }
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      await client.query('insert into schema_migrations (name) values ($1)', [f]);
      await client.query('commit');
      console.log(`applied ${f}`);
    } catch (e) {
      await client.query('rollback');
      throw e;
    } finally {
      client.release();
    }
  }
  await pool.end();
}

main().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
