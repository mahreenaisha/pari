import { randomBytes } from "node:crypto";
import type { Logger } from "../helpers/logger.js";
import { noticeFromFields, type CreatedLink, type CreateLinkInput, type PaytmClient, type PaytmPaymentNotice } from "./client.js";

/** Stands in for Paytm in demos: links are fake, SMS is a log line, payments come from /api/dev/simulate. */
export class MockPaytmClient implements PaytmClient {
  readonly mode = "mock" as const;
  readonly sent: CreateLinkInput[] = [];

  constructor(private readonly logger?: Logger) {}

  async createLink(input: CreateLinkInput): Promise<CreatedLink> {
    this.sent.push(input);
    const linkId = `mock_${randomBytes(6).toString("hex")}`;
    const shortUrl = `https://paytm.me/mock-${linkId.slice(5)}`;
    this.logger?.info(
      { to: input.customerPhone, amountPaise: input.amountPaise, orderId: input.orderId, shortUrl },
      "[mock paytm] SMS payment link sent",
    );
    return { linkId, shortUrl };
  }

  parseCallback(fields: Record<string, string>): PaytmPaymentNotice | null {
    return noticeFromFields(fields);
  }
}
