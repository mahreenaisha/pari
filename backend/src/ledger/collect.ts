import { randomBytes } from "node:crypto";
import type { CollectResponse } from "../contracts/index.js";
import { toEntryDto, toLinkDto } from "../contracts/mappers.js";
import type { EventBus } from "../events/bus.js";
import { AppError } from "../helpers/errors.js";
import { parseIndianMobile } from "../llm/numbers.js";
import { lines } from "../llm/readback.js";
import type { PaytmClient } from "../paytm/client.js";
import { audit, getEntry, setCustomerPhone, type Db } from "./repository.js";
import { toRupees } from "./state.js";

export class CollectService {
  constructor(
    private readonly db: Db,
    private readonly paytm: PaytmClient,
    private readonly events: EventBus,
  ) {}

  /** Sends a fixed-amount Paytm link for whatever is still pending. The phone is asked for once per customer. */
  async sendLink(merchantId: string, entryIdOrPrefix: string, phoneInput?: string): Promise<CollectResponse> {
    let entry = await getEntry(this.db, merchantId, entryIdOrPrefix);
    if (entry.status !== "OPEN" || entry.pending_paise <= 0) {
      throw new AppError(409, "NOTHING_TO_COLLECT", `Entry is ${entry.status} with ₹${toRupees(entry.pending_paise)} pending`);
    }

    let phone = entry.customer_phone;
    if (phoneInput) {
      const parsed = parseIndianMobile(phoneInput);
      if (!parsed) throw new AppError(422, "INVALID_PHONE", "Phone must be a 10-digit Indian mobile number");
      if (parsed !== phone) {
        await setCustomerPhone(this.db, merchantId, entry.customer_id, parsed);
        entry = await getEntry(this.db, merchantId, entry.id);
      }
      phone = parsed;
    }
    if (!phone) throw new AppError(422, "PHONE_REQUIRED", `No mobile number on file for ${entry.customer_name}`);

    const active = await this.db
      .selectFrom("payment_links")
      .selectAll()
      .where("entry_id", "=", entry.id)
      .where("status", "=", "ACTIVE")
      .execute();
    const reusable = active.find((l) => l.amount_paise === entry.pending_paise && l.phone === phone);
    if (reusable) {
      return { link: toLinkDto(reusable), entry: toEntryDto(entry), line: lines.linkSent(entry.customer_name, toRupees(reusable.amount_paise)) };
    }
    if (active.length) {
      await this.db.updateTable("payment_links").set({ status: "EXPIRED" }).where("entry_id", "=", entry.id).where("status", "=", "ACTIVE").execute();
    }

    const orderId = `PARI${entry.id.slice(0, 8).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
    const created = await this.paytm.createLink({
      orderId,
      amountPaise: entry.pending_paise,
      customerName: entry.customer_name,
      customerPhone: phone,
      description: `Udhar ${entry.customer_name} - ₹${toRupees(entry.pending_paise)}`,
    });
    const link = await this.db
      .insertInto("payment_links")
      .values({
        entry_id: entry.id,
        order_id: orderId,
        paytm_link_id: created.linkId,
        amount_paise: entry.pending_paise,
        short_url: created.shortUrl,
        phone,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await audit(this.db, { entryId: entry.id, actor: "merchant", payload: { linkSent: { orderId, phone, amountPaise: link.amount_paise } } });

    const entryDto = toEntryDto(entry);
    this.events.publish(merchantId, { type: "entry.updated", entry: entryDto });
    return { link: toLinkDto(link), entry: entryDto, line: lines.linkSent(entry.customer_name, toRupees(link.amount_paise)) };
  }
}
