-- Per-order review timer: when to ask "target not hit yet, what now?" again
alter table orders add column if not exists review_due_at timestamptz;
