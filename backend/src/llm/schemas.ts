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

export const EXTRACTION_JSON_SHAPE = `{
  "intent": "entry" | "other",
  "customerName": string | null,
  "totalRupees": number | null,
  "paidRupees": number | null,
  "pendingRupees": number | null,
  "items": string[] | null
}`;
