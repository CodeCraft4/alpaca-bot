-- Small trades (a few cents) were rounded to $0.00. Keep 4 decimals.
alter table trades alter column investment type numeric(14,4);
alter table trades alter column exit_value type numeric(14,4);
alter table trades alter column realized_pl type numeric(14,4);
