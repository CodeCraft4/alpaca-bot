alter table market_analyses add column if not exists provider text not null default 'rules';
alter table market_analyses add column if not exists model text;
