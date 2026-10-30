export type Profile = {
  id: string;
  /** Shop name customers see under the QR code. */
  businessName: string;
  /** Human-readable address shown under the QR code. */
  paymentAddress: string;
  /** Exact string encoded into the QR code. */
  qrPayload: string;
};
