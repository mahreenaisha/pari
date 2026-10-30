import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

type CreatedAt = ColumnType<Date, never, never>;
type MutableTimestamp = ColumnType<Date, Date | undefined, Date>;

export type EntryStatus = "UNCONFIRMED" | "OPEN" | "CLOSED" | "REJECTED";
export type LinkStatus = "ACTIVE" | "PAID" | "EXPIRED" | "FAILED";
export type PaymentSource = "LINK" | "QR";
export type MatchStatus = "MATCHED" | "SUGGESTED" | "UNMATCHED" | "REJECTED";
export type Actor = "merchant" | "paytm" | "system";

export interface MerchantsTable {
  id: Generated<string>;
  name: string;
  api_key_hash: string;
  created_at: CreatedAt;
}

export interface CustomersTable {
  id: Generated<string>;
  merchant_id: string;
  name: string;
  name_normalized: string;
  phone: string | null;
  created_at: CreatedAt;
}

export interface LedgerEntriesTable {
  id: Generated<string>;
  merchant_id: string;
  customer_id: string;
  total_paise: number;
  paid_paise: number;
  pending_paise: number;
  status: ColumnType<EntryStatus, EntryStatus | undefined, EntryStatus>;
  transcript: string | null;
  language: string | null;
  needs_review: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: CreatedAt;
  updated_at: MutableTimestamp;
}

export interface PaymentLinksTable {
  id: Generated<string>;
  entry_id: string;
  order_id: string;
  paytm_link_id: string | null;
  amount_paise: number;
  status: ColumnType<LinkStatus, LinkStatus | undefined, LinkStatus>;
  short_url: string | null;
  phone: string;
  created_at: CreatedAt;
}

export interface PaymentsTable {
  id: Generated<string>;
  merchant_id: string;
  source: PaymentSource;
  txn_id: string;
  order_id: string | null;
  amount_paise: number;
  payer_name: string | null;
  entry_id: string | null;
  match_status: MatchStatus;
  created_at: CreatedAt;
  resolved_at: Date | null;
}

export interface AuditLogTable {
  id: Generated<string>;
  entry_id: string | null;
  payment_id: string | null;
  from_status: string | null;
  to_status: string | null;
  actor: Actor;
  payload: unknown;
  created_at: CreatedAt;
}

export interface MigrationsTable {
  name: string;
  applied_at: CreatedAt;
}

export interface DB {
  merchants: MerchantsTable;
  customers: CustomersTable;
  ledger_entries: LedgerEntriesTable;
  payment_links: PaymentLinksTable;
  payments: PaymentsTable;
  audit_log: AuditLogTable;
  _migrations: MigrationsTable;
}

export type Merchant = Selectable<MerchantsTable>;
export type Customer = Selectable<CustomersTable>;
export type LedgerEntry = Selectable<LedgerEntriesTable>;
export type NewLedgerEntry = Insertable<LedgerEntriesTable>;
export type LedgerEntryUpdate = Updateable<LedgerEntriesTable>;
export type PaymentLink = Selectable<PaymentLinksTable>;
export type Payment = Selectable<PaymentsTable>;
