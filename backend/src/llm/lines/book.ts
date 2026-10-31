/**
 * Everything Pari says in one language, built deterministically (never by the
 * LLM) so amounts read back are exactly the amounts that will be saved.
 * Amounts, names and phone numbers are filled in by code and never translated.
 * `text` is for screens; `speech` is what Bulbul reads.
 */
import { formatRupees } from "../numbers.js";

export { phoneForDisplay, phoneForSpeech } from "../numbers.js";

export const r = formatRupees;

export interface Said {
  text: string;
  speech: string;
}

export interface EntryAmounts {
  customerName: string;
  totalRupees: number;
  paidRupees: number;
  pendingRupees: number;
}

/** Money a customer paid back, as it will be recorded. */
export interface RepaymentAmounts {
  customerName: string;
  /** What goes into the khaata: what was paid, or what was owed if they paid more. */
  amountRupees: number;
  /** What they owed before paying. */
  owedRupees: number;
  /** What they still owe after it. */
  leftRupees: number;
  /** Paid beyond what was owed, to hand back. */
  changeRupees: number;
}

export interface LineBook {
  entryReadback(e: EntryAmounts, needsReview: boolean): Said;
  savedAskCollect(pendingRupees: number): Said;
  savedClosed(): Said;
  entryRejected(): Said;
  entryCorrected(e: EntryAmounts, needsReview: boolean): Said;
  askPhone(customerName: string): Said;
  phoneReadback(phone: string): Said;
  phoneInvalid(): Said;
  phoneRetry(): Said;
  linkSent(customerName: string, amountRupees: number): Said;
  collectDeclined(): Said;
  linkPaid(customerName: string, amountRupees: number, pendingRupees: number): Said;
  qrAsk(amountRupees: number, customerName: string, pendingRupees: number): Said;
  qrNoCandidate(amountRupees: number): Said;
  qrMatched(customerName: string, pendingRupees: number): Said;
  paymentUnmatched(amountRupees: number): Said;
  linkFailed(): Said;
  qrLeftUnmatched(): Said;
  notUnderstoodYesNo(): Said;
  notAnEntry(): Said;
  amountsUnclear(): Said;
  /** Before the read-back of an entry for someone not in the khaata yet. */
  newCustomer(): Said;
  /** The spoken name fits a customer, but only one of the two honorifics says man or woman. */
  sameCustomer(spokenName: string, knownName: string): Said;
  /** Someone else's entry was said while this one waits; comes before its read-back again. */
  pendingFirst(nextCustomerName: string): Said;
  /** Before the read-back of an entry said earlier. */
  nextEntry(): Said;
  /** The session ran out before these customers' entries got a yes. */
  unsaved(customerNames: string): Said;
  /** The answer sounded like a change that couldn't be read; comes before the read-back again. */
  changeUnclear(): Said;
  /** An entry or repayment was said without saying whose. */
  askName(): Said;
  /** A customer's entry or repayment was said without an amount. */
  askAmount(customerName: string): Said;
  /** Money paid back, before it's saved: what will be left, or that the khaata closes and what to hand back. */
  repaymentReadback(p: RepaymentAmounts, needsReview: boolean): Said;
  repaymentCorrected(p: RepaymentAmounts, needsReview: boolean): Said;
  repaymentSaved(customerName: string, leftRupees: number, changeRupees: number): Said;
  /** The cash paid off an entry whose payment link is still out, and a sent link can't be called back. */
  linkStillOut(customerName: string): Said;
  /** Before cash is recorded: the same amount came in on the QR and isn't in any khaata yet. */
  qrSameMoney(customerName: string, amountRupees: number): Said;
  noSuchCustomer(customerName: string): Said;
  nothingOwed(customerName: string): Said;
  customerOwes(customerName: string, pendingRupees: number): Said;
  shopOwed(pendingRupees: number, customers: number): Said;
  nobodyOwes(): Said;
}
