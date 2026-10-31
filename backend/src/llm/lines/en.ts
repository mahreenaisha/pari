/** English: the same words on screen and for speech, with ₹ spoken as "rupees". */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const en: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "Please listen carefully. " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} on credit. Shall I save it?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} rupees on credit. Shall I save it?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, goods worth ₹${r(e.totalRupees)}, all ₹${r(e.paidRupees)} received. Shall I save it?`,
        speech: `${care}${e.customerName}, goods worth ${r(e.totalRupees)} rupees, all ${r(e.paidRupees)} received. Shall I save it?`,
      };
    }
    return {
      text: `${care}${e.customerName}, total ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} received, ₹${r(e.pendingRupees)} pending. Shall I save it?`,
      speech: `${care}${e.customerName}, total ${r(e.totalRupees)} rupees, ${r(e.paidRupees)} received, ${r(e.pendingRupees)} pending. Shall I save it?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `Saved. Shall I send a payment link for ₹${r(pendingRupees)}?`,
    speech: `Saved. Shall I send a payment link for ${r(pendingRupees)} rupees?`,
  }),

  savedClosed: () => ({
    text: "Saved. Paid in full, account closed.",
    speech: "Saved. Paid in full, account closed.",
  }),

  entryRejected: () => ({
    text: "Okay, entry cancelled. Please say it again.",
    speech: "Okay, entry cancelled. Please say it again.",
  }),

  entryCorrected: (e, needsReview) => {
    const base = en.entryReadback(e, needsReview);
    return { text: `Corrected. ${base.text}`, speech: `Corrected. ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `What is ${customerName}'s mobile number?`,
    speech: `What is ${customerName}'s mobile number?`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}. Is that right?`,
    speech: `${phoneForSpeech(phone)}. Is that right?`,
  }),

  phoneInvalid: () => ({
    text: "That number doesn't look right. Please say a 10-digit mobile number.",
    speech: "That number doesn't look right. Please say a ten-digit mobile number.",
  }),

  phoneRetry: () => ({
    text: "Okay, please say the number again.",
    speech: "Okay, please say the number again.",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `Link sent. ${customerName} got the ₹${r(amountRupees)} link by SMS.`,
    speech: `Link sent. ${customerName} got the ${r(amountRupees)} rupee link by SMS.`,
  }),

  collectDeclined: () => ({
    text: "Okay, no link sent. The entry stays open.",
    speech: "Okay, no link sent. The entry stays open.",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} paid ₹${r(amountRupees)}. Account closed.`,
          speech: `${customerName} paid ${r(amountRupees)} rupees. Account closed.`,
        }
      : {
          text: `${customerName} paid ₹${r(amountRupees)}. ₹${r(pendingRupees)} still pending.`,
          speech: `${customerName} paid ${r(amountRupees)} rupees. ${r(pendingRupees)} still pending.`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} came in. Is it ${customerName}'s?${over ? ` (Only ₹${r(pendingRupees)} was pending.)` : ""}`,
      speech: `${r(amountRupees)} rupees came in. Is it ${customerName}'s?${over ? ` Only ${r(pendingRupees)} was pending.` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `A ₹${r(amountRupees)} QR payment came in. It doesn't match any open entry.`,
    speech: `A ${r(amountRupees)} rupee QR payment came in. It doesn't match any open entry.`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `Okay, added to ${customerName}'s account. Account closed.`,
          speech: `Okay, added to ${customerName}'s account. Account closed.`,
        }
      : {
          text: `Okay, added to ${customerName}'s account. ₹${r(pendingRupees)} still pending.`,
          speech: `Okay, added to ${customerName}'s account. ${r(pendingRupees)} rupees still pending.`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `A ₹${r(amountRupees)} payment came in, but its entry is already closed. I've kept it aside.`,
    speech: `A ${r(amountRupees)} rupee payment came in, but its entry is already closed. I've kept it aside.`,
  }),

  linkFailed: () => ({
    text: "Couldn't create the link on Paytm. Please try again in a little while.",
    speech: "Couldn't create the link on Paytm. Please try again in a little while.",
  }),

  qrLeftUnmatched: () => ({
    text: "Okay, I've kept this payment aside.",
    speech: "Okay, I've kept this payment aside.",
  }),

  notUnderstoodYesNo: () => ({
    text: "Sorry, I didn't get that. Please say yes or no.",
    speech: "Sorry, I didn't get that. Please say yes or no.",
  }),

  notAnEntry: () => ({
    text: "Sorry, I didn't get that. Say it like this: Gupta ji bought goods for 350, paid 200, 150 pending.",
    speech: "Sorry, I didn't get that. Say it like this: Gupta ji bought goods for 350, paid 200, 150 pending.",
  }),

  amountsUnclear: () => ({
    text: "I couldn't hear the amounts clearly. Please say it once more.",
    speech: "I couldn't hear the amounts clearly. Please say it once more.",
  }),

  newCustomer: () => ({ text: "New customer.", speech: "New customer." }),

  sameCustomer: (spokenName, knownName) => ({
    text: `Are ${spokenName} and ${knownName} the same person?`,
    speech: `Are ${spokenName} and ${knownName} the same person?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName}'s entry comes next. First this one:`,
    speech: `${nextCustomerName}'s entry comes next. First this one:`,
  }),

  nextEntry: () => ({ text: "Next entry.", speech: "Next entry." }),

  unsaved: (customerNames) => ({
    text: `The entry for ${customerNames} was not saved.`,
    speech: `The entry for ${customerNames} was not saved.`,
  }),

  changeUnclear: () => ({ text: "I didn't get what to change.", speech: "I didn't get what to change." }),
};
