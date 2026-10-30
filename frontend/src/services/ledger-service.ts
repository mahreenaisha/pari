import { env } from '@/config/env';
import { mockDb, mockLatency } from '@/mocks/db';
import type { LedgerEntry } from '@/types/ledger';

import { api } from './api-client';

/** Confirmed entries only; drafts waiting for a yes are never listed. */
export async function fetchLedgerEntries(signal?: AbortSignal): Promise<LedgerEntry[]> {
  if (env.useMocks) {
    return mockLatency(mockDb.entries());
  }
  return api.get<LedgerEntry[]>('/ledger/entries', signal);
}

/** The merchant said yes, so the draft becomes a real entry. */
export async function confirmEntry(id: string): Promise<LedgerEntry> {
  if (env.useMocks) {
    return mockLatency(mockDb.confirmEntry(id), 350);
  }
  return api.post<LedgerEntry>(`/ledger/entries/${id}/confirm`);
}

export async function discardEntry(id: string): Promise<void> {
  if (env.useMocks) {
    return mockLatency(mockDb.discardEntry(id), 200);
  }
  return api.delete<void>(`/ledger/entries/${id}`);
}

/**
 * Texts the customer a payment link for what they still owe. `phone` is only
 * needed the first time; the backend remembers it for that customer.
 */
export async function sendPaymentLink(id: string, phone?: string): Promise<LedgerEntry> {
  if (env.useMocks) {
    return mockLatency(mockDb.sendPaymentLink(id, phone), 700);
  }
  return api.post<LedgerEntry>(`/ledger/entries/${id}/payment-link`, { phone });
}

/**
 * The merchant will collect at the counter instead of sending a link. The
 * backend doesn't need to know yet; the mock uses it to have the customer pay
 * on the shop's QR a few seconds later.
 */
export async function skipPaymentLink(id: string): Promise<void> {
  if (env.useMocks) {
    return mockLatency(mockDb.skipPaymentLink(id), 0);
  }
}
