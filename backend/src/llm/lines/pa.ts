/** Punjabi: Gurmukhi on screen and for speech, with ₹ spoken as ਰੁਪਏ. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const pa: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "ਇੱਕ ਵਾਰ ਧਿਆਨ ਨਾਲ ਸੁਣੋ। " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} ਉਧਾਰ। save ਕਰਾਂ?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} ਰੁਪਏ ਉਧਾਰ। save ਕਰਾਂ?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)} ਦਾ ਸਮਾਨ, ਪੂਰੇ ₹${r(e.paidRupees)} ਮਿਲ ਗਏ। save ਕਰਾਂ?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} ਰੁਪਏ ਦਾ ਸਮਾਨ, ਪੂਰੇ ${r(e.paidRupees)} ਰੁਪਏ ਮਿਲ ਗਏ। save ਕਰਾਂ?`,
      };
    }
    return {
      text: `${care}${e.customerName}, ਕੁੱਲ ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} ਮਿਲੇ, ₹${r(e.pendingRupees)} ਬਾਕੀ। save ਕਰਾਂ?`,
      speech: `${care}${e.customerName}, ਕੁੱਲ ${r(e.totalRupees)} ਰੁਪਏ, ${r(e.paidRupees)} ਮਿਲੇ, ${r(e.pendingRupees)} ਬਾਕੀ। save ਕਰਾਂ?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save ਹੋ ਗਿਆ। ₹${r(pendingRupees)} ਦਾ payment link ਭੇਜਾਂ?`,
    speech: `save ਹੋ ਗਿਆ। ${r(pendingRupees)} ਰੁਪਏ ਦਾ payment link ਭੇਜਾਂ?`,
  }),

  savedClosed: () => ({
    text: "save ਹੋ ਗਿਆ। ਪੂਰਾ payment ਮਿਲ ਗਿਆ, ਖਾਤਾ ਬੰਦ।",
    speech: "save ਹੋ ਗਿਆ। ਪੂਰਾ payment ਮਿਲ ਗਿਆ, ਖਾਤਾ ਬੰਦ।",
  }),

  entryRejected: () => ({
    text: "ਠੀਕ ਹੈ, entry cancel। ਦੁਬਾਰਾ ਬੋਲੋ।",
    speech: "ਠੀਕ ਹੈ, entry cancel। ਦੁਬਾਰਾ ਬੋਲੋ।",
  }),

  entryCorrected: (e, needsReview) => {
    const base = pa.entryReadback(e, needsReview);
    return { text: `ਠੀਕ ਕਰ ਦਿੱਤਾ। ${base.text}`, speech: `ਠੀਕ ਕਰ ਦਿੱਤਾ। ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName} ਦਾ mobile ਨੰਬਰ ਦੱਸੋ।`,
    speech: `${customerName} ਦਾ mobile ਨੰਬਰ ਦੱਸੋ।`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}। ਸਹੀ ਹੈ?`,
    speech: `${phoneForSpeech(phone)}। ਸਹੀ ਹੈ?`,
  }),

  phoneInvalid: () => ({
    text: "ਇਹ ਨੰਬਰ ਸਹੀ ਨਹੀਂ ਲੱਗਿਆ। 10 ਅੰਕਾਂ ਦਾ mobile ਨੰਬਰ ਬੋਲੋ।",
    speech: "ਇਹ ਨੰਬਰ ਸਹੀ ਨਹੀਂ ਲੱਗਿਆ। ਦਸ ਅੰਕਾਂ ਦਾ mobile ਨੰਬਰ ਬੋਲੋ।",
  }),

  phoneRetry: () => ({
    text: "ਠੀਕ ਹੈ, ਨੰਬਰ ਦੁਬਾਰਾ ਬੋਲੋ।",
    speech: "ਠੀਕ ਹੈ, ਨੰਬਰ ਦੁਬਾਰਾ ਬੋਲੋ।",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link ਭੇਜ ਦਿੱਤਾ। ${customerName} ਨੂੰ ₹${r(amountRupees)} ਦਾ link SMS ਹੋ ਗਿਆ।`,
    speech: `link ਭੇਜ ਦਿੱਤਾ। ${customerName} ਨੂੰ ${r(amountRupees)} ਰੁਪਏ ਦਾ link SMS ਹੋ ਗਿਆ।`,
  }),

  collectDeclined: () => ({
    text: "ਠੀਕ ਹੈ, link ਨਹੀਂ ਭੇਜਿਆ। entry ਖੁੱਲ੍ਹੀ ਹੈ।",
    speech: "ਠੀਕ ਹੈ, link ਨਹੀਂ ਭੇਜਿਆ। entry ਖੁੱਲ੍ਹੀ ਹੈ।",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} ਨੇ ₹${r(amountRupees)} ਦੇ ਦਿੱਤੇ। ਖਾਤਾ ਬੰਦ।`,
          speech: `${customerName} ਨੇ ${r(amountRupees)} ਰੁਪਏ ਦੇ ਦਿੱਤੇ। ਖਾਤਾ ਬੰਦ।`,
        }
      : {
          text: `${customerName} ਨੇ ₹${r(amountRupees)} ਦਿੱਤੇ। ਹੁਣ ₹${r(pendingRupees)} ਬਾਕੀ।`,
          speech: `${customerName} ਨੇ ${r(amountRupees)} ਰੁਪਏ ਦਿੱਤੇ। ਹੁਣ ${r(pendingRupees)} ਰੁਪਏ ਬਾਕੀ।`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} ਆਏ, ${customerName} ਦੇ?${over ? ` (ਬਾਕੀ ਸਿਰਫ਼ ₹${r(pendingRupees)} ਸੀ।)` : ""}`,
      speech: `${r(amountRupees)} ਰੁਪਏ ਆਏ, ${customerName} ਦੇ?${over ? ` ਬਾਕੀ ਸਿਰਫ਼ ${r(pendingRupees)} ਰੁਪਏ ਸੀ।` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)} ਦਾ QR payment ਆਇਆ। ਕਿਸੇ ਖੁੱਲ੍ਹੀ entry ਨਾਲ ਮੇਲ ਨਹੀਂ ਖਾਧਾ।`,
    speech: `${r(amountRupees)} ਰੁਪਏ ਦਾ QR payment ਆਇਆ। ਕਿਸੇ ਖੁੱਲ੍ਹੀ entry ਨਾਲ ਮੇਲ ਨਹੀਂ ਖਾਧਾ।`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `ਠੀਕ ਹੈ, ${customerName} ਦੇ ਖਾਤੇ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ। ਖਾਤਾ ਬੰਦ।`,
          speech: `ਠੀਕ ਹੈ, ${customerName} ਦੇ ਖਾਤੇ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ। ਖਾਤਾ ਬੰਦ।`,
        }
      : {
          text: `ਠੀਕ ਹੈ, ${customerName} ਦੇ ਖਾਤੇ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ। ਹੁਣ ₹${r(pendingRupees)} ਬਾਕੀ।`,
          speech: `ਠੀਕ ਹੈ, ${customerName} ਦੇ ਖਾਤੇ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ। ਹੁਣ ${r(pendingRupees)} ਰੁਪਏ ਬਾਕੀ।`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)} ਦਾ payment ਆਇਆ, ਪਰ ਉਸ ਦੀ entry ਪਹਿਲਾਂ ਹੀ ਬੰਦ ਹੈ। ਵੱਖਰਾ ਰੱਖ ਦਿੱਤਾ।`,
    speech: `${r(amountRupees)} ਰੁਪਏ ਦਾ payment ਆਇਆ, ਪਰ ਉਸ ਦੀ entry ਪਹਿਲਾਂ ਹੀ ਬੰਦ ਹੈ। ਵੱਖਰਾ ਰੱਖ ਦਿੱਤਾ।`,
  }),

  linkFailed: () => ({
    text: "Paytm ਤੋਂ link ਨਹੀਂ ਬਣ ਸਕਿਆ। ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    speech: "Paytm ਤੋਂ link ਨਹੀਂ ਬਣ ਸਕਿਆ। ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  }),

  qrLeftUnmatched: () => ({
    text: "ਠੀਕ ਹੈ, ਇਹ payment ਵੱਖਰਾ ਰੱਖ ਦਿੱਤਾ।",
    speech: "ਠੀਕ ਹੈ, ਇਹ payment ਵੱਖਰਾ ਰੱਖ ਦਿੱਤਾ।",
  }),

  notUnderstoodYesNo: () => ({
    text: "ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ। ਹਾਂ ਜਾਂ ਨਹੀਂ ਬੋਲੋ।",
    speech: "ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ। ਹਾਂ ਜਾਂ ਨਹੀਂ ਬੋਲੋ।",
  }),

  notAnEntry: () => ({
    text: "ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ। ਇੰਝ ਬੋਲੋ: ਗਿੱਲ ਸਾਹਿਬ ਨੇ 350 ਦਾ ਸਮਾਨ ਲਿਆ, 200 ਦਿੱਤੇ, 150 ਬਾਕੀ।",
    speech: "ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ। ਇੰਝ ਬੋਲੋ: ਗਿੱਲ ਸਾਹਿਬ ਨੇ 350 ਦਾ ਸਮਾਨ ਲਿਆ, 200 ਦਿੱਤੇ, 150 ਬਾਕੀ।",
  }),

  amountsUnclear: () => ({
    text: "ਰਕਮ ਸਾਫ਼ ਸੁਣਾਈ ਨਹੀਂ ਦਿੱਤੀ। ਇੱਕ ਵਾਰ ਫਿਰ ਬੋਲੋ।",
    speech: "ਰਕਮ ਸਾਫ਼ ਸੁਣਾਈ ਨਹੀਂ ਦਿੱਤੀ। ਇੱਕ ਵਾਰ ਫਿਰ ਬੋਲੋ।",
  }),

  newCustomer: () => ({ text: "ਨਵਾਂ ਖਾਤਾ।", speech: "ਨਵਾਂ ਖਾਤਾ।" }),

  sameCustomer: (spokenName, knownName) => ({
    text: `${spokenName} ਅਤੇ ${knownName} ਇੱਕੋ ਹੀ ਹਨ?`,
    speech: `${spokenName} ਅਤੇ ${knownName} ਇੱਕੋ ਹੀ ਹਨ?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName} ਦੀ entry ਇਸ ਤੋਂ ਬਾਅਦ। ਪਹਿਲਾਂ ਇਹ:`,
    speech: `${nextCustomerName} ਦੀ entry ਇਸ ਤੋਂ ਬਾਅਦ। ਪਹਿਲਾਂ ਇਹ:`,
  }),

  nextEntry: () => ({ text: "ਹੁਣ ਅਗਲੀ entry।", speech: "ਹੁਣ ਅਗਲੀ entry।" }),

  unsaved: (customerNames) => ({
    text: `${customerNames} ਦੀ entry save ਨਹੀਂ ਹੋਈ ਸੀ।`,
    speech: `${customerNames} ਦੀ entry save ਨਹੀਂ ਹੋਈ ਸੀ।`,
  }),

  changeUnclear: () => ({ text: "ਕੀ ਬਦਲਣਾ ਹੈ, ਸਮਝ ਨਹੀਂ ਆਇਆ।", speech: "ਕੀ ਬਦਲਣਾ ਹੈ, ਸਮਝ ਨਹੀਂ ਆਇਆ।" }),

  askName: () => ({ text: "ਕਿਸ ਦੇ ਨਾਂ ਲਿਖਾਂ?", speech: "ਕਿਸ ਦੇ ਨਾਂ ਲਿਖਾਂ?" }),

  askAmount: (customerName) => ({ text: `${customerName}, ਕਿੰਨੇ ਰੁਪਏ?`, speech: `${customerName}, ਕਿੰਨੇ ਰੁਪਏ?` }),

  repaymentReadback: (p, needsReview) => {
    const care = needsReview ? "ਇੱਕ ਵਾਰ ਧਿਆਨ ਨਾਲ ਸੁਣੋ। " : "";
    if (p.changeRupees > 0) {
      const paid = p.amountRupees + p.changeRupees;
      return {
        text: `${care}${p.customerName} ਨੇ ₹${r(paid)} ਦਿੱਤੇ, ਪਰ ਉਧਾਰ ਸਿਰਫ਼ ₹${r(p.owedRupees)} ਸੀ। ਖਾਤਾ ਬੰਦ ਹੋ ਜਾਵੇਗਾ, ₹${r(p.changeRupees)} ਵਾਪਸ ਦੇਣੇ ਹਨ। save ਕਰਾਂ?`,
        speech: `${care}${p.customerName} ਨੇ ${r(paid)} ਰੁਪਏ ਦਿੱਤੇ, ਪਰ ਉਧਾਰ ਸਿਰਫ਼ ${r(p.owedRupees)} ਰੁਪਏ ਸੀ। ਖਾਤਾ ਬੰਦ ਹੋ ਜਾਵੇਗਾ, ${r(p.changeRupees)} ਰੁਪਏ ਵਾਪਸ ਦੇਣੇ ਹਨ। save ਕਰਾਂ?`,
      };
    }
    if (p.leftRupees === 0) {
      return {
        text: `${care}${p.customerName} ਤੋਂ ਪੂਰੇ ₹${r(p.amountRupees)} ਮਿਲੇ। ਖਾਤਾ ਬੰਦ ਹੋ ਜਾਵੇਗਾ। save ਕਰਾਂ?`,
        speech: `${care}${p.customerName} ਤੋਂ ਪੂਰੇ ${r(p.amountRupees)} ਰੁਪਏ ਮਿਲੇ। ਖਾਤਾ ਬੰਦ ਹੋ ਜਾਵੇਗਾ। save ਕਰਾਂ?`,
      };
    }
    return {
      text: `${care}${p.customerName} ਤੋਂ ₹${r(p.amountRupees)} ਮਿਲੇ। ₹${r(p.owedRupees)} ਬਾਕੀ ਸੀ, ਹੁਣ ₹${r(p.leftRupees)} ਬਚੇਗਾ। save ਕਰਾਂ?`,
      speech: `${care}${p.customerName} ਤੋਂ ${r(p.amountRupees)} ਰੁਪਏ ਮਿਲੇ। ${r(p.owedRupees)} ਰੁਪਏ ਬਾਕੀ ਸੀ, ਹੁਣ ${r(p.leftRupees)} ਰੁਪਏ ਬਚੇਗਾ। save ਕਰਾਂ?`,
    };
  },

  repaymentCorrected: (p, needsReview) => {
    const base = pa.repaymentReadback(p, needsReview);
    return { text: `ਠੀਕ ਕਰ ਦਿੱਤਾ। ${base.text}`, speech: `ਠੀਕ ਕਰ ਦਿੱਤਾ। ${base.speech}` };
  },

  repaymentSaved: (customerName, leftRupees, changeRupees) => {
    if (leftRupees > 0) {
      return {
        text: `save ਹੋ ਗਿਆ। ${customerName} ਦਾ ਹੁਣ ₹${r(leftRupees)} ਬਾਕੀ।`,
        speech: `save ਹੋ ਗਿਆ। ${customerName} ਦਾ ਹੁਣ ${r(leftRupees)} ਰੁਪਏ ਬਾਕੀ।`,
      };
    }
    const back = changeRupees > 0;
    return {
      text: `save ਹੋ ਗਿਆ। ${customerName} ਦਾ ਖਾਤਾ ਬੰਦ।${back ? ` ₹${r(changeRupees)} ਵਾਪਸ ਦੇਣਾ ਨਾ ਭੁੱਲਣਾ।` : ""}`,
      speech: `save ਹੋ ਗਿਆ। ${customerName} ਦਾ ਖਾਤਾ ਬੰਦ।${back ? ` ${r(changeRupees)} ਰੁਪਏ ਵਾਪਸ ਦੇਣਾ ਨਾ ਭੁੱਲਣਾ।` : ""}`,
    };
  },

  linkStillOut: (customerName) => ({
    text: `${customerName} ਨੂੰ ਦੱਸ ਦਿਓ ਕਿ ਹੁਣ payment link ਤੋਂ ਪੈਸੇ ਨਾ ਭਰਨ।`,
    speech: `${customerName} ਨੂੰ ਦੱਸ ਦਿਓ ਕਿ ਹੁਣ payment link ਤੋਂ ਪੈਸੇ ਨਾ ਭਰਨ।`,
  }),

  qrSameMoney: (customerName, amountRupees) => ({
    text: `QR ਤੇ ₹${r(amountRupees)} ਆਏ ਹਨ, ਅਜੇ ਕਿਸੇ ਖਾਤੇ ਵਿੱਚ ਨਹੀਂ ਜੋੜੇ। ਕੀ ਇਹ ${customerName} ਵਾਲੇ ਹੀ ਹਨ?`,
    speech: `QR ਤੇ ${r(amountRupees)} ਰੁਪਏ ਆਏ ਹਨ, ਅਜੇ ਕਿਸੇ ਖਾਤੇ ਵਿੱਚ ਨਹੀਂ ਜੋੜੇ। ਕੀ ਇਹ ${customerName} ਵਾਲੇ ਹੀ ਹਨ?`,
  }),

  noSuchCustomer: (customerName) => ({
    text: `${customerName} ਦਾ ਕੋਈ ਖਾਤਾ ਨਹੀਂ ਮਿਲਿਆ।`,
    speech: `${customerName} ਦਾ ਕੋਈ ਖਾਤਾ ਨਹੀਂ ਮਿਲਿਆ।`,
  }),

  nothingOwed: (customerName) => ({
    text: `${customerName} ਦਾ ਕੋਈ ਉਧਾਰ ਬਾਕੀ ਨਹੀਂ।`,
    speech: `${customerName} ਦਾ ਕੋਈ ਉਧਾਰ ਬਾਕੀ ਨਹੀਂ।`,
  }),

  customerOwes: (customerName, pendingRupees) => ({
    text: `${customerName} ਦਾ ₹${r(pendingRupees)} ਬਾਕੀ ਹੈ।`,
    speech: `${customerName} ਦਾ ${r(pendingRupees)} ਰੁਪਏ ਬਾਕੀ ਹੈ।`,
  }),

  shopOwed: (pendingRupees, customers) => {
    const where = customers === 1 ? "ਇੱਕੋ ਖਾਤੇ ਵਿੱਚ" : `${customers} ਖਾਤਿਆਂ ਵਿੱਚ`;
    return {
      text: `ਕੁੱਲ ₹${r(pendingRupees)} ਬਾਕੀ, ${where}।`,
      speech: `ਕੁੱਲ ${r(pendingRupees)} ਰੁਪਏ ਬਾਕੀ, ${where}।`,
    };
  },

  nobodyOwes: () => ({ text: "ਹੁਣ ਕਿਸੇ ਦਾ ਉਧਾਰ ਬਾਕੀ ਨਹੀਂ।", speech: "ਹੁਣ ਕਿਸੇ ਦਾ ਉਧਾਰ ਬਾਕੀ ਨਹੀਂ।" }),
};
