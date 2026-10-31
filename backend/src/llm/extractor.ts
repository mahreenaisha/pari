import type { Language } from "../contracts/index.js";
import { AppError } from "../helpers/errors.js";
import { DEFAULT_LANGUAGE, LANGUAGE_NAMES } from "../languages.js";
import { extractJsonObject, type ChatMessage, type ChatModel } from "./chat.js";
import type { EntryAmounts } from "./lines/book.js";
import { checkAmountsAgainstTranscript, extractNumbers } from "./numbers.js";
import { EXTRACTION_JSON_SHAPE, type Extraction, finalizeExtraction, hasAmounts, RawReply, type RawEvent } from "./schemas.js";

/** How many customer names the model is shown, most recently active first. */
export const KNOWN_CUSTOMERS = 100;

/** Goods taken now, complete, with whether every amount was heard in the transcript. */
export interface HeardEntry {
  kind: "entry";
  extraction: Extraction;
  needsReview: boolean;
  unverifiedFields: string[];
  transcript: string;
}

/** Money paid back. `amountRupees` is null for "poora" with no amount: everything owed. */
export interface HeardRepayment {
  kind: "repayment";
  customerName: string;
  amountRupees: number | null;
  needsReview: boolean;
  transcript: string;
}

export type HeardEvent = HeardEntry | HeardRepayment;
export type Missing = "name" | "amount";

export type ExtractionResult =
  | { kind: "events"; events: HeardEvent[] }
  | { kind: "missing"; missing: Missing; customerName: string | null }
  | { kind: "balance"; customerName: string | null }
  | { kind: "not_entry" }
  | { kind: "unclear"; reason: string };

/** What Pari just read back, for an answer that may change it. */
export type ReadBack = { kind: "entry"; entry: EntryAmounts } | { kind: "repayment"; customerName: string; amountRupees: number };

/** What the merchant said in answer to a read-back: only what they said in that reply, the rest null. */
export type ChangeResult = { kind: "said"; event: RawEvent } | { kind: "none" } | { kind: "unclear" };

function spokenLanguage(language: Language): string {
  if (language === "hi-IN") return "Input is a speech transcript in Hindi, English or code-mixed Hinglish (Devanagari or Roman).";
  if (language === "en-IN") return "Input is a speech transcript in Indian English, possibly mixed with Hindi.";
  return `Input is a speech transcript in ${LANGUAGE_NAMES[language]}, often mixed with English or Hindi words.`;
}

function readBackRule(readBack: ReadBack): string {
  const what =
    readBack.kind === "entry"
      ? `this entry: ${readBack.entry.customerName}, total ${readBack.entry.totalRupees}, paid ${readBack.entry.paidRupees}, pending ${readBack.entry.pendingRupees} rupees`
      : `this repayment: ${readBack.customerName} paid back ${readBack.amountRupees} rupees`;
  return `- The merchant is answering Pari's read-back of ${what}. If they change something or name a customer, intent is "record" with one ${readBack.kind} event holding only what they said in this reply and null for the rest. A plain yes or no is "other".`;
}

function systemPrompt(knownCustomers: string[], language: Language, readBack?: ReadBack): string {
  return [
    "You turn what an Indian kirana merchant says into udhar (shop credit) ledger events.",
    spokenLanguage(language),
    "Return ONLY a JSON object with this exact shape:",
    EXTRACTION_JSON_SHAPE,
    "Rules:",
    '- intent "record": the merchant says a customer took goods, or paid back money they owed. One event for each, in the order said.',
    '- An "entry" is goods taken now. totalRupees: value of the goods. paidRupees: paid on the spot (cash, UPI, anything). pendingRupees: left as udhar (baaki).',
    '- A "repayment" is money paid back against earlier udhar, with no new goods ("Gupta ji ne 100 rupaye diye", "Verma ji ne udhaar chuka diya"). amountRupees: the money paid back. full: true when they cleared all of it ("poora", "saara", "sab"), with amountRupees null unless an amount was said.',
    '- intent "balance": a question about how much is owed or pending, by one customer or in total ("Gupta ji ka kitna baaki hai?", "total udhaar kitna hai?"). balanceOf: the customer asked about, or null for the whole shop. events: [].',
    '- intent "other": anything else. events: [], balanceOf: null.',
    "- customerName: the customer as the merchant said it, in Roman script, keeping honorifics like ji/bhai/didi/anna/garu/Mr/Mrs (e.g. \"Gupta ji\", \"Murugan anna\", \"Mrs Sharma\"). null if no name was said.",
    "- Use only numbers actually spoken. If an amount was not said, use null. Never compute or guess.",
    "- Hindi number words: sau=100, hazaar=1000, dedh=1.5, dhai=2.5, saade=+0.5 (saade teen sau = 350).",
    language === "hi-IN" || language === "en-IN"
      ? ""
      : `- Amounts may also be spoken as ${LANGUAGE_NAMES[language]} number words; convert those to numbers.`,
    "- items: goods mentioned (e.g. [\"aata\", \"cheeni\"]) or null.",
    knownCustomers.length
      ? `- Known customers: ${knownCustomers.join(", ")}. If the spoken name is one of these (even with a different spelling or script), return it exactly as listed. A different honorific is a different name: "Gupta didi" is not "Gupta ji".`
      : "",
    readBack ? readBackRule(readBack) : "",
  ]
    .filter(Boolean)
    .join("\n");
}

type Heard =
  | { kind: "heard"; event: HeardEvent }
  | { kind: "missing"; missing: Missing; customerName: string | null }
  | { kind: "wrong"; error: string };

/** One event as the merchant said it: complete, missing a piece to ask for, or wrong. */
export function hearEvent(event: RawEvent, transcript: string): Heard {
  if (!event.customerName) return { kind: "missing", missing: "name", customerName: null };
  const customerName = event.customerName;
  if (event.type === "repayment") {
    const amount = event.amountRupees;
    if (amount === null) {
      return event.full
        ? { kind: "heard", event: { kind: "repayment", customerName, amountRupees: null, needsReview: false, transcript } }
        : { kind: "missing", missing: "amount", customerName };
    }
    if (!Number.isInteger(amount) || amount <= 0) return { kind: "wrong", error: "a repayment must be whole rupees, more than zero" };
    const needsReview = !extractNumbers(transcript).includes(amount);
    return { kind: "heard", event: { kind: "repayment", customerName, amountRupees: amount, needsReview, transcript } };
  }
  if (!hasAmounts(event)) return { kind: "missing", missing: "amount", customerName };
  const result = finalizeExtraction(event);
  if (!result.ok) return { kind: "wrong", error: result.error };
  const e = result.value;
  const check = checkAmountsAgainstTranscript({ total: e.totalRupees, paid: e.paidRupees, pending: e.pendingRupees }, transcript);
  return {
    kind: "heard",
    event: { kind: "entry", extraction: e, needsReview: !check.verified, unverifiedFields: check.unverifiedFields, transcript },
  };
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
      const reply = await this.chat.complete(messages, { json: true, maxTokens: 600 });
      let raw: RawReply;
      try {
        raw = RawReply.parse(extractJsonObject(reply));
      } catch (err) {
        lastError = `Reply was not valid JSON for the schema: ${(err as Error).message}`;
        messages.push({ role: "assistant", content: reply }, { role: "user", content: `${lastError}. Return only the JSON object.` });
        continue;
      }
      if (raw.intent === "balance") return { kind: "balance", customerName: raw.balanceOf || null };
      const said = raw.intent === "record" ? (raw.events ?? []) : [];
      if (said.length === 0) return { kind: "not_entry" };

      const heard = said.map((event) => hearEvent(event, transcript));
      const wrong = heard.find((h) => h.kind === "wrong");
      if (wrong) {
        lastError = wrong.error;
        messages.push(
          { role: "assistant", content: reply },
          { role: "user", content: `That failed validation: ${wrong.error}. Re-read the transcript and return corrected JSON only.` },
        );
        continue;
      }
      const missing = heard.find((h) => h.kind === "missing");
      if (missing) return { kind: "missing", missing: missing.missing, customerName: missing.customerName };
      return { kind: "events", events: heard.flatMap((h) => (h.kind === "heard" ? [h.event] : [])) };
    }
    return { kind: "unclear", reason: lastError };
  }

  /** "Haan, lekin 250 diye" after a read-back: the model knows what was read back, and code decides what the change means. */
  async hearChange(transcript: string, knownCustomers: string[], language: Language, readBack: ReadBack): Promise<ChangeResult> {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt(knownCustomers, language, readBack) },
      { role: "user", content: transcript },
    ];
    for (let attempt = 0; attempt < 2; attempt++) {
      const reply = await this.chat.complete(messages, { json: true, maxTokens: 600 });
      try {
        const raw = RawReply.parse(extractJsonObject(reply));
        const event = raw.intent === "record" ? raw.events?.[0] : undefined;
        if (!event) return { kind: "none" };
        const amounts = event.type === "entry" ? hasAmounts(event) : event.amountRupees !== null || Boolean(event.full);
        return event.customerName || amounts ? { kind: "said", event } : { kind: "none" };
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

/** The single entry the voice route creates; anything else is an error for its caller. */
export function firstEntry(result: ExtractionResult): HeardEntry {
  if (result.kind === "unclear") throw new AppError(422, "AMOUNTS_UNCLEAR", `Could not read the amounts: ${result.reason}`);
  if (result.kind === "missing") throw new AppError(422, "AMOUNTS_UNCLEAR", `The ${result.missing} was not said`);
  const entry = result.kind === "events" ? result.events.find((e) => e.kind === "entry") : undefined;
  if (!entry || entry.kind !== "entry") throw new AppError(422, "NOT_AN_ENTRY", "That did not sound like a ledger entry");
  return entry;
}
