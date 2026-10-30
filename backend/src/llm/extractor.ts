import { AppError } from "../helpers/errors.js";
import { extractJsonObject, type ChatMessage, type ChatModel } from "./chat.js";
import { checkAmountsAgainstTranscript } from "./numbers.js";
import { completeAmounts, EXTRACTION_JSON_SHAPE, Extraction, RawExtraction } from "./schemas.js";

export type ExtractionResult =
  | { kind: "entry"; extraction: Extraction; needsReview: boolean; unverifiedFields: string[] }
  | { kind: "not_entry" }
  | { kind: "unclear"; reason: string };

function systemPrompt(knownCustomers: string[]): string {
  return [
    "You extract udhar (shop credit) ledger entries for an Indian kirana merchant.",
    "Input is a speech transcript in Hindi, English or code-mixed Hinglish (Devanagari or Roman).",
    "Return ONLY a JSON object with this exact shape:",
    EXTRACTION_JSON_SHAPE,
    "Rules:",
    '- intent is "entry" only if the merchant is recording goods/money given to a customer, or money received against it. Otherwise "other".',
    "- customerName: the customer as the merchant said it, in Roman script, keeping honorifics like ji/bhai/didi (e.g. \"Gupta ji\").",
    "- totalRupees: value of goods taken. paidRupees: amount paid now (cash, UPI, anything). pendingRupees: amount still owed (baaki/udhaar).",
    "- Use only numbers actually spoken. If an amount was not said, use null. Never compute or guess.",
    "- Hindi number words: sau=100, hazaar=1000, dedh=1.5, dhai=2.5, saade=+0.5 (saade teen sau = 350).",
    "- items: goods mentioned (e.g. [\"aata\", \"cheeni\"]) or null.",
    knownCustomers.length
      ? `- Known customers: ${knownCustomers.join(", ")}. If the spoken name is one of these (even with a different spelling or script), return it exactly as listed.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function finalize(raw: RawExtraction): { ok: true; value: Extraction } | { ok: false; error: string } {
  const amounts = completeAmounts(raw);
  const parsed = Extraction.safeParse({
    customerName: raw.customerName ?? "",
    ...amounts,
    items: raw.items ?? [],
  });
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
}

export class EntryExtractor {
  constructor(private readonly chat: ChatModel) {}

  async extract(transcript: string, knownCustomers: string[] = []): Promise<ExtractionResult> {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt(knownCustomers) },
      { role: "user", content: transcript },
    ];

    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const reply = await this.chat.complete(messages, { json: true, maxTokens: 400 });
      let raw: RawExtraction;
      try {
        raw = RawExtraction.parse(extractJsonObject(reply));
      } catch (err) {
        lastError = `Reply was not valid JSON for the schema: ${(err as Error).message}`;
        messages.push({ role: "assistant", content: reply }, { role: "user", content: `${lastError}. Return only the JSON object.` });
        continue;
      }
      if (raw.intent === "other") return { kind: "not_entry" };

      const result = finalize(raw);
      if (result.ok) {
        const check = checkAmountsAgainstTranscript(
          { total: result.value.totalRupees, paid: result.value.paidRupees, pending: result.value.pendingRupees },
          transcript,
        );
        return {
          kind: "entry",
          extraction: result.value,
          needsReview: !check.verified,
          unverifiedFields: check.unverifiedFields,
        };
      }
      lastError = result.error;
      messages.push(
        { role: "assistant", content: reply },
        { role: "user", content: `That failed validation: ${result.error}. Re-read the transcript and return corrected JSON only.` },
      );
    }
    return { kind: "unclear", reason: lastError };
  }
}

export function assertExtractionEntry(result: ExtractionResult): asserts result is Extract<ExtractionResult, { kind: "entry" }> {
  if (result.kind === "not_entry") throw new AppError(422, "NOT_AN_ENTRY", "That did not sound like a ledger entry");
  if (result.kind === "unclear") throw new AppError(422, "AMOUNTS_UNCLEAR", `Could not read the amounts: ${result.reason}`);
}
