-- The language the merchant picked for Pari (a BCP-47 code such as ta-IN); null until they pick one.
alter table merchants add column if not exists language text;
