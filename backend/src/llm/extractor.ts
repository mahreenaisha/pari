import type { Language } from "../contracts/index.js";
import { AppError } from "../helpers/errors.js";
import { DEFAULT_LANGUAGE, LANGUAGE_NAMES } from "../languages.js";
import { extractJsonObject, type ChatMessage, type ChatModel } from "./chat.js";
import type { EntryAmounts } from "./lines/book.js";
import { checkAmountsAgainstTranscript } from "./numbers.js";
import { EXTRACTION_JSON_SHAPE, Extraction, finalizeExtraction, hasAmounts, RawExtraction } from "./schemas.js";

/** How many customer names the model is shown, most recently active first. */
export const KNOWN_CUSTOMERS = 100;

export type ExtractionResult =
  | { kind: "entry"; extraction: Extraction; needsReview: boolean; unverifiedFields: string[] }
  | { kind: "not_entry" }
  | { kind: "unclear"; reason: string };

/** What the merchant said in answer to a read-back. `raw` has only what they said in that reply; the rest is null. */
export type ChangeResult = { kind: "said"; raw: RawExtraction } | { kind: "none" } | { kind: "unclear" };

function spokenLanguage(language: Language): string {
  if (language === "hi-IN") return "Input is a speech transcript in Hindi, English or code-mixed Hinglish (Devanagari or Roman).";
  if (language === "en-IN") return "Input is a speech transcript in Indian English, possibly mixed with Hindi.";
  return `Input is a speech transcript in ${LANGUAGE_NAMES[language]}, often mixed with English or Hindi words.`;
}

function systemPrompt(knownCustomers: string[], language: Language, readBack?: EntryAmounts): string {
  return [
    "You extract udhar (shop credit) ledger entries for an Indian kirana merchant.",
    spokenLanguage(language),
    "Return ONLY a JSON object with this exact shape:",
    EXTRACTION_JSON_SHAPE,
    "Rules:",
    '- intent is "entry" only if the merchant is recording goods/money given to a customer, or money received against it. Otherwise "other".',
    "- customerName: the customer as the merchant said it, in Roman script, keeping honorifics like ji/bhai/didi/anna/garu (e.g. \"Gupta ji\", \"Murugan anna\").",
    "- totalRupees: value of goods taken. paidRupees: amount paid now (cash, UPI, anything). pendingRupees: amount still owed (baaki/udhaar).",
    "- Use only numbers actually spoken. If an amount was not said, use null. Never compute or guess.",
    "- Hindi number words: sau=100, hazaar=1000, dedh=1.5, dhai=2.5, saade=+0.5 (saade teen sau = 350).",
    language === "hi-IN" || language === "en-IN"
      ? ""
      : `- Amounts may also be spoken as ${LANGUAGE_NAMES[language]} number words; convert those to numbers.`,
    "- items: goods mentioned (e.g. [\"aata\", \"cheeni\"]) or null.",
    knownCustomers.length
      ? `- Known customers: ${knownCustomers.join(", ")}. If the spoken name is one of these (even with a different spelling or script), return it exactly as listed. A different honorific is a different name: "Gupta didi" is not "Gupta ji".`
      : "",
    readBack
      ? `- The merchant is answering Pari's read-back of this entry: ${readBack.customerName}, total ${readBack.totalRupees}, paid ${readBack.paidRupees}, pending ${readBack.pendingRupees} rupees. If they change something or name a customer, intent is "entry" with only what they said in this reply and null for the rest. A plain yes or no is "other".`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export class EntryExtractor {
  constructor(private readonly chat: ChatModel) {}

  async extract(transcript: string, knownCustomers: string[] = [], language: Language = DEFAULT_LANGUAGE): Promise<ExtractionResult> {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt(knownCustomers, language) },
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

      const result = finalizeExtraction(raw);
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

  /** "Haan, lekin 250 diye" after a read-back: the model knows the entry, and code decides what the change means. */
  async hearChange(transcript: string, knownCustomers: string[], language: Language, readBack: EntryAmounts): Promise<ChangeResult> {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt(knownCustomers, language, readBack) },
      { role: "user", content: transcript },
    ];
    for (let attempt = 0; attempt < 2; attempt++) {
      const reply = await this.chat.complete(messages, { json: true, maxTokens: 400 });
      try {
        const raw = RawExtraction.parse(extractJsonObject(reply));
        return raw.intent === "entry" && (raw.customerName || hasAmounts(raw)) ? { kind: "said", raw } : { kind: "none" };
      } catch (err) {
        messages.push(
          { role: "assistant", content: reply },
          { role: "user", content: `Reply was not valid JSON for the schema: ${(err as Error).message}. Return only the JSON object.` },
        );
      }
    }
    return { kind: "unclear" };
  }
}

export function assertExtractionEntry(result: ExtractionResult): asserts result is Extract<ExtractionResult, { kind: "entry" }> {
  if (result.kind === "not_entry") throw new AppError(422, "NOT_AN_ENTRY", "That did not sound like a ledger entry");
  if (result.kind === "unclear") throw new AppError(422, "AMOUNTS_UNCLEAR", `Could not read the amounts: ${result.reason}`);
}
