import { useQuery } from '@tanstack/react-query';

import { formatDayLabel } from '@/lib/format';
import { fetchLedgerEntries } from '@/services/ledger-service';
import type { LedgerEntry, LedgerSummary, MoneyDirection } from '@/types/ledger';

export const ledgerKeys = {
  all: ['ledger'] as const,
  entries: () => [...ledgerKeys.all, 'entries'] as const,
};

export function useLedgerEntries() {
  return useQuery({
    queryKey: ledgerKeys.entries(),
    queryFn: ({ signal }) => fetchLedgerEntries(signal),
  });
}

export type LedgerFilter = 'all' | MoneyDirection;

export type LedgerSection = {
  title: string;
  data: LedgerEntry[];
};

export function summarize(entries: LedgerEntry[]): LedgerSummary {
  let totalIn = 0;
  let totalOut = 0;
  for (const entry of entries) {
    if (entry.direction === 'in') totalIn += entry.amount;
    else totalOut += entry.amount;
  }
  return { balance: totalIn - totalOut, totalIn, totalOut };
}

/** Newest first, grouped under "Today", "Yesterday", or the date. */
export function groupByDay(entries: LedgerEntry[], filter: LedgerFilter): LedgerSection[] {
  const sorted = entries
    .filter((entry) => filter === 'all' || entry.direction === filter)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const sections: LedgerSection[] = [];
  for (const entry of sorted) {
    const title = formatDayLabel(entry.createdAt);
    const current = sections.at(-1);
    if (current?.title === title) current.data.push(entry);
    else sections.push({ title, data: [entry] });
  }
  return sections;
}
