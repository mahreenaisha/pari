import type { MatchResponse, QrQuestionDto, SuggestionDto } from '@/types/api';
import type { QrPayment } from '@/types/payments';

import { api } from './api-client';
import { toPaise } from './ledger-service';

function toQrPayment({ payment, candidates }: SuggestionDto, asking: QrQuestionDto | null): QrPayment {
  return {
    id: payment.id,
    source: payment.source === 'LINK' ? 'link' : 'qr',
    amount: toPaise(payment.amountRupees),
    receivedAt: payment.createdAt,
    suggestions: candidates.map(({ entry }) => ({
      entryId: entry.id,
      customerName: entry.customer.name,
      pending: toPaise(entry.pendingRupees),
    })),
    askedEntryId: asking?.paymentId === payment.id ? asking.entryId : undefined,
  };
}

/** Payments waiting for the merchant to say which entry they belong to: the one Pari is asking about, then oldest first. */
export async function fetchQrPayments(signal?: AbortSignal): Promise<QrPayment[]> {
  const { suggestions, asking } = await api.get<{ suggestions: SuggestionDto[]; asking: QrQuestionDto | null }>(
    '/payments/suggestions',
    signal,
  );
  const payments = suggestions.map((suggestion) => toQrPayment(suggestion, asking));
  return [...payments.filter((p) => p.askedEntryId), ...payments.filter((p) => !p.askedEntryId)];
}

export function matchQrPayment(paymentId: string, entryId: string) {
  return api.post<MatchResponse>(`/payments/${paymentId}/match`, { entryId });
}

/** "Nahi" to one suggestion. Pari moves on to the next one; `line` comes back once none are left. */
export function declineQrPayment(paymentId: string, entryId: string) {
  return api.post<Partial<MatchResponse>>(`/payments/${paymentId}/decline`, { entryId });
}

/** The payment isn't for any open entry, so it stays out of the ledger. */
export function dismissQrPayment(paymentId: string) {
  return api.post<MatchResponse>(`/payments/${paymentId}/match`, { reject: true });
}
