-- Money is stored as integer paise everywhere.

create table if not exists merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_key_hash text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id),
  name text not null,
  name_normalized text not null,
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  created_at timestamptz not null default now(),
  unique (merchant_id, name_normalized)
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id),
  customer_id uuid not null references customers(id),
  total_paise integer not null check (total_paise >= 0),
  paid_paise integer not null check (paid_paise >= 0),
  pending_paise integer not null check (pending_paise >= 0),
  status text not null default 'UNCONFIRMED'
    check (status in ('UNCONFIRMED', 'OPEN', 'CLOSED', 'REJECTED')),
  transcript text,
  language text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_paise = paid_paise + pending_paise)
);
create index if not exists ledger_entries_merchant_status on ledger_entries (merchant_id, status);
create index if not exists ledger_entries_customer on ledger_entries (customer_id);

create table if not exists payment_links (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references ledger_entries(id),
  order_id text not null unique,
  paytm_link_id text unique,
  amount_paise integer not null check (amount_paise > 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAID', 'EXPIRED', 'FAILED')),
  short_url text,
  phone text not null,
  created_at timestamptz not null default now()
);
create index if not exists payment_links_entry on payment_links (entry_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id),
  source text not null check (source in ('LINK', 'QR')),
  txn_id text not null unique,
  order_id text,
  amount_paise integer not null check (amount_paise > 0),
  payer_name text,
  entry_id uuid references ledger_entries(id),
  match_status text not null check (match_status in ('MATCHED', 'SUGGESTED', 'UNMATCHED', 'REJECTED')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists payments_merchant_status on payments (merchant_id, match_status);

create table if not exists audit_log (
  id bigserial primary key,
  entry_id uuid references ledger_entries(id),
  payment_id uuid references payments(id),
  from_status text,
  to_status text,
  actor text not null check (actor in ('merchant', 'paytm', 'system')),
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_entry on audit_log (entry_id);
