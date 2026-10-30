export interface CreateLinkInput {
  orderId: string;
  amountPaise: number;
  customerName: string;
  customerPhone: string;
  description: string;
}

export interface CreatedLink {
  linkId: string;
  shortUrl: string;
}

/** A successful payment as reported by Paytm, normalized from its callback form fields. */
export interface PaytmPaymentNotice {
  txnId: string;
  status: string;
  amountPaise: number;
  /** Any of the references Paytm may send back for a link payment. */
  references: string[];
  raw: Record<string, string>;
}

export interface PaytmClient {
  readonly mode: "mock" | "sandbox";
  createLink(input: CreateLinkInput): Promise<CreatedLink>;
  /** Returns the parsed notice if the callback signature is valid, otherwise null. */
  parseCallback(fields: Record<string, string>): PaytmPaymentNotice | null;
}

export function rupeesStringToPaise(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function noticeFromFields(fields: Record<string, string>): PaytmPaymentNotice {
  const refs = [fields.ORDERID, fields.LINKID, fields.linkId, fields.MERC_UNQ_REF?.replace(/^LI_/, "")].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  return {
    txnId: fields.TXNID ?? "",
    status: fields.STATUS ?? "",
    amountPaise: rupeesStringToPaise(fields.TXNAMOUNT),
    references: [...new Set(refs)],
    raw: fields,
  };
}
