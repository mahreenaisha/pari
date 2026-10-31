import { randomUUID } from "node:crypto";
import type { ConversationState, EntryDto, Language, Line, LinkDto, SuggestionDto } from "../contracts/index.js";
import { toEntryDto } from "../contracts/mappers.js";
import type { Customer } from "../db/types.js";
import type { EventBus } from "../events/bus.js";
import { AppError } from "../helpers/errors.js";
import type { Logger } from "../helpers/logger.js";
import { DEFAULT_LANGUAGE, type MerchantLanguages } from "../languages.js";
import {
  hearEvent,
  KNOWN_CUSTOMERS,
  type EntryExtractor,
  type ExtractionResult,
  type HeardEntry,
  type HeardEvent,
  type HeardRepayment,
  type Missing,
} from "../llm/extractor.js";
import { detectYesNo, otherWords, type YesNo } from "../llm/intent.js";
import { joinLines, linesFor, type RepaymentAmounts } from "../llm/lines/index.js";
import {
  checkAmountsAgainstTranscript,
  extractNumbers,
  mentionsNumber,
  parseIndianMobile,
  READS_NUMBER_WORDS,
} from "../llm/numbers.js";
import { applyCorrection, toExtraction, type Extraction, type RawEntry } from "../llm/schemas.js";
import type { CollectService } from "../ledger/collect.js";
import { matchName } from "../ledger/names.js";
import type { Reconciler } from "../ledger/reconciler.js";
import {
  confirmEntry,
  createCustomer,
  createUnconfirmedEntry,
  customerBalancePaise,
  getCustomer,
  getEntry,
  knownCustomerNames,
  matchCustomers,
  rejectEntry,
  settleCash,
  shopBalance,
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

/** "Gupta didi aur Gupta ji ek hi hain?", asked about each customer the name only maybe fits. */
interface CustomerChoice {
  heard: HeardEvent;
  candidateIds: string[];
  index: number;
}

/** Cash paid back, read back against what the customer owes and waiting for a yes. */
interface PaymentTurn {
  heard: HeardRepayment;
  customerId: string;
  customerName: string;
  /** What the merchant said was paid, or everything owed for "poora". */
  saidPaise: number;
  /** What goes into the khaata: what was paid, up to what is owed. */
  amountPaise: number;
  owedPaise: number;
  /** A QR payment of the same amount waiting to be matched, asked about first so the money isn't counted twice. */
  qr: { paymentId: string; entryId: string } | null;
}

/** An entry or repayment said without a name or an amount, waiting for the one Pari asked for. */
interface Asking {
  /** What the merchant said so far. */
  text: string;
  /** What Pari has asked for already, so each is asked for once. */
  asked: Missing[];
  customerName: string | null;
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
  payment: PaymentTurn | null;
  asking: Asking | null;
  /** Entries and repayments said while another was waiting for a yes, read back in turn. */
  queue: HeardEvent[];
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
        payment: null,
        asking: null,
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
      const asked =
        session?.state === "AWAITING_QR_MATCH"
          ? session.qr?.paymentId
          : session?.state === "AWAITING_PAYMENT_CONFIRM"
            ? session.payment?.qr?.paymentId
            : undefined;
      if (session && asked === paymentId) {
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
      if (step.state === "IDLE") {
        this.toIdle(session);
        step = await this.whatNext(session, step);
      }
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
    session.payment = null;
    session.asking = null;
  }

  private async dispatch(session: Session, text: string): Promise<Step> {
    const answer = detectYesNo(text, session.language);
    switch (session.state) {
      case "IDLE":
        return this.onHeard(session, await this.extract(session, text), text, []);
      case "AWAITING_NAME":
      case "AWAITING_AMOUNT":
        return this.onMissing(session, text, answer);
      case "AWAITING_CUSTOMER_CHOICE":
        return this.onCustomerChoice(session, answer);
      case "AWAITING_ENTRY_CONFIRM":
        return this.onEntryConfirm(session, text, answer);
      case "AWAITING_PAYMENT_CONFIRM":
        return this.onPaymentConfirm(session, text, answer);
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

  /**
   * Once one thing is done: the next thing the merchant already said, else a QR payment waiting for a
   * name. One answered on the spot, like a repayment from someone who owes nothing, goes on to the next.
   */
  private async whatNext(session: Session, done: Step): Promise<Step> {
    const say = linesFor(session.language);
    let step = done;
    for (let heard = session.queue.shift(); heard; heard = session.queue.shift()) {
      const next = await this.readBack(session, heard);
      step = { ...step, ...next, reply: joinLines(step.reply, say.nextEntry(), next.reply) };
      if (next.state !== "IDLE") return step;
    }
    const qr = await this.nextQrQuestion(session);
    return qr ? { ...step, state: qr.state, reply: joinLines(step.reply, qr.reply) } : step;
  }

  // ------------------------------------------------------------ what was said

  /** What the model heard: answered, asked about, or read back. `asked` is what Pari already asked for. */
  private async onHeard(session: Session, result: ExtractionResult, text: string, asked: Missing[]): Promise<Step> {
    const say = linesFor(session.language);
    switch (result.kind) {
      case "not_entry":
        return { state: "IDLE", reply: say.notAnEntry() };
      case "unclear":
        return { state: "IDLE", reply: say.amountsUnclear() };
      case "balance":
        return this.answerBalance(session, result.customerName);
      case "missing": {
        if (asked.includes(result.missing)) return { state: "IDLE", reply: say.notAnEntry() };
        session.asking = { text, asked: [...asked, result.missing], customerName: result.customerName };
        if (result.missing === "amount" && result.customerName) {
          return { state: "AWAITING_AMOUNT", reply: say.askAmount(result.customerName) };
        }
        return { state: "AWAITING_NAME", reply: say.askName() };
      }
      case "events": {
        const [first, ...rest] = result.events;
        session.queue.push(...rest);
        return this.readBack(session, first!);
      }
    }
  }

  /** The name or amount Pari asked for, heard together with what was said before it. A plain no drops both. */
  private async onMissing(session: Session, text: string, answer: YesNo): Promise<Step> {
    const asking = session.asking!;
    this.toIdle(session);
    if (answer === "no" && otherWords(text, session.language).length === 0) {
      return { state: "IDLE", reply: linesFor(session.language).entryRejected() };
    }
    const together = `${asking.text.replace(/[\s.!?।]+$/u, "")}. ${text}`;
    return this.onHeard(session, await this.extract(session, together), together, asking.asked);
  }

  /** Finds the customer, first asking about any the name only maybe fits, then reads back what was said. */
  private async readBack(session: Session, heard: HeardEvent): Promise<Step> {
    const spoken = nameOf(heard);
    const matches = await matchCustomers(this.deps.db, session.merchantId, spoken);
    const best = matches[0];
    if (best?.match === "maybe") {
      session.choice = { heard, candidateIds: matches.map((m) => m.customer.id), index: 0 };
      return { state: "AWAITING_CUSTOMER_CHOICE", reply: linesFor(session.language).sameCustomer(spoken, best.customer.name) };
    }
    return this.withCustomer(session, heard, best?.customer ?? null);
  }

  /** Once it's known whose it is. Nobody is a new customer for an entry, and no one to take money from. */
  private async withCustomer(session: Session, heard: HeardEvent, customer: Customer | null): Promise<Step> {
    if (heard.kind === "repayment") return this.readBackRepayment(session, heard, customer, false);
    if (customer) return this.startEntry(session, heard, customer, false);
    return this.startEntry(session, heard, await createCustomer(this.deps.db, session.merchantId, heard.extraction.customerName), true);
  }

  private async onCustomerChoice(session: Session, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const choice = session.choice!;
    const spoken = nameOf(choice.heard);
    if (answer === "yes") {
      const customer = await getCustomer(this.deps.db, session.merchantId, choice.candidateIds[choice.index]!);
      session.choice = null;
      return this.withCustomer(session, choice.heard, customer);
    }
    if (answer === "no") {
      choice.index += 1;
      const nextId = choice.candidateIds[choice.index];
      if (nextId) {
        const next = await getCustomer(this.deps.db, session.merchantId, nextId);
        return { state: "AWAITING_CUSTOMER_CHOICE", reply: say.sameCustomer(spoken, next.name) };
      }
      session.choice = null;
      return this.withCustomer(session, choice.heard, null);
    }
    return { state: "AWAITING_CUSTOMER_CHOICE", reply: say.notUnderstoodYesNo() };
  }

  /** Something new said instead of an answer: the question is dropped and the new thing read back. */
  private async movedOn(session: Session, text: string, answer: YesNo): Promise<Step | null> {
    if (answer !== "unknown") return null;
    if (READS_NUMBER_WORDS.has(session.language) && !mentionsNumber(text)) return null;
    const result = await this.extract(session, text);
    if (result.kind !== "events") return null;
    this.toIdle(session);
    return this.onHeard(session, result, text, []);
  }

  // ------------------------------------------------------------- entry flow

  private async startEntry(session: Session, heard: HeardEntry, customer: Customer, isNew: boolean): Promise<Step> {
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

  private async onEntryConfirm(session: Session, text: string, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const entry = await getEntry(this.deps.db, session.merchantId, session.entryId!);
    const readBack = [entry.total_paise, entry.paid_paise, entry.pending_paise].map(toRupees);
    if (mightChange(text, answer, readBack, session.language)) {
      const changed = await this.hearChange(session, text, answer, entry, readBack);
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
   * "Haan, lekin 250 diye" or "nahi, Verma ji ka tha" corrects the entry. Someone else's entry or
   * repayment said without a no waits in the queue while this one is asked again. A new number the model
   * couldn't place is asked about again, never saved or dropped on the yes or no. Null when nothing changed.
   */
  private async hearChange(
    session: Session,
    text: string,
    answer: YesNo,
    entry: EntryWithCustomer,
    readBack: number[],
  ): Promise<Step | null> {
    const say = linesFor(session.language);
    const current = amountsOf(entry);
    const askAgain = (first: Line): Step => ({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: joinLines(first, say.entryReadback(current, entry.needs_review)),
    });
    const heard = await this.deps.extractor.hearChange(text, await this.knownNames(session), session.language, {
      kind: "entry",
      entry: current,
    });
    if (heard.kind === "none") return saysNewNumber(text, readBack) ? askAgain(say.changeUnclear()) : null;
    if (heard.kind === "unclear") return askAgain(say.changeUnclear());

    const { event } = heard;
    const fit = event.customerName ? matchName(event.customerName, entry.customer_name) : "exact";
    const sameCustomer = fit === "exact" || fit === "fuzzy";
    if (!sameCustomer && answer !== "no") {
      const another = hearEvent(event, text);
      if (another.kind === "heard") {
        session.queue.push(another.event);
        return askAgain(say.pendingFirst(nameOf(another.event)));
      }
    }

    // Money said in answer to an entry was paid on it, whichever way the model filed it: "nahi, 250 diye".
    const said: RawEntry =
      event.type === "entry"
        ? event
        : {
            type: "entry",
            customerName: event.customerName,
            totalRupees: null,
            paidRupees: event.amountRupees ?? (event.full ? current.totalRupees : null),
            pendingRupees: null,
          };
    const corrected = toExtraction(sameCustomer ? entry.customer_name : said.customerName, applyCorrection(said, current), said.items);
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

  // --------------------------------------------------------- repayment flow

  /**
   * Cash paid back, read against what the customer owes: more than that goes in as what was owed, with
   * the rest to hand back. A QR payment of the same amount still waiting for a name is asked about first.
   */
  private async readBackRepayment(
    session: Session,
    heard: HeardRepayment,
    customer: Customer | null,
    corrected: boolean,
  ): Promise<Step> {
    const say = linesFor(session.language);
    session.payment = null;
    if (!customer) return { state: "IDLE", reply: say.noSuchCustomer(heard.customerName) };
    const owedPaise = await customerBalancePaise(this.deps.db, session.merchantId, customer.id);
    if (owedPaise === 0) return { state: "IDLE", reply: say.nothingOwed(customer.name) };
    const saidPaise = heard.amountRupees === null ? owedPaise : toPaise(heard.amountRupees);
    const payment: PaymentTurn = {
      heard,
      customerId: customer.id,
      customerName: customer.name,
      saidPaise,
      amountPaise: Math.min(saidPaise, owedPaise),
      owedPaise,
      qr: await this.waitingQr(session.merchantId, customer.id, saidPaise),
    };
    session.payment = payment;
    if (payment.qr) return { state: "AWAITING_PAYMENT_CONFIRM", reply: say.qrSameMoney(customer.name, toRupees(saidPaise)) };
    const amounts = repaymentAmounts(payment);
    return {
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: corrected ? say.repaymentCorrected(amounts, heard.needsReview) : say.repaymentReadback(amounts, heard.needsReview),
      needsReview: heard.needsReview,
    };
  }

  /** A QR payment of this amount, waiting to be matched, that could be this customer's. */
  private async waitingQr(merchantId: string, customerId: string, amountPaise: number): Promise<PaymentTurn["qr"]> {
    const suggestions = await this.deps.reconciler.getSuggestions(merchantId);
    for (const { payment, candidates } of suggestions) {
      if (payment.source !== "QR" || toPaise(payment.amountRupees) !== amountPaise) continue;
      const theirs = candidates.find((c) => c.entry.customer.id === customerId);
      if (theirs) return { paymentId: payment.id, entryId: theirs.entry.id };
    }
    return null;
  }

  private async onPaymentConfirm(session: Session, text: string, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const payment = session.payment!;
    if (payment.qr) return this.onSameMoney(session, payment, answer);
    const a = repaymentAmounts(payment);
    const readBack = [toRupees(payment.saidPaise), a.amountRupees, a.owedRupees, a.leftRupees, a.changeRupees];
    if (mightChange(text, answer, readBack, session.language)) {
      const changed = await this.hearPaymentChange(session, text, answer, payment, readBack);
      if (changed) return changed;
    }
    if (answer === "yes") return this.saveRepayment(session, payment);
    if (answer === "no") {
      this.toIdle(session);
      return { state: "IDLE", reply: say.entryRejected() };
    }
    return { state: "AWAITING_PAYMENT_CONFIRM", reply: say.notUnderstoodYesNo() };
  }

  /** "Kya yeh Gupta ji wale hi hain?" A yes puts the QR payment in their khaata, and the cash isn't recorded. */
  private async onSameMoney(session: Session, payment: PaymentTurn, answer: YesNo): Promise<Step> {
    const say = linesFor(session.language);
    const qr = payment.qr!;
    if (answer === "yes") {
      const res = await this.deps.reconciler.matchPayment(session.merchantId, qr.paymentId, qr.entryId);
      this.toIdle(session);
      return { state: "IDLE", reply: res.line, ...(res.entry ? { entry: res.entry } : {}) };
    }
    if (answer === "no") {
      payment.qr = null;
      return {
        state: "AWAITING_PAYMENT_CONFIRM",
        reply: say.repaymentReadback(repaymentAmounts(payment), payment.heard.needsReview),
        needsReview: payment.heard.needsReview,
      };
    }
    return { state: "AWAITING_PAYMENT_CONFIRM", reply: say.notUnderstoodYesNo() };
  }

  /**
   * "Nahi, 150 diye" or "nahi, Verma ji ne diye" corrects the repayment, and goods taken said with a no
   * replace it. Anything else said for someone waits in the queue. A new number the model couldn't place is
   * asked about again. Null when nothing changed.
   */
  private async hearPaymentChange(
    session: Session,
    text: string,
    answer: YesNo,
    payment: PaymentTurn,
    readBack: number[],
  ): Promise<Step | null> {
    const say = linesFor(session.language);
    const askAgain = (first: Line): Step => ({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: joinLines(first, say.repaymentReadback(repaymentAmounts(payment), payment.heard.needsReview)),
    });
    const heard = await this.deps.extractor.hearChange(text, await this.knownNames(session), session.language, {
      kind: "repayment",
      customerName: payment.customerName,
      amountRupees: toRupees(payment.saidPaise),
    });
    if (heard.kind === "none") return saysNewNumber(text, readBack) ? askAgain(say.changeUnclear()) : null;
    if (heard.kind === "unclear") return askAgain(say.changeUnclear());

    const { event } = heard;
    const fit = event.customerName ? matchName(event.customerName, payment.customerName) : "exact";
    const sameCustomer = fit === "exact" || fit === "fuzzy";
    if (event.type === "entry") {
      const goods = hearEvent({ ...event, customerName: event.customerName ?? payment.customerName }, text);
      if (goods.kind !== "heard") return askAgain(say.changeUnclear());
      if (answer === "no") {
        this.toIdle(session);
        return this.readBack(session, goods.event);
      }
      session.queue.push(goods.event);
      return askAgain(say.pendingFirst(nameOf(goods.event)));
    }
    if (!sameCustomer && answer !== "no") {
      const another = hearEvent(event, text);
      if (another.kind === "heard") {
        session.queue.push(another.event);
        return askAgain(say.pendingFirst(nameOf(another.event)));
      }
    }

    const amountRupees = event.amountRupees ?? (event.full ? null : payment.heard.amountRupees);
    const redo = hearEvent(
      {
        type: "repayment",
        customerName: sameCustomer ? payment.customerName : event.customerName,
        amountRupees,
        full: amountRupees === null,
      },
      `${payment.heard.transcript} / ${text}`,
    );
    if (redo.kind !== "heard" || redo.event.kind !== "repayment") return askAgain(say.changeUnclear());
    if (sameCustomer) {
      const customer = await getCustomer(this.deps.db, session.merchantId, payment.customerId);
      return this.readBackRepayment(session, redo.event, customer, true);
    }
    const [best] = await matchCustomers(this.deps.db, session.merchantId, redo.event.customerName);
    if (best?.match === "maybe") {
      this.toIdle(session);
      return this.readBack(session, redo.event);
    }
    return this.readBackRepayment(session, redo.event, best?.customer ?? null, true);
  }

  private async saveRepayment(session: Session, payment: PaymentTurn): Promise<Step> {
    const say = linesFor(session.language);
    const settled = await settleCash(this.deps.db, session.merchantId, payment.customerId, payment.amountPaise, payment.heard.transcript);
    for (const entry of settled.entries) {
      this.deps.events.publish(session.merchantId, { type: "entry.updated", entry: toEntryDto(entry) });
    }
    this.toIdle(session);
    const saved = say.repaymentSaved(
      payment.customerName,
      toRupees(settled.balancePaise),
      toRupees(payment.saidPaise - settled.appliedPaise),
    );
    const last = settled.entries.at(-1);
    return {
      state: "IDLE",
      reply: settled.expiredLinks > 0 ? joinLines(saved, say.linkStillOut(payment.customerName)) : saved,
      ...(last ? { entry: toEntryDto(last) } : {}),
    };
  }

  // ----------------------------------------------------------------- balance

  /** "Gupta ji ka kitna baaki hai?", or with no name, what the whole shop is owed. */
  private async answerBalance(session: Session, customerName: string | null): Promise<Step> {
    const say = linesFor(session.language);
    if (!customerName) {
      const shop = await shopBalance(this.deps.db, session.merchantId);
      return {
        state: "IDLE",
        reply: shop.customers > 0 ? say.shopOwed(toRupees(shop.pendingPaise), shop.customers) : say.nobodyOwes(),
      };
    }
    // Nothing changes, so the closest name is answered for, and the answer says whose it is.
    const [best] = await matchCustomers(this.deps.db, session.merchantId, customerName);
    if (!best) return { state: "IDLE", reply: say.noSuchCustomer(customerName) };
    const owed = await customerBalancePaise(this.deps.db, session.merchantId, best.customer.id);
    return {
      state: "IDLE",
      reply: owed > 0 ? say.customerOwes(best.customer.name, toRupees(owed)) : say.nothingOwed(best.customer.name),
    };
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
function mightChange(text: string, answer: YesNo, readBack: number[], language: Language): boolean {
  if (saysNewNumber(text, readBack)) return true;
  if (extractNumbers(text).length) return answer === "unknown";
  if (otherWords(text, language).length === 0) return false;
  return answer !== "yes" || !READS_NUMBER_WORDS.has(language);
}

function saysNewNumber(text: string, readBack: number[]): boolean {
  return extractNumbers(text).some((n) => !readBack.includes(n));
}

function amountsSpoken(e: Extraction, transcript: string): boolean {
  return checkAmountsAgainstTranscript({ total: e.totalRupees, paid: e.paidRupees, pending: e.pendingRupees }, transcript).verified;
}

function nameOf(heard: HeardEvent): string {
  return heard.kind === "entry" ? heard.extraction.customerName : heard.customerName;
}

/** Customers whose entries or repayments were heard but not saved yet. */
function unsavedCustomers(session: Session): string[] {
  const current =
    session.state === "AWAITING_ENTRY_CONFIRM"
      ? session.entryCustomer
      : session.state === "AWAITING_CUSTOMER_CHOICE"
        ? nameOf(session.choice!.heard)
        : session.state === "AWAITING_PAYMENT_CONFIRM"
          ? session.payment!.customerName
          : (session.asking?.customerName ?? null);
  return [...(current ? [current] : []), ...session.queue.map(nameOf)];
}

function amountsOf(entry: EntryWithCustomer) {
  return {
    customerName: entry.customer_name,
    totalRupees: toRupees(entry.total_paise),
    paidRupees: toRupees(entry.paid_paise),
    pendingRupees: toRupees(entry.pending_paise),
  };
}

function repaymentAmounts(p: PaymentTurn): RepaymentAmounts {
  return {
    customerName: p.customerName,
    amountRupees: toRupees(p.amountPaise),
    owedRupees: toRupees(p.owedPaise),
    leftRupees: toRupees(p.owedPaise - p.amountPaise),
    changeRupees: toRupees(p.saidPaise - p.amountPaise),
  };
}
