-- ALPHACA-ABNB initial schema
create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- Single-row trading settings -------------------------------------------------
create table if not exists settings (
  id integer primary key default 1 check (id = 1),
  profit_target_pct numeric(6,2) not null default 3,
  stop_loss_pct numeric(6,2) not null default 5,
  daily_investment_limit numeric(12,2) not null default 50,
  holding_review_days integer not null default 3,
  auto_profit_target_exit boolean not null default true,
  auto_stop_loss_exit boolean not null default true,
  manual_buy_only boolean not null default true,
  holding_period_reminder boolean not null default true,
  email_notifications_enabled boolean not null default true,
  recipient_email text not null default '',
  notifications jsonb not null default
    '{"profitTargetFilled":true,"stopLossFilled":true,"manualSellFilled":true,"orderRejected":true,"dailySummary":false}',
  emergency_kill_switch boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger trg_settings_updated before update on settings
  for each row execute function set_updated_at();

-- Orders (mirror of Alpaca orders + our own targets) --------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  alpaca_order_id text unique,
  client_order_id text unique,
  symbol text not null,
  side text not null check (side in ('buy','sell')),
  type text not null check (type in ('market','limit')),
  qty numeric(20,8),
  notional numeric(14,2),
  filled_qty numeric(20,8) not null default 0,
  avg_fill_price numeric(14,4),
  limit_price numeric(14,4),
  status text not null,
  time_in_force text not null default 'day',
  target_pct numeric(6,2),
  stop_loss_pct numeric(6,2),
  target_price numeric(14,4),
  stop_loss_price numeric(14,4),
  entry_price numeric(14,4),
  source text not null default 'manual' check (source in ('manual','automation','external')),
  notes text,
  submitted_at timestamptz,
  filled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_symbol_status on orders (symbol, status);
create index if not exists idx_orders_submitted on orders (submitted_at desc);
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- Exit rules for each open position (automation reads these) ------------------
create table if not exists position_rules (
  symbol text primary key,
  target_pct numeric(6,2) not null,
  stop_loss_pct numeric(6,2) not null,
  target_price numeric(14,4),
  stop_price numeric(14,4),
  opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_rules_updated before update on position_rules
  for each row execute function set_updated_at();

-- Completed round-trip trades (FIFO matched buy -> sell) ----------------------
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  side text not null default 'Long',
  quantity numeric(20,8) not null,
  entry_price numeric(14,4) not null,
  exit_price numeric(14,4) not null,
  investment numeric(14,2) not null,
  exit_value numeric(14,2) not null,
  realized_pl numeric(14,2) not null,
  return_pct numeric(8,2) not null,
  exit_reason text not null check (exit_reason in ('Profit Target','Stop Loss','Manual Sell')),
  entered_at timestamptz not null,
  closed_at timestamptz not null,
  holding_seconds bigint not null default 0,
  entry_alpaca_order_id text not null,
  exit_alpaca_order_id text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (entry_alpaca_order_id, exit_alpaca_order_id)
);
create index if not exists idx_trades_closed on trades (closed_at desc);

-- Activity / audit log --------------------------------------------------------
create table if not exists activity_log (
  id bigserial primary key,
  type text not null check (type in ('trade','config','system','automation','analysis')),
  level text not null default 'info' check (level in ('info','success','warning','error')),
  title text not null,
  detail text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_created on activity_log (created_at desc);

-- Market analysis history -----------------------------------------------------
create table if not exists market_analyses (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  sentiment text not null check (sentiment in ('Bullish','Neutral','Bearish')),
  confidence integer not null,
  bullish_pct integer not null,
  neutral_pct integer not null,
  bearish_pct integer not null,
  score numeric(6,2) not null,
  summary text not null,
  indicators jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_analyses_symbol_created on market_analyses (symbol, created_at desc);

-- Account equity snapshots (for equity curve) ---------------------------------
create table if not exists account_snapshots (
  id bigserial primary key,
  equity numeric(14,2) not null,
  cash numeric(14,2) not null,
  taken_at timestamptz not null default now()
);
create index if not exists idx_snapshots_taken on account_snapshots (taken_at desc);

-- Lock down: only the backend (direct Postgres role) touches these tables.
alter table settings enable row level security;
alter table orders enable row level security;
alter table position_rules enable row level security;
alter table trades enable row level security;
alter table activity_log enable row level security;
alter table market_analyses enable row level security;
alter table account_snapshots enable row level security;

insert into settings (id) values (1) on conflict (id) do nothing;
