import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ledgerKeys } from '@/features/ledger/use-ledger';
import { dismissQrPayment, fetchQrPayments, matchQrPayment } from '@/services/payments-service';

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
  /** The entry the merchant says this payment is for. Leave out to dismiss the payment. */
  entryId?: string;
};

export function useResolveQrPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, entryId }: Resolution) => {
      if (entryId) await matchQrPayment(paymentId, entryId);
      else await dismissQrPayment(paymentId);
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qrPaymentKeys.all }),
        queryClient.invalidateQueries({ queryKey: ledgerKeys.all }),
      ]),
  });
}
