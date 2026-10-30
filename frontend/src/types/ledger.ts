export type MoneyDirection = 'in' | 'out';

/** How an entry was recorded. */
export type EntrySource = 'voice' | 'qr' | 'manual';

export type LedgerEntry = {
  id: string;
  /** Person or business on the other side of the entry. */
  party: string;
  note?: string;
  /** Minor currency units (paise). */
  amount: number;
  direction: MoneyDirection;
  source: EntrySource;
  /** ISO-8601 timestamp. */
  createdAt: string;
};

export type LedgerSummary = {
  balance: number;
  totalIn: number;
  totalOut: number;
};
