import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ledgerKeys } from '@/features/ledger/use-ledger';
import { announce } from '@/features/listening/conversation-store';
import { toLedgerEntry } from '@/services/ledger-service';
import { declineQrPayment, dismissQrPayment, fetchQrPayments, matchQrPayment } from '@/services/payments-service';

export const qrPaymentKeys = {
  all: ['qr-payments'] as const,
};

export function useQrPayments() {
  return useQuery({
    queryKey: qrPaymentKeys.all,
    queryFn: ({ signal }) => fetchQrPayments(signal),
  });
}

type Resolution = {
  paymentId: string;
  /** The entry the merchant says this payment is, or with `declined` isn't, for. Leave out to dismiss the payment. */
  entryId?: string;
  declined?: boolean;
};

function resolveQrPayment({ paymentId, entryId, declined }: Resolution) {
  if (!entryId) return dismissQrPayment(paymentId);
  return declined ? declineQrPayment(paymentId, entryId) : matchQrPayment(paymentId, entryId);
}

export function useResolveQrPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveQrPayment,
    onSuccess: async ({ line, entry }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qrPaymentKeys.all }),
        queryClient.invalidateQueries({ queryKey: ledgerKeys.all }),
      ]);
      if (line) await announce(line, entry && toLedgerEntry(entry));
    },
  });
}
