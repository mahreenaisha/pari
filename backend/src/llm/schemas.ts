import { z } from "zod";

const amount = z.number().nonnegative().nullable();
const name = z.string().trim().nullable();

/** Goods taken now, with whatever was paid on the spot. Any amount or name the LLM did not hear is null. */
export const RawEntry = z.object({
  type: z.literal("entry"),
  customerName: name,
  totalRupees: amount,
  paidRupees: amount,
  pendingRupees: amount,
  items: z.array(z.string()).nullable().optional(),
});
export type RawEntry = z.infer<typeof RawEntry>;

/** Money paid back against what a customer already owes. `full` is "poora chuka diya". */
export const RawRepayment = z.object({
  type: z.literal("repayment"),
  customerName: name,
  amountRupees: amount,
  full: z.boolean().nullable().optional(),
});
export type RawRepayment = z.infer<typeof RawRepayment>;

export const RawEvent = z.discriminatedUnion("type", [RawEntry, RawRepayment]);
export type RawEvent = z.infer<typeof RawEvent>;

/** What the LLM is asked to return: what happened, in the order said, or a question about what's owed. */
export const RawReply = z.object({
  // The model sometimes names the event type here ("repayment"), with the events themselves right.
  intent: z.preprocess((v) => (v === "entry" || v === "repayment" ? "record" : v), z.enum(["record", "balance", "other"])),
  events: z.array(RawEvent).nullable().optional(),
  balanceOf: name.optional(),
});
export type RawReply = z.infer<typeof RawReply>;

/** What the ledger accepts: whole rupees, and the books must balance. */
export const Extraction = z
  .object({
    customerName: z.string().trim().min(1, "customer name missing"),
    totalRupees: z.number().int("total must be whole rupees").nonnegative(),
    paidRupees: z.number().int("paid must be whole rupees").nonnegative(),
    pendingRupees: z.number().int("pending must be whole rupees").nonnegative(),
    items: z.array(z.string()).default([]),
  })
  .refine((e) => e.totalRupees === e.paidRupees + e.pendingRupees, "total != paid + pending")
  .refine((e) => e.totalRupees > 0, "total must be more than zero");
export type Extraction = z.infer<typeof Extraction>;

/**
 * Fills in the one missing amount when two are known, and treats a lone
 * total or lone pending as pure udhar. Never invents a number otherwise.
 */
export function completeAmounts(raw: SaidAmounts): {
  totalRupees: number | null;
  paidRupees: number | null;
  pendingRupees: number | null;
} {
  let { totalRupees: t, paidRupees: p, pendingRupees: q } = raw;
  if (t !== null && p !== null && q === null) q = t - p;
  else if (t !== null && p === null && q !== null) p = t - q;
  else if (t === null && p !== null && q !== null) t = p + q;
  else if (t !== null && p === null && q === null) {
    p = 0;
    q = t;
  } else if (t === null && p === null && q !== null) {
    t = q;
    p = 0;
  }
  return { totalRupees: t, paidRupees: p, pendingRupees: q };
}

type Amounts = Pick<Extraction, "totalRupees" | "paidRupees" | "pendingRupees">;
type SaidAmounts = Pick<RawEntry, "totalRupees" | "paidRupees" | "pendingRupees">;

export const hasAmounts = (said: SaidAmounts) =>
  said.totalRupees !== null || said.paidRupees !== null || said.pendingRupees !== null;

/**
 * A change keeps what the merchant didn't touch: "250 diye" against a ₹350 total keeps the total and
 * works out what's left, and "300 ka tha" keeps what was paid.
 */
export function applyCorrection(said: SaidAmounts, before: Amounts): Amounts {
  const { totalRupees: t, paidRupees: p, pendingRupees: q } = said;
  if (t === null && p !== null && q !== null) return { totalRupees: p + q, paidRupees: p, pendingRupees: q };
  const total = t ?? before.totalRupees;
  if (p !== null && q !== null) return { totalRupees: total, paidRupees: p, pendingRupees: q };
  if (p !== null) return { totalRupees: total, paidRupees: p, pendingRupees: total - p };
  if (q !== null) return { totalRupees: total, paidRupees: total - q, pendingRupees: q };
  return { totalRupees: total, paidRupees: before.paidRupees, pendingRupees: total - before.paidRupees };
}

export function toExtraction(
  customerName: string | null,
  amounts: { totalRupees: number | null; paidRupees: number | null; pendingRupees: number | null },
  items: string[] | null | undefined,
): { ok: true; value: Extraction } | { ok: false; error: string } {
  const parsed = Extraction.safeParse({ customerName: customerName ?? "", ...amounts, items: items ?? [] });
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
}

/** An entry heard on its own, with the one missing amount filled in. */
export const finalizeExtraction = (raw: RawEntry) => toExtraction(raw.customerName, completeAmounts(raw), raw.items);

export const EXTRACTION_JSON_SHAPE = `{
  "intent": "record" | "balance" | "other",
  "events": [event, ...],
  "balanceOf": string | null
}
where each event is one of:
{ "type": "entry", "customerName": string | null, "totalRupees": number | null, "paidRupees": number | null, "pendingRupees": number | null, "items": string[] | null }
{ "type": "repayment", "customerName": string | null, "amountRupees": number | null, "full": boolean }`;
