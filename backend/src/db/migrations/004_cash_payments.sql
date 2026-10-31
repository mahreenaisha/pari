-- Cash a customer pays back at the counter, recorded by voice. Its txn_id is "cash:" and a fresh uuid.
alter table payments drop constraint if exists payments_source_check;
alter table payments add constraint payments_source_check check (source in ('LINK', 'QR', 'CASH'));
