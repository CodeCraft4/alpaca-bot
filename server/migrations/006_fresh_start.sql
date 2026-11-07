-- "Fresh start" cutoff: orders submitted before this moment are ignored by the sync
-- (Alpaca keeps its own history, and the sync would otherwise import it again).
alter table settings add column if not exists fresh_start_at timestamptz;
