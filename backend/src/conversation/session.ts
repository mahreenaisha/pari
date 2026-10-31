import { randomUUID } from "node:crypto";
import type { ConversationState, EntryDto, Language, Line, LinkDto, SuggestionDto } from "../contracts/index.js";
import { toEntryDto } from "../contracts/mappers.js";
import type { Customer } from "../db/types.js";
import type { EventBus } from "../events/bus.js";
import { AppError } from "../helpers/errors.js";
import type { Logger } from "../helpers/logger.js";
import { DEFAULT_LANGUAGE, type MerchantLanguages } from "../languages.js";
import { KNOWN_CUSTOMERS, type EntryExtractor } from "../llm/extractor.js";
import { detectYesNo, otherWords, type YesNo } from "../llm/intent.js";
import { joinLines, linesFor } from "../llm/lines/index.js";
import {
  checkAmountsAgainstTranscript,
  extractNumbers,
  mentionsNumber,
  parseIndianMobile,
  READS_NUMBER_WORDS,
} from "../llm/numbers.js";
import { applyCorrection, finalizeExtraction, hasAmounts, toExtraction, type Extraction } from "../llm/schemas.js";
import type { CollectService } from "../ledger/collect.js";
import { matchName } from "../ledger/names.js";
import type { Reconciler } from "../ledger/reconciler.js";
import {
  confirmEntry,
  createCustomer,
  createUnconfirmedEntry,
  getCustomer,
  getEntry,
  knownCustomerNames,
  matchCustomers,
  rejectEntry,
  updateUnconfirmedEntry,
  type Db,
  type EntryWithCustomer,
} from "../ledger/repository.js";
import { toPaise, toRupees } from "../ledger/state.js";

interface QrTurn {
  paymentId: string;
  amountRupees: number;
  candidateEntryIds: string[];
  index: number;
}

/** An entry as heard, before it has a customer or a row. */
interface Heard {
  extraction: Extraction;
  needsReview: boolean;
  transcript: string;
}

/** "Gupta didi aur Gupta ji ek hi hain?", asked about each customer the name only maybe fits. */
interface CustomerChoice {
  heard: Heard;
  candidateIds: string[];
  index: number;
}

export interface Session {
  id: string;
  merchantId: string;
  state: ConversationState;
  entryId: string | null;
  /** Whose entry is waiting for a yes, to mention if the session runs out first. */
  entryCustomer: string | null;
  phone: string | null;
  qr: QrTurn | null;
  choice: CustomerChoice | null;
  /** Entries said while another was waiting for a yes, read back in turn. */
  queue: Heard[];
  /** Customers whose entries were never saved because the session ran out, told on the next turn. */
  dropped: string[];
  /** The merchant's language, read again on every turn so a change in the app applies straight away. */
  language: Language;
  updatedAt: number;
}

export interface TurnResult {
  sessionId: string;
  state: ConversationState;
  reply: Line;
  entry?: EntryDto;
  link?: LinkDto;
  needsReview?: boolean;
}

interface Deps {
  db: Db;
  extractor: EntryExtractor;
  reconciler: Reconciler;
  collect: CollectService;
  events: EventBus;
  languages: MerchantLanguages;
  logger?: Logger;
}

type Step = Omit<TurnResult, "sessionId" | "state"> & { state: ConversationState };

/**
 * Server-side dialogue so every client (CLI, web, mobile) only sends what the
 * merchant said and plays back what Pari answers.
 */
export class ConversationEngine {
  private readonly sessions = new Map<string, Session>();
  private readonly locks = new Map<string, Promise<unknown>>();

  constructor(
    private readonly deps: Deps,
    private readonly ttlMs = 120_000,
  ) {
    deps.events.subscribeAll((merchantId, event) => {
      if (event.type === "payment.suggested") {
        void this.withLock(merchantId, () => this.offerSuggestion(merchantId, event.suggestion)).catch((err) =>
          deps.logger?.error({ err }, "could not start QR turn"),
        );
      }
    });
  }

  getSession(merchantId: string): Session {
    let session = this.sessions.get(merchantId);
    if (!session) {
      session = {
        id: randomUUID(),
        merchantId,
        state: "IDLE",
        entryId: null,
        entryCustomer: null,
        phone: null,
        qr: null,
        choice: null,
        queue: [],
        dropped: [],
        language: DEFAULT_LANGUAGE,
        updatedAt: Date.now(),
      };
      this.sessions.set(merchantId, session);
    } else if (session.state !== "IDLE" && Date.now() - session.updatedAt > this.ttlMs) {
      session.dropped = unsavedCustomers(session);
      session.queue = [];
      this.toIdle(session);
    }
    return session;
  }

  reset(merchantId: string): Session {
    this.sessions.delete(merchantId);
    return this.getSession(merchantId);
  }

  /** The merchant settled this payment by tap, so a pending spoken question about it is dropped. */
  releasePayment(merchantId: string, paymentId: string): Promise<void> {
    return this.withLock(merchantId, async () => {
      const session = this.sessions.get(merchantId);
      if (session?.state === "AWAITING_QR_MATCH" && session.qr?.paymentId === paymentId) {
        this.toIdle(session);
        session.updatedAt = Date.now();
      }
    });
  }

  handle(merchantId: string, text: string): Promise<TurnResult> {
    return this.withLock(merchantId, async () => {
      const session = this.getSession(merchantId);
      session.language = await this.deps.languages.get(merchantId);
      let step = await this.dispatch(session, text.trim());
      if (step.state === "IDLE") step = await this.whatNext(session, step);
      if (session.dropped.length) {
        step = { ...step, reply: joinLines(linesFor(session.language).unsaved(session.dropped.join(", ")), step.reply) };
        session.dropped = [];
      }
      session.state = step.state;
      session.updatedAt = Date.now();
      return { sessionId: session.id, ...step };
    });
  }

  private async withLock<T>(merchantId: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(merchantId) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(fn);
    this.locks.set(merchantId, run);
    try {
      return await run;
    } finally {
      if (this.locks.get(merchantId) === run) this.locks.delete(merchantId);
    }
  }

  /** Ends the current question. Entries already said stay queued. */
  private toIdle(session: Session): void {
    session.state = "IDLE";
    session.entryId = null;
    session.entryCustomer = null;
    session.phone = null;
    session.qr = null;
    session.choice = null;
  }

  private async dispatch(session: Session, text: string): Promise<Step> {
    const answer = detectYesNo(text, session.language);
    switch (session.state) {
      case "IDLE":
        return this.newEntry(session, text);
      case "AWAITING_CUSTOMER_CHOICE":
        return this.onCustomerChoice(session, answer);
      case "AWAITING_ENTRY_CONFIRM":
        return this.onEntryConfirm(session, text, answer);
      case "AWAITING_COLLECT_CHOICE":
        return this.onCollectChoice(session, text, answer);
      case "AWAITING_PHONE":
        return this.onPhone(session, text, answer);
      case "AWAITING_PHONE_CONFIRM":
        return this.onPhoneConfirm(session, text, answer);
      case "AWAITING_QR_MATCH":
        return this.onQrAnswer(session, text, answer);
    }
  }

  /** Once one thing is done: the next entry the merchant already said, else a QR payment waiting for a name. */
  private async whatNext(session: Session, done: Step): Promise<Step> {
    const heard = session.queue.shift();
    if (heard) {
      const next = await this.readBack(session, heard);
      return { ...done, ...next, reply: joinLines(done.reply, linesFor(session.language).nextEntry(), next.reply) };
    }
    const qr = await this.nextQrQuestion(session);
    return qr ? { ...done, state: qr.state, reply: joinLines(done.reply, qr.reply) } : done;
  }

  // ------------------------------------------------------------- entry flow

  private async newEntry(session: Session, text: string): Promise<Step> {
    const say = linesFor(session.language);
    const result = await this.extract(session, text);
    if (result.kind === "not_entry") return { state: "IDLE", reply: say.notAnEntry() };
    if (result.kind === "unclear") return { state: "IDLE", reply: say.amountsUnclear() };
    return this.readBack(session, { extraction: result.extraction, needsReview: result.needsReview, transcript: text });
  }

  /** Finds the customer, first asking about any the name only maybe fits, then reads the entry back. */
  private async readBack(session: Session, heard: Heard): Promise<Step> {
    const spoken = heard.extraction.customerName;
    const matches = await matchCustomers(this.deps.db, session.merchantId, spoken);
    const best = matches[0];
    if (best?.match === "maybe") {
      session.choice = { heard, candidateIds: matches.map((m) => m.customer.id), index: 0 };
      return { state: "AWAITING_CUSTOMER_CHOICE", reply: linesFor(session.language).sameCustomer(spoken, best.customer.name) };
    }
    if (best) return this.startEntry(session, heard, best.customer, false);
    return this.startEntry(session, heard, await createCustomer(this.deps.db, session.merchantId, spoken), true);
  }

  private async startEntry(session: Session, heard: Heard, customer: Customer, isNew: boolean): Promise<Step> {
    const say = linesFor(session.language);
    const entry = await createUnconfirmedEntry(this.deps.db, {
      merchantId: session.merchantId,
      customerId: customer.id,
      totalPaise: toPaise(heard.extraction.totalRupees),
      paidPaise: toPaise(heard.extraction.paidRupees),
      pendingPaise: toPaise(heard.extraction.pendingRupees),
      transcript: heard.transcript,
      language: session.language,
      needsReview: heard.needsReview,
    });
    session.entryId = entry.id;
    session.entryCustomer = entry.customer_name;
    const readback = say.entryReadback(amountsOf(entry), heard.needsReview);
    return {
      state: "AWAITING_ENTRY_CONFIRM",
      reply: isNew ? joinLines(say.newCustomer(), readback) : readback,
      entry: toEntryDto(entry),
      needsReview: heard.needsReview,
    };
  }

  private async onCustomerChoice(session: Session, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const choice = session.choice!;
    const spoken = choice.heard.extraction.customerName;
    if (answer === "yes") {
      const customer = await getCustomer(this.deps.db, session.merchantId, choice.candidateIds[choice.index]!);
      session.choice = null;
      return this.startEntry(session, choice.heard, customer, false);
    }
    if (answer === "no") {
      choice.index += 1;
      const nextId = choice.candidateIds[choice.index];
      if (nextId) {
        const next = await getCustomer(this.deps.db, session.merchantId, nextId);
        return { state: "AWAITING_CUSTOMER_CHOICE", reply: say.sameCustomer(spoken, next.name) };
      }
      session.choice = null;
      return this.startEntry(session, choice.heard, await createCustomer(this.deps.db, session.merchantId, spoken), true);
    }
    return { state: "AWAITING_CUSTOMER_CHOICE", reply: say.notUnderstoodYesNo() };
  }

  private async onEntryConfirm(session: Session, text: string, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const entry = await getEntry(this.deps.db, session.merchantId, session.entryId!);
    if (mightChange(text, answer, entry, session.language)) {
      const changed = await this.hearChange(session, text, answer, entry);
      if (changed) return changed;
    }
    if (answer === "yes") {
      const saved = await confirmEntry(this.deps.db, session.merchantId, entry.id);
      this.deps.events.publish(session.merchantId, { type: "entry.updated", entry: toEntryDto(saved) });
      if (saved.status === "CLOSED") {
        this.toIdle(session);
        return { state: "IDLE", reply: say.savedClosed(), entry: toEntryDto(saved) };
      }
      return { state: "AWAITING_COLLECT_CHOICE", reply: say.savedAskCollect(toRupees(saved.pending_paise)), entry: toEntryDto(saved) };
    }
    if (answer === "no") {
      const rejected = await rejectEntry(this.deps.db, session.merchantId, entry.id);
      this.toIdle(session);
      return { state: "IDLE", reply: say.entryRejected(), entry: toEntryDto(rejected) };
    }
    return { state: "AWAITING_ENTRY_CONFIRM", reply: say.notUnderstoodYesNo() };
  }

  /**
   * "Haan, lekin 250 diye" or "nahi, Verma ji ka tha" corrects the entry. Someone else's entry said
   * without a no waits in the queue while this one is asked again. Null when nothing changed.
   */
  private async hearChange(session: Session, text: string, answer: YesNo, entry: EntryWithCustomer): Promise<Step | null> {
    const say = linesFor(session.language);
    const current = amountsOf(entry);
    const askAgain = (first: Line): Step => ({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: joinLines(first, say.entryReadback(current, entry.needs_review)),
    });
    const heard = await this.deps.extractor.hearChange(text, await this.knownNames(session), session.language, current);
    if (heard.kind === "none") return null;
    if (heard.kind === "unclear") return askAgain(say.changeUnclear());

    const { raw } = heard;
    const fit = raw.customerName ? matchName(raw.customerName, entry.customer_name) : "exact";
    const sameCustomer = fit === "exact" || fit === "fuzzy";
    if (!sameCustomer && answer !== "no" && hasAmounts(raw)) {
      const another = finalizeExtraction(raw);
      if (another.ok) {
        session.queue.push({ extraction: another.value, needsReview: !amountsSpoken(another.value, text), transcript: text });
        return askAgain(say.pendingFirst(another.value.customerName));
      }
    }

    const corrected = toExtraction(sameCustomer ? entry.customer_name : raw.customerName, applyCorrection(raw, current), raw.items);
    if (!corrected.ok) return askAgain(say.changeUnclear());
    const transcript = `${entry.transcript ?? ""} / ${text}`;
    const needsReview = !amountsSpoken(corrected.value, transcript);
    let customerId = entry.customer_id;
    let isNew = false;
    if (!sameCustomer) {
      // Named on purpose, so a name that only maybe fits someone is a new customer.
      const [best] = await matchCustomers(this.deps.db, session.merchantId, corrected.value.customerName);
      isNew = !best || best.match === "maybe";
      customerId = isNew ? (await createCustomer(this.deps.db, session.merchantId, corrected.value.customerName)).id : best!.customer.id;
    }
    const updated = await updateUnconfirmedEntry(this.deps.db, session.merchantId, entry.id, {
      customerId,
      totalPaise: toPaise(corrected.value.totalRupees),
      paidPaise: toPaise(corrected.value.paidRupees),
      pendingPaise: toPaise(corrected.value.pendingRupees),
      needsReview,
      transcript,
    });
    session.entryCustomer = updated.customer_name;
    const readback = say.entryCorrected(amountsOf(updated), needsReview);
    return {
      state: "AWAITING_ENTRY_CONFIRM",
      reply: isNew ? joinLines(say.newCustomer(), readback) : readback,
      entry: toEntryDto(updated),
      needsReview,
    };
  }

  /** A new entry said instead of an answer: the question is dropped and the entry read back. */
  private async movedOn(session: Session, text: string, answer: YesNo): Promise<Step | null> {
    if (answer !== "unknown") return null;
    if (READS_NUMBER_WORDS.has(session.language) && !mentionsNumber(text)) return null;
    const result = await this.extract(session, text);
    if (result.kind !== "entry") return null;
    this.toIdle(session);
    return this.readBack(session, { extraction: result.extraction, needsReview: result.needsReview, transcript: text });
  }

  // ----------------------------------------------------------- collect flow

  private async onCollectChoice(session: Session, text: string, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const entry = await getEntry(this.deps.db, session.merchantId, session.entryId!);
    // A number comes first: the Bengali নয় is both "nine" and "not".
    const spokenPhone = parseIndianMobile(text);
    if (spokenPhone) {
      session.phone = spokenPhone;
      return { state: "AWAITING_PHONE_CONFIRM", reply: say.phoneReadback(spokenPhone) };
    }
    if (answer === "no") {
      this.toIdle(session);
      return { state: "IDLE", reply: say.collectDeclined(), entry: toEntryDto(entry) };
    }
    if (answer === "yes") {
      if (entry.customer_phone) return this.sendLink(session, entry.customer_phone);
      return { state: "AWAITING_PHONE", reply: say.askPhone(entry.customer_name) };
    }
    const moved = await this.movedOn(session, text, answer);
    if (moved) return { ...moved, reply: joinLines(say.collectDeclined(), moved.reply) };
    return { state: "AWAITING_COLLECT_CHOICE", reply: say.notUnderstoodYesNo() };
  }

  private async onPhone(session: Session, text: string, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const phone = parseIndianMobile(text);
    if (phone) {
      session.phone = phone;
      return { state: "AWAITING_PHONE_CONFIRM", reply: say.phoneReadback(phone) };
    }
    if (answer === "no") {
      this.toIdle(session);
      return { state: "IDLE", reply: say.collectDeclined() };
    }
    const moved = await this.movedOn(session, text, answer);
    if (moved) return { ...moved, reply: joinLines(say.collectDeclined(), moved.reply) };
    return { state: "AWAITING_PHONE", reply: say.phoneInvalid() };
  }

  private async onPhoneConfirm(session: Session, text: string, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const newPhone = parseIndianMobile(text);
    if (newPhone && newPhone !== session.phone) {
      session.phone = newPhone;
      return { state: "AWAITING_PHONE_CONFIRM", reply: say.phoneReadback(newPhone) };
    }
    if (answer === "yes") return this.sendLink(session, session.phone!);
    if (answer === "no") {
      session.phone = null;
      return { state: "AWAITING_PHONE", reply: say.phoneRetry() };
    }
    const moved = await this.movedOn(session, text, answer);
    if (moved) return { ...moved, reply: joinLines(say.collectDeclined(), moved.reply) };
    return { state: "AWAITING_PHONE_CONFIRM", reply: say.notUnderstoodYesNo() };
  }

  private async sendLink(session: Session, phone: string): Promise<Step> {
    try {
      const res = await this.deps.collect.sendLink(session.merchantId, session.entryId!, phone);
      this.toIdle(session);
      return { state: "IDLE", reply: res.line, entry: res.entry, link: res.link };
    } catch (err) {
      if (err instanceof AppError && err.code.startsWith("PAYTM_")) {
        this.deps.logger?.warn({ err }, "link creation failed");
        this.toIdle(session);
        return { state: "IDLE", reply: linesFor(session.language).linkFailed() };
      }
      throw err;
    }
  }

  // ---------------------------------------------------------------- QR flow

  private async offerSuggestion(merchantId: string, suggestion: SuggestionDto): Promise<void> {
    const session = this.getSession(merchantId);
    if (session.state !== "IDLE" || suggestion.candidates.length === 0) return;
    session.language = await this.deps.languages.get(merchantId);
    const step = this.startQrTurn(session, suggestion);
    session.state = step.state;
    session.updatedAt = Date.now();
    this.deps.events.publish(merchantId, { type: "pari.prompt", state: step.state, line: step.reply });
  }

  private async nextQrQuestion(session: Session): Promise<Step | null> {
    const suggestions = await this.deps.reconciler.getSuggestions(session.merchantId);
    const next = suggestions.find((s) => s.candidates.length > 0);
    return next ? this.startQrTurn(session, next) : null;
  }

  private startQrTurn(session: Session, suggestion: SuggestionDto): Step {
    const first = suggestion.candidates[0]!;
    session.qr = {
      paymentId: suggestion.payment.id,
      amountRupees: suggestion.payment.amountRupees,
      candidateEntryIds: suggestion.candidates.map((c) => c.entry.id),
      index: 0,
    };
    return {
      state: "AWAITING_QR_MATCH",
      reply: linesFor(session.language).qrAsk(suggestion.payment.amountRupees, first.entry.customer.name, first.entry.pendingRupees),
      entry: first.entry,
    };
  }

  /** A new entry said instead of an answer leaves the payment to be asked about again once it's done. */
  private async onQrAnswer(session: Session, text: string, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const qr = session.qr!;
    const entryId = qr.candidateEntryIds[qr.index]!;
    if (answer === "yes") {
      const res = await this.deps.reconciler.matchPayment(session.merchantId, qr.paymentId, entryId);
      this.toIdle(session);
      return { state: "IDLE", reply: res.line, ...(res.entry ? { entry: res.entry } : {}) };
    }
    if (answer === "no") {
      qr.index += 1;
      const nextId = qr.candidateEntryIds[qr.index];
      if (nextId) {
        const entry = await getEntry(this.deps.db, session.merchantId, nextId);
        return {
          state: "AWAITING_QR_MATCH",
          reply: say.qrAsk(qr.amountRupees, entry.customer_name, toRupees(entry.pending_paise)),
          entry: toEntryDto(entry),
        };
      }
      const res = await this.deps.reconciler.dismissPayment(session.merchantId, qr.paymentId, "UNMATCHED");
      this.toIdle(session);
      return { state: "IDLE", reply: res.line };
    }
    const moved = await this.movedOn(session, text, answer);
    if (moved) return moved;
    return { state: "AWAITING_QR_MATCH", reply: say.notUnderstoodYesNo() };
  }

  // ---------------------------------------------------------------- helpers

  private knownNames(session: Session): Promise<string[]> {
    return knownCustomerNames(this.deps.db, session.merchantId, KNOWN_CUSTOMERS);
  }

  private async extract(session: Session, text: string) {
    return this.deps.extractor.extract(text, await this.knownNames(session), session.language);
  }
}

/**
 * Whether an answer may carry a change rather than only a yes or no. A number that isn't in the read-back
 * always might. Other words might too, except after a yes in Hindi or English, where a changed amount
 * would show up as a number.
 */
function mightChange(text: string, answer: YesNo, entry: EntryWithCustomer, language: Language): boolean {
  const readBack = [entry.total_paise, entry.paid_paise, entry.pending_paise].map(toRupees);
  const numbers = extractNumbers(text);
  if (numbers.some((n) => !readBack.includes(n))) return true;
  if (numbers.length) return answer === "unknown";
  if (otherWords(text, language).length === 0) return false;
  return answer !== "yes" || !READS_NUMBER_WORDS.has(language);
}

function amountsSpoken(e: Extraction, transcript: string): boolean {
  return checkAmountsAgainstTranscript({ total: e.totalRupees, paid: e.paidRupees, pending: e.pendingRupees }, transcript).verified;
}

/** Customers whose entries were heard but not saved yet. */
function unsavedCustomers(session: Session): string[] {
  const current =
    session.state === "AWAITING_ENTRY_CONFIRM"
      ? session.entryCustomer
      : session.state === "AWAITING_CUSTOMER_CHOICE"
        ? session.choice!.heard.extraction.customerName
        : null;
  return [...(current ? [current] : []), ...session.queue.map((h) => h.extraction.customerName)];
}

function amountsOf(entry: EntryWithCustomer) {
  return {
    customerName: entry.customer_name,
    totalRupees: toRupees(entry.total_paise),
    paidRupees: toRupees(entry.paid_paise),
    pendingRupees: toRupees(entry.pending_paise),
  };
}
