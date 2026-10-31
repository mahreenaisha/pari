import { z } from "zod";

const amount = z.number().nonnegative().nullable();

/** What the LLM is asked to return. Any amount it did not hear is null. */
export const RawExtraction = z.object({
  intent: z.enum(["entry", "other"]),
  customerName: z.string().trim().nullable(),
  totalRupees: amount,
  paidRupees: amount,
  pendingRupees: amount,
  items: z.array(z.string()).nullable().optional(),
});
export type RawExtraction = z.infer<typeof RawExtraction>;

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
export function completeAmounts(raw: RawExtraction): {
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
type SaidAmounts = Pick<RawExtraction, "totalRupees" | "paidRupees" | "pendingRupees">;

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
export const finalizeExtraction = (raw: RawExtraction) => toExtraction(raw.customerName, completeAmounts(raw), raw.items);

export const EXTRACTION_JSON_SHAPE = `{
  "intent": "entry" | "other",
  "customerName": string | null,
  "totalRupees": number | null,
  "paidRupees": number | null,
  "pendingRupees": number | null,
  "items": string[] | null
}`;
