import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { qrPaymentKeys } from '@/features/qr/use-qr-payments';
import { subscribeToPaymentEvents } from '@/services/payments-service';

import { ledgerKeys } from './use-ledger';

/** Keeps the ledger and the QR match queue current as payments arrive in the background. */
export function usePaymentEvents() {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeToPaymentEvents(() => {
        void queryClient.invalidateQueries({ queryKey: ledgerKeys.all });
        void queryClient.invalidateQueries({ queryKey: qrPaymentKeys.all });
      }),
    [queryClient],
  );
}
