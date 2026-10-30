export type MatchSuggestion = {
  entryId: string;
  customerName: string;
  /** What the entry still owes, in paise. */
  pending: number;
};

/** Money that arrived on the merchant's QR without a payment link to tie it to an entry. */
export type QrPayment = {
  id: string;
  /** Paise. */
  amount: number;
  /** ISO-8601 timestamp. */
  receivedAt: string;
  /** Open entries this payment may settle, best match first. */
  suggestions: MatchSuggestion[];
};

/** Pushed by the backend when money moves without the merchant doing anything in the app. */
export type PaymentEvent =
  | { type: 'link-paid'; entryId: string }
  | { type: 'qr-payment'; paymentId: string };
