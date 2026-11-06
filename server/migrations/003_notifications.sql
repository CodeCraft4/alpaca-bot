-- Idempotency log so each email is sent once (survives restarts)
create table if not exists sent_notifications (
  key text primary key,
  kind text not null,
  recipient text not null,
  subject text,
  sent_at timestamptz not null default now()
);
alter table sent_notifications enable row level security;
