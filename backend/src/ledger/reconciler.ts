import { randomBytes } from "node:crypto";
import type { CandidateDto, MatchResponse, SuggestionDto } from "../contracts/index.js";
import { toEntryDto, toPaymentDto } from "../contracts/mappers.js";
import type { Actor, Payment } from "../db/types.js";
import type { EventBus } from "../events/bus.js";
import { AppError, notFound } from "../helpers/errors.js";
import type { Logger } from "../helpers/logger.js";
import { lines } from "../llm/readback.js";
import type { PaytmPaymentNotice } from "../paytm/client.js";
import { nameSimilarity } from "./names.js";
import { applyPayment, getEntry, inTx, listEntries, type Db, type EntryWithCustomer } from "./repository.js";
import { toRupees } from "./state.js";

export type LinkPaymentOutcome =
  | { status: "applied"; paymentId: string; entryId: string; closed: boolean }
  | { status: "suggested"; paymentId: string; entryId: string }
  | { status: "unmatched"; paymentId: string }
  | { status: "duplicate" }
  | { status: "unknown_link" }
  | { status: "ignored"; reason: string };

const MIN_CANDIDATE_SCORE = 40;

export class Reconciler {
  constructor(
    private readonly db: Db,
    private readonly events: EventBus,
    private readonly logger?: Logger,
  ) {}

  /** Paytm link callback: exact match by the link's order reference, no guessing. */
  async handleLinkPayment(notice: PaytmPaymentNotice): Promise<LinkPaymentOutcome> {
    if (notice.status !== "TXN_SUCCESS") return { status: "ignored", reason: `status ${notice.status || "missing"}` };
    if (!notice.txnId || notice.amountPaise <= 0) return { status: "ignored", reason: "missing txn id or amount" };
    if (notice.references.length === 0) return { status: "unknown_link" };

    const link = await this.db
      .selectFrom("payment_links as l")
      .innerJoin("ledger_entries as e", "e.id", "l.entry_id")
      .selectAll("l")
      .select("e.merchant_id")
      .where((eb) => eb.or([eb("l.order_id", "in", notice.references), eb("l.paytm_link_id", "in", notice.references)]))
      .executeTakeFirst();
    if (!link) {
      this.logger?.warn({ references: notice.references, txnId: notice.txnId }, "payment for unknown link");
      return { status: "unknown_link" };
    }

    const outcome = await inTx(this.db, async (trx) => {
      const payment = await trx
        .insertInto("payments")
        .values({
          merchant_id: link.merchant_id,
          source: "LINK",
          txn_id: notice.txnId,
          order_id: link.order_id,
          amount_paise: notice.amountPaise,
          payer_name: null,
          entry_id: link.entry_id,
          match_status: "SUGGESTED",
        })
        .onConflict((oc) => oc.column("txn_id").doNothing())
        .returningAll()
        .executeTakeFirst();
      if (!payment) return { status: "duplicate" } as const;

      const entry = await trx
        .selectFrom("ledger_entries")
        .selectAll()
        .where("id", "=", link.entry_id)
        .forUpdate()
        .executeTakeFirstOrThrow();

      if (entry.status !== "OPEN") {
        await trx.updateTable("payments").set({ match_status: "UNMATCHED" }).where("id", "=", payment.id).execute();
        return { status: "unmatched", paymentId: payment.id } as const;
      }
      if (notice.amountPaise > entry.pending_paise) {
        return { status: "suggested", paymentId: payment.id, entryId: entry.id } as const;
      }
      const applied = await applyPayment(trx, link.merchant_id, entry.id, notice.amountPaise, "paytm", {
        paymentId: payment.id,
        txnId: notice.txnId,
        orderId: link.order_id,
      });
      await trx
        .updateTable("payments")
        .set({ match_status: "MATCHED", resolved_at: new Date() })
        .where("id", "=", payment.id)
        .execute();
      await trx.updateTable("payment_links").set({ status: "PAID" }).where("id", "=", link.id).execute();
      return { status: "applied", paymentId: payment.id, entryId: entry.id, closed: applied.closed } as const;
    });

    if (outcome.status === "applied") {
      await this.publishPaymentApplied(link.merchant_id, outcome.paymentId, outcome.entryId);
    } else if (outcome.status === "suggested") {
      await this.publishSuggestion(link.merchant_id, outcome.paymentId);
    } else if (outcome.status === "unmatched") {
      const payment = await this.getPayment(link.merchant_id, outcome.paymentId);
      this.events.publish(link.merchant_id, {
        type: "pari.announce",
        line: lines.paymentUnmatched(toRupees(payment.amount_paise)),
      });
    }
    return outcome;
  }

  /** A QR / UPI payment with no link reference. Never auto-matched; becomes a suggestion. */
  async handleQrPayment(
    merchantId: string,
    input: { amountPaise: number; payerName?: string | undefined; txnId?: string | undefined },
  ): Promise<SuggestionDto> {
    if (!Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
      throw new AppError(422, "INVALID_AMOUNT", "Payment amount must be positive");
    }
    const candidates = await this.rankCandidates(merchantId, input.amountPaise, input.payerName);
    const payment = await this.db
      .insertInto("payments")
      .values({
        merchant_id: merchantId,
        source: "QR",
        txn_id: input.txnId ?? `QR${Date.now()}${randomBytes(3).toString("hex")}`,
        order_id: null,
        amount_paise: input.amountPaise,
        payer_name: input.payerName ?? null,
        entry_id: null,
        match_status: candidates.length ? "SUGGESTED" : "UNMATCHED",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const suggestion: SuggestionDto = { payment: toPaymentDto(payment), candidates };
    if (candidates.length) {
      this.events.publish(merchantId, { type: "payment.suggested", suggestion });
    } else {
      this.events.publish(merchantId, { type: "pari.announce", line: lines.qrNoCandidate(toRupees(input.amountPaise)) });
    }
    return suggestion;
  }

  async rankCandidates(merchantId: string, amountPaise: number, payerName?: string): Promise<CandidateDto[]> {
    const open = await listEntries(this.db, merchantId, { status: "OPEN", limit: 200 });
    const now = Date.now();
    return open
      .filter((e) => e.pending_paise > 0)
      .map((e) => {
        const reasons: string[] = [];
        let score = 0;
        if (e.pending_paise === amountPaise) {
          score += 100;
          reasons.push("exact pending amount");
        } else if (amountPaise < e.pending_paise) {
          score += 40;
          reasons.push("part payment");
        } else {
          score += 20;
          reasons.push("more than pending");
        }
        if (payerName) {
          const sim = nameSimilarity(payerName, e.customer_name);
          if (sim >= 0.6) {
            score += Math.round(60 * sim);
            reasons.push("payer name matches");
          }
        }
        const ageDays = (now - new Date(e.created_at).getTime()) / 86_400_000;
        score += Math.max(0, Math.round(10 * (1 - ageDays / 30)));
        return { entry: toEntryDto(e), score, reason: reasons.join(", ") };
      })
      .filter((c) => c.score >= MIN_CANDIDATE_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  async getPayment(merchantId: string, paymentId: string): Promise<Payment> {
    const payment = await this.db
      .selectFrom("payments")
      .selectAll()
      .where("merchant_id", "=", merchantId)
      .where("id", "=", paymentId)
      .executeTakeFirst();
    if (!payment) throw notFound("Payment");
    return payment;
  }

  async getSuggestion(merchantId: string, paymentId: string): Promise<SuggestionDto> {
    const payment = await this.getPayment(merchantId, paymentId);
    return this.toSuggestion(merchantId, payment);
  }

  async getSuggestions(merchantId: string): Promise<SuggestionDto[]> {
    const pending = await this.db
      .selectFrom("payments")
      .selectAll()
      .where("merchant_id", "=", merchantId)
      .where("match_status", "=", "SUGGESTED")
      .orderBy("created_at", "asc")
      .execute();
    return Promise.all(pending.map((p) => this.toSuggestion(merchantId, p)));
  }

  private async toSuggestion(merchantId: string, payment: Payment): Promise<SuggestionDto> {
    if (payment.source === "LINK" && payment.entry_id) {
      const entry = await getEntry(this.db, merchantId, payment.entry_id);
      const candidates =
        entry.status === "OPEN" ? [{ entry: toEntryDto(entry), score: 100, reason: "paid via this entry's link" }] : [];
      return { payment: toPaymentDto(payment), candidates };
    }
    const candidates = await this.rankCandidates(merchantId, payment.amount_paise, payment.payer_name ?? undefined);
    return { payment: toPaymentDto(payment), candidates };
  }

  /** Merchant confirmed "haan, Gupta ji ka". */
  async matchPayment(merchantId: string, paymentId: string, entryIdOrPrefix: string, actor: Actor = "merchant"): Promise<MatchResponse> {
    const entryId = (await getEntry(this.db, merchantId, entryIdOrPrefix)).id;
    await inTx(this.db, async (trx) => {
      const payment = await trx
        .selectFrom("payments")
        .selectAll()
        .where("merchant_id", "=", merchantId)
        .where("id", "=", paymentId)
        .forUpdate()
        .executeTakeFirst();
      if (!payment) throw notFound("Payment");
      if (payment.match_status !== "SUGGESTED" && payment.match_status !== "UNMATCHED") {
        throw new AppError(409, "PAYMENT_RESOLVED", `Payment is already ${payment.match_status}`);
      }
      await applyPayment(trx, merchantId, entryId, payment.amount_paise, actor, {
        paymentId: payment.id,
        txnId: payment.txn_id,
        source: payment.source,
      });
      await trx
        .updateTable("payments")
        .set({ match_status: "MATCHED", entry_id: entryId, resolved_at: new Date() })
        .where("id", "=", payment.id)
        .execute();
      if (payment.source === "LINK" && payment.order_id) {
        await trx.updateTable("payment_links").set({ status: "PAID" }).where("order_id", "=", payment.order_id).execute();
      }
    });
    const entry = await getEntry(this.db, merchantId, entryId);
    const payment = await this.getPayment(merchantId, paymentId);
    this.events.publish(merchantId, { type: "entry.updated", entry: toEntryDto(entry) });
    return {
      payment: toPaymentDto(payment),
      entry: toEntryDto(entry),
      line: lines.qrMatched(entry.customer_name, toRupees(entry.pending_paise)),
    };
  }

  /** "Nahi" to every candidate. REJECTED when dismissed outright, UNMATCHED when kept aside for later. */
  async dismissPayment(merchantId: string, paymentId: string, status: "REJECTED" | "UNMATCHED" = "REJECTED"): Promise<MatchResponse> {
    const updated = await this.db
      .updateTable("payments")
      .set({ match_status: status, resolved_at: status === "REJECTED" ? new Date() : null })
      .where("merchant_id", "=", merchantId)
      .where("id", "=", paymentId)
      .where("match_status", "in", ["SUGGESTED", "UNMATCHED"])
      .returningAll()
      .executeTakeFirst();
    if (!updated) {
      await this.getPayment(merchantId, paymentId);
      throw new AppError(409, "PAYMENT_RESOLVED", "Payment is already resolved");
    }
    return { payment: toPaymentDto(updated), line: lines.qrLeftUnmatched() };
  }

  private async publishPaymentApplied(merchantId: string, paymentId: string, entryId: string): Promise<void> {
    const [payment, entry] = await Promise.all([this.getPayment(merchantId, paymentId), getEntry(this.db, merchantId, entryId)]);
    this.publishEntryPaid(merchantId, payment, entry);
  }

  private publishEntryPaid(merchantId: string, payment: Payment, entry: EntryWithCustomer): void {
    const entryDto = toEntryDto(entry);
    this.events.publish(merchantId, { type: "entry.updated", entry: entryDto });
    this.events.publish(merchantId, {
      type: "payment.received",
      payment: toPaymentDto(payment),
      entry: entryDto,
      line: lines.linkPaid(entry.customer_name, toRupees(payment.amount_paise), toRupees(entry.pending_paise)),
    });
  }

  private async publishSuggestion(merchantId: string, paymentId: string): Promise<void> {
    const suggestion = await this.getSuggestion(merchantId, paymentId);
    this.events.publish(merchantId, { type: "payment.suggested", suggestion });
  }
}
