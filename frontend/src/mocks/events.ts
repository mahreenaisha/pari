import type { PaymentEvent } from '@/types/payments';

type Listener = (event: PaymentEvent) => void;

const listeners = new Set<Listener>();

export function subscribeToMockEvents(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitMockEvent(event: PaymentEvent) {
  listeners.forEach((listener) => listener(event));
}
