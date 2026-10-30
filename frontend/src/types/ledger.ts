/**
 * `unconfirmed` entries are drafts read back to the merchant and never appear in the ledger.
 * An entry is `open` while something is still owed and `closed` once it is paid off.
 */
export type EntryStatus = 'unconfirmed' | 'open' | 'closed';

export type PaymentMethod = 'cash' | 'upi' | 'link' | 'qr';

export type Customer = {
  id: string;
  name: string;
  /** Asked for once, the first time a payment link is sent to this customer. */
  phone?: string;
};

export type Payment = {
  /** Paise. */
  amount: number;
  method: PaymentMethod;
  /** ISO-8601 timestamp. */
  at: string;
};

export type PaymentLink = {
  /** Order reference the payment callback is matched on. */
  orderId: string;
  /** Paise. */
  amount: number;
  status: 'sent' | 'paid';
  /** ISO-8601 timestamp. */
  sentAt: string;
};

export type LedgerEntry = {
  id: string;
  customer: Customer;
  /** All amounts are in paise; `pending` is what the customer still owes. */
  total: number;
  paid: number;
  pending: number;
  status: EntryStatus;
  payments: Payment[];
  link?: PaymentLink;
  /** ISO-8601 timestamps. */
  createdAt: string;
  closedAt?: string;
};

export type LedgerSummary = {
  toCollect: number;
  collectedToday: number;
  openCount: number;
};
