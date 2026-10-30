import { env } from '@/config/env';
import { mockDb, mockLatency } from '@/mocks/db';
import { subscribeToMockEvents } from '@/mocks/events';
import type { LedgerEntry } from '@/types/ledger';
import type { PaymentEvent, QrPayment } from '@/types/payments';

import { api } from './api-client';

/** QR payments the merchant hasn't matched to an entry yet. */
export async function fetchQrPayments(signal?: AbortSignal): Promise<QrPayment[]> {
  if (env.useMocks) {
    return mockLatency(mockDb.qrPayments(), 250);
  }
  return api.get<QrPayment[]>('/payments/qr/unmatched', signal);
}

export async function matchQrPayment(paymentId: string, entryId: string): Promise<LedgerEntry> {
  if (env.useMocks) {
    return mockLatency(mockDb.matchQrPayment(paymentId, entryId), 350);
  }
  return api.post<LedgerEntry>(`/payments/qr/${paymentId}/match`, { entryId });
}

/** The payment isn't for any open entry, so it stays out of the ledger. */
export async function dismissQrPayment(paymentId: string): Promise<void> {
  if (env.useMocks) {
    return mockLatency(mockDb.dismissQrPayment(paymentId), 200);
  }
  return api.post<void>(`/payments/qr/${paymentId}/dismiss`);
}

/**
 * Calls `listener` when a payment link is paid or money lands on the QR. Only
 * the mocks emit events so far; the backend still needs a push channel for them.
 */
export function subscribeToPaymentEvents(listener: (event: PaymentEvent) => void): () => void {
  if (env.useMocks) {
    return subscribeToMockEvents(listener);
  }
  return () => {};
}
