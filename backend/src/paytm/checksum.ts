import PaytmChecksum from "paytmchecksum";

export function generateSignature(body: string, merchantKey: string): Promise<string> {
  return PaytmChecksum.generateSignature(body, merchantKey);
}

/** Paytm signs callback form fields (minus CHECKSUMHASH). A malformed checksum counts as invalid. */
export function verifyCallbackSignature(fields: Record<string, string>, merchantKey: string): boolean {
  const checksum = fields.CHECKSUMHASH;
  if (!checksum) return false;
  const { CHECKSUMHASH: _ignored, ...params } = fields;
  const log = console.log;
  try {
    console.log = () => {};
    return PaytmChecksum.verifySignature(params, merchantKey, checksum);
  } catch {
    return false;
  } finally {
    console.log = log;
  }
}
