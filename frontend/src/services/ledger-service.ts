import { env } from '@/config/env';
import { mockDb, mockLatency } from '@/mocks/db';
import type { LedgerEntry } from '@/types/ledger';

import { api } from './api-client';

export async function fetchLedgerEntries(signal?: AbortSignal): Promise<LedgerEntry[]> {
  if (env.useMocks) {
    return mockLatency([...mockDb.ledger]);
  }
  return api.get<LedgerEntry[]>('/ledger/entries', signal);
}
