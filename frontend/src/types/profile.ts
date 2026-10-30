export type Profile = {
  id: string;
  name: string;
  /** Human-readable address shown under the QR code. */
  paymentAddress: string;
  /** Exact string encoded into the QR code. */
  qrPayload: string;
};
