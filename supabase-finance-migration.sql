-- ============================================================
-- FİNANS (transactions) TABLOSUNU UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
alter table transactions add column if not exists transaction_date date default current_date;
alter table transactions add column if not exists customer text default '';

-- Önce mevcut satırları çeviriyoruz, SONRA kısıtlamayı ekliyoruz.
alter table transactions drop constraint if exists transactions_type_check;
update transactions set type = 'income' where type = 'gelir';
update transactions set type = 'expense' where type = 'gider';
alter table transactions add constraint transactions_type_check check (type in ('income','expense'));
