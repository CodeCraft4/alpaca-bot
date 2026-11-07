import { alpaca } from '../src/alpaca.js';
import { getPool, query } from '../src/db.js';

/**
 * Fresh start: clears orders / trades / logs in Supabase and records a cutoff so the sync does NOT re-import the
 * old orders that Alpaca still holds. Also cancels orders that are still waiting at Alpaca (they would otherwise
 * fill later and become untracked positions). Settings are kept.
 *
 *   npx tsx scripts/reset-data.ts          -> dry run (counts only)
 *   npx tsx scripts/reset-data.ts --yes    -> really do it
 */
const yes = process.argv.includes('--yes');
const TABLES = ['trades', 'orders', 'position_rules', 'activity_log', 'account_snapshots', 'sent_notifications'];

const counts = async () => Object.fromEntries(await Promise.all(TABLES.map(async (t) => [t, Number((await query(`select count(*)::int c from ${t}`))[0].c)])));

console.log('Supabase rows now:', await counts());
const open = await alpaca.orders('open', 200);
const positions = await alpaca.positions();
console.log(`Alpaca: ${open.length} open (waiting) orders, ${positions.length} open positions`);
for (const p of positions) console.log(`  position ${p.symbol} qty ${p.qty} (this is NOT touched; sell it yourself if you want it gone)`);

if (!yes) {
  console.log('\nDRY RUN: nothing changed. Run again with --yes to apply.');
  await getPool().end();
  process.exit(0);
}

for (const o of open) {
  try {
    await alpaca.cancelOrder(o.id);
  } catch (e) {
    console.log('could not cancel', o.id.slice(0, 8), (e as Error).message);
  }
}
console.log(`cancelled ${open.length} waiting orders at Alpaca`);

const client = await getPool().connect();
try {
  await client.query('begin');
  for (const t of TABLES) await client.query(`delete from ${t}`);
  await client.query('update settings set fresh_start_at = now() where id = 1');
  await client.query('commit');
} catch (e) {
  await client.query('rollback');
  throw e;
} finally {
  client.release();
}
console.log('Supabase rows after:', await counts());
console.log('fresh_start_at =', (await query('select fresh_start_at from settings where id = 1'))[0].fresh_start_at);
await getPool().end();
