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
}
