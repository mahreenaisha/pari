import type { Env } from "../config/env.js";
import { AppError } from "../helpers/errors.js";
import { generateSignature, verifyCallbackSignature } from "./checksum.js";
import { noticeFromFields, type CreatedLink, type CreateLinkInput, type PaytmClient, type PaytmPaymentNotice } from "./client.js";

interface CreateLinkResponse {
  body?: {
    resultInfo?: { resultStatus?: string; resultCode?: string; resultMessage?: string };
    linkId?: number | string;
    shortUrl?: string;
    linkUrl?: string;
  };
}

/** Paytm Payment Links API (staging host by default). */
export class SandboxPaytmClient implements PaytmClient {
  readonly mode = "sandbox" as const;
  private readonly mid: string;
  private readonly key: string;

  constructor(private readonly env: Env) {
    this.mid = env.PAYTM_MID!;
    this.key = env.PAYTM_MERCHANT_KEY!;
  }

  async createLink(input: CreateLinkInput): Promise<CreatedLink> {
    const body = {
      mid: this.mid,
      linkType: "FIXED",
      linkName: input.orderId.replace(/[^A-Za-z0-9]/g, "").slice(0, 30),
      linkDescription: input.description.slice(0, 100),
      amount: (input.amountPaise / 100).toFixed(2),
      sendSms: true,
      sendEmail: false,
      maxPaymentsAllowed: 1,
      customerContact: { customerName: input.customerName, customerMobile: input.customerPhone },
      ...(this.env.PARI_PUBLIC_URL ? { statusCallbackUrl: `${this.env.PARI_PUBLIC_URL}/api/paytm/callback` } : {}),
      linkNotes: input.orderId,
    };
    const payload = JSON.stringify(body);
    const signature = await generateSignature(payload, this.key);
    const res = await fetch(`${this.env.PAYTM_HOST}/link/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ head: { tokenType: "AES", signature }, body }),
      signal: AbortSignal.timeout(20_000),
    }).catch((err: Error) => {
      throw new AppError(502, "PAYTM_UNREACHABLE", `Could not reach Paytm: ${err.message}`);
    });
    const json = (await res.json().catch(() => ({}))) as CreateLinkResponse;
    const info = json.body?.resultInfo;
    if (!res.ok || info?.resultStatus !== "SUCCESS" || json.body?.linkId === undefined) {
      throw new AppError(502, "PAYTM_LINK_FAILED", `Paytm could not create the link: ${info?.resultMessage ?? res.statusText}`, {
        resultCode: info?.resultCode,
      });
    }
    return { linkId: String(json.body.linkId), shortUrl: json.body.shortUrl ?? json.body.linkUrl ?? "" };
  }

  parseCallback(fields: Record<string, string>): PaytmPaymentNotice | null {
    if (!verifyCallbackSignature(fields, this.key)) return null;
    return noticeFromFields(fields);
  }
}
