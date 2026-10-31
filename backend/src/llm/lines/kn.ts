/** Kannada: Kannada script on screen and for speech, with ₹ spoken as ರೂಪಾಯಿ. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const kn: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "ಒಮ್ಮೆ ಗಮನವಿಟ್ಟು ಕೇಳಿ. " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} ಸಾಲ. save ಮಾಡಲಾ?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} ರೂಪಾಯಿ ಸಾಲ. save ಮಾಡಲಾ?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)} ಸಾಮಾನು, ಪೂರ್ತಿ ₹${r(e.paidRupees)} ಬಂತು. save ಮಾಡಲಾ?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} ರೂಪಾಯಿ ಸಾಮಾನು, ಪೂರ್ತಿ ${r(e.paidRupees)} ರೂಪಾಯಿ ಬಂತು. save ಮಾಡಲಾ?`,
      };
    }
    return {
      text: `${care}${e.customerName}, ಒಟ್ಟು ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} ಬಂತು, ₹${r(e.pendingRupees)} ಬಾಕಿ. save ಮಾಡಲಾ?`,
      speech: `${care}${e.customerName}, ಒಟ್ಟು ${r(e.totalRupees)} ರೂಪಾಯಿ, ${r(e.paidRupees)} ಬಂತು, ${r(e.pendingRupees)} ಬಾಕಿ. save ಮಾಡಲಾ?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save ಆಯ್ತು. ₹${r(pendingRupees)} ಗೆ payment link ಕಳಿಸಲಾ?`,
    speech: `save ಆಯ್ತು. ${r(pendingRupees)} ರೂಪಾಯಿಗೆ payment link ಕಳಿಸಲಾ?`,
  }),

  savedClosed: () => ({
    text: "save ಆಯ್ತು. ಪೂರ್ತಿ ಹಣ ಬಂತು, ಖಾತೆ ಮುಗೀತು.",
    speech: "save ಆಯ್ತು. ಪೂರ್ತಿ ಹಣ ಬಂತು, ಖಾತೆ ಮುಗೀತು.",
  }),

  entryRejected: () => ({
    text: "ಸರಿ, entry cancel ಮಾಡಿದೆ. ಮತ್ತೆ ಹೇಳಿ.",
    speech: "ಸರಿ, entry cancel ಮಾಡಿದೆ. ಮತ್ತೆ ಹೇಳಿ.",
  }),

  entryCorrected: (e, needsReview) => {
    const base = kn.entryReadback(e, needsReview);
    return { text: `ಸರಿ ಮಾಡಿದೆ. ${base.text}`, speech: `ಸರಿ ಮಾಡಿದೆ. ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName} ಅವರ mobile number ಹೇಳಿ.`,
    speech: `${customerName} ಅವರ mobile number ಹೇಳಿ.`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}. ಸರಿ ಇದೆಯಾ?`,
    speech: `${phoneForSpeech(phone)}. ಸರಿ ಇದೆಯಾ?`,
  }),

  phoneInvalid: () => ({
    text: "ಈ number ಸರಿ ಇಲ್ಲ ಅನ್ಸುತ್ತೆ. 10 ಅಂಕಿಯ mobile number ಹೇಳಿ.",
    speech: "ಈ number ಸರಿ ಇಲ್ಲ ಅನ್ಸುತ್ತೆ. ಹತ್ತು ಅಂಕಿಯ mobile number ಹೇಳಿ.",
  }),

  phoneRetry: () => ({
    text: "ಸರಿ, number ಮತ್ತೆ ಹೇಳಿ.",
    speech: "ಸರಿ, number ಮತ್ತೆ ಹೇಳಿ.",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link ಕಳಿಸಿದೆ. ${customerName} ಅವರಿಗೆ ₹${r(amountRupees)} link SMS ಹೋಯ್ತು.`,
    speech: `link ಕಳಿಸಿದೆ. ${customerName} ಅವರಿಗೆ ${r(amountRupees)} ರೂಪಾಯಿ link SMS ಹೋಯ್ತು.`,
  }),

  collectDeclined: () => ({
    text: "ಸರಿ, link ಕಳಿಸಲಿಲ್ಲ. entry ಇನ್ನೂ open ಇದೆ.",
    speech: "ಸರಿ, link ಕಳಿಸಲಿಲ್ಲ. entry ಇನ್ನೂ open ಇದೆ.",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} ₹${r(amountRupees)} ಕೊಟ್ಟರು. ಖಾತೆ ಮುಗೀತು.`,
          speech: `${customerName} ${r(amountRupees)} ರೂಪಾಯಿ ಕೊಟ್ಟರು. ಖಾತೆ ಮುಗೀತು.`,
        }
      : {
          text: `${customerName} ₹${r(amountRupees)} ಕೊಟ್ಟರು. ಇನ್ನೂ ₹${r(pendingRupees)} ಬಾಕಿ.`,
          speech: `${customerName} ${r(amountRupees)} ರೂಪಾಯಿ ಕೊಟ್ಟರು. ಇನ್ನೂ ${r(pendingRupees)} ರೂಪಾಯಿ ಬಾಕಿ.`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} ಬಂದಿದೆ, ${customerName} ಅವರದಾ?${over ? ` (ಬಾಕಿ ₹${r(pendingRupees)} ಮಾತ್ರ ಇತ್ತು.)` : ""}`,
      speech: `${r(amountRupees)} ರೂಪಾಯಿ ಬಂದಿದೆ, ${customerName} ಅವರದಾ?${over ? ` ಬಾಕಿ ${r(pendingRupees)} ರೂಪಾಯಿ ಮಾತ್ರ ಇತ್ತು.` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)} QR payment ಬಂದಿದೆ. ಯಾವ open entry ಜೊತೆಗೂ match ಆಗಲಿಲ್ಲ.`,
    speech: `${r(amountRupees)} ರೂಪಾಯಿ QR payment ಬಂದಿದೆ. ಯಾವ open entry ಜೊತೆಗೂ match ಆಗಲಿಲ್ಲ.`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `ಸರಿ, ${customerName} ಅವರ ಖಾತೆಗೆ ಸೇರಿಸಿದೆ. ಖಾತೆ ಮುಗೀತು.`,
          speech: `ಸರಿ, ${customerName} ಅವರ ಖಾತೆಗೆ ಸೇರಿಸಿದೆ. ಖಾತೆ ಮುಗೀತು.`,
        }
      : {
          text: `ಸರಿ, ${customerName} ಅವರ ಖಾತೆಗೆ ಸೇರಿಸಿದೆ. ಇನ್ನೂ ₹${r(pendingRupees)} ಬಾಕಿ.`,
          speech: `ಸರಿ, ${customerName} ಅವರ ಖಾತೆಗೆ ಸೇರಿಸಿದೆ. ಇನ್ನೂ ${r(pendingRupees)} ರೂಪಾಯಿ ಬಾಕಿ.`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)} payment ಬಂದಿದೆ, ಆದರೆ ಅದರ entry ಆಗಲೇ ಮುಗಿದಿದೆ. ಬೇರೆ ಇಟ್ಟಿದ್ದೀನಿ.`,
    speech: `${r(amountRupees)} ರೂಪಾಯಿ payment ಬಂದಿದೆ, ಆದರೆ ಅದರ entry ಆಗಲೇ ಮುಗಿದಿದೆ. ಬೇರೆ ಇಟ್ಟಿದ್ದೀನಿ.`,
  }),

  linkFailed: () => ({
    text: "Paytm ನಲ್ಲಿ link ಮಾಡೋಕೆ ಆಗಲಿಲ್ಲ. ಸ್ವಲ್ಪ ಹೊತ್ತು ಬಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    speech: "Paytm ನಲ್ಲಿ link ಮಾಡೋಕೆ ಆಗಲಿಲ್ಲ. ಸ್ವಲ್ಪ ಹೊತ್ತು ಬಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  }),

  qrLeftUnmatched: () => ({
    text: "ಸರಿ, ಈ payment ಬೇರೆ ಇಟ್ಟಿದ್ದೀನಿ.",
    speech: "ಸರಿ, ಈ payment ಬೇರೆ ಇಟ್ಟಿದ್ದೀನಿ.",
  }),

  notUnderstoodYesNo: () => ({
    text: "ಕ್ಷಮಿಸಿ, ಅರ್ಥ ಆಗಲಿಲ್ಲ. ಹೌದು ಅಥವಾ ಇಲ್ಲ ಅಂತ ಹೇಳಿ.",
    speech: "ಕ್ಷಮಿಸಿ, ಅರ್ಥ ಆಗಲಿಲ್ಲ. ಹೌದು ಅಥವಾ ಇಲ್ಲ ಅಂತ ಹೇಳಿ.",
  }),

  notAnEntry: () => ({
    text: "ಕ್ಷಮಿಸಿ, ಅರ್ಥ ಆಗಲಿಲ್ಲ. ಹೀಗೆ ಹೇಳಿ: ಮಂಜುನಾಥ್ ಅವರು 350 ರೂಪಾಯಿ ಸಾಮಾನು ತಗೊಂಡರು, 200 ಕೊಟ್ಟರು, 150 ಬಾಕಿ.",
    speech: "ಕ್ಷಮಿಸಿ, ಅರ್ಥ ಆಗಲಿಲ್ಲ. ಹೀಗೆ ಹೇಳಿ: ಮಂಜುನಾಥ್ ಅವರು 350 ರೂಪಾಯಿ ಸಾಮಾನು ತಗೊಂಡರು, 200 ಕೊಟ್ಟರು, 150 ಬಾಕಿ.",
  }),

  amountsUnclear: () => ({
    text: "ಮೊತ್ತ ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ಇನ್ನೊಮ್ಮೆ ಹೇಳಿ.",
    speech: "ಮೊತ್ತ ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ಇನ್ನೊಮ್ಮೆ ಹೇಳಿ.",
  }),

  newCustomer: () => ({ text: "ಹೊಸ ಖಾತೆ.", speech: "ಹೊಸ ಖಾತೆ." }),

  sameCustomer: (spokenName, knownName) => ({
    text: `${spokenName} ಮತ್ತು ${knownName} ಒಬ್ಬರೇನಾ?`,
    speech: `${spokenName} ಮತ್ತು ${knownName} ಒಬ್ಬರೇನಾ?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName} ಅವರ entry ಆಮೇಲೆ. ಮೊದಲು ಇದು:`,
    speech: `${nextCustomerName} ಅವರ entry ಆಮೇಲೆ. ಮೊದಲು ಇದು:`,
  }),

  nextEntry: () => ({ text: "ಈಗ ಮುಂದಿನ entry.", speech: "ಈಗ ಮುಂದಿನ entry." }),

  unsaved: (customerNames) => ({
    text: `${customerNames} ಅವರ entry save ಆಗಿರಲಿಲ್ಲ.`,
    speech: `${customerNames} ಅವರ entry save ಆಗಿರಲಿಲ್ಲ.`,
  }),

  changeUnclear: () => ({ text: "ಏನು ಬದಲಾಯಿಸಬೇಕು ಅಂತ ಅರ್ಥ ಆಗಲಿಲ್ಲ.", speech: "ಏನು ಬದಲಾಯಿಸಬೇಕು ಅಂತ ಅರ್ಥ ಆಗಲಿಲ್ಲ." }),

  askName: () => ({ text: "ಯಾರ ಹೆಸರಲ್ಲಿ ಬರೆಯಲಿ?", speech: "ಯಾರ ಹೆಸರಲ್ಲಿ ಬರೆಯಲಿ?" }),

  askAmount: (customerName) => ({ text: `${customerName}, ಎಷ್ಟು ರೂಪಾಯಿ?`, speech: `${customerName}, ಎಷ್ಟು ರೂಪಾಯಿ?` }),

  repaymentReadback: (p, needsReview) => {
    const care = needsReview ? "ಒಮ್ಮೆ ಗಮನವಿಟ್ಟು ಕೇಳಿ. " : "";
    if (p.changeRupees > 0) {
      const paid = p.amountRupees + p.changeRupees;
      return {
        text: `${care}${p.customerName} ₹${r(paid)} ಕೊಟ್ಟರು, ಆದರೆ ಸಾಲ ₹${r(p.owedRupees)} ಮಾತ್ರ ಇತ್ತು. ಖಾತೆ ಮುಗಿಯುತ್ತೆ, ₹${r(p.changeRupees)} ವಾಪಸ್ ಕೊಡಬೇಕು. save ಮಾಡಲಾ?`,
        speech: `${care}${p.customerName} ${r(paid)} ರೂಪಾಯಿ ಕೊಟ್ಟರು, ಆದರೆ ಸಾಲ ${r(p.owedRupees)} ರೂಪಾಯಿ ಮಾತ್ರ ಇತ್ತು. ಖಾತೆ ಮುಗಿಯುತ್ತೆ, ${r(p.changeRupees)} ರೂಪಾಯಿ ವಾಪಸ್ ಕೊಡಬೇಕು. save ಮಾಡಲಾ?`,
      };
    }
    if (p.leftRupees === 0) {
      return {
        text: `${care}${p.customerName} ಅವರಿಂದ ಪೂರ್ತಿ ₹${r(p.amountRupees)} ಬಂತು. ಖಾತೆ ಮುಗಿಯುತ್ತೆ. save ಮಾಡಲಾ?`,
        speech: `${care}${p.customerName} ಅವರಿಂದ ಪೂರ್ತಿ ${r(p.amountRupees)} ರೂಪಾಯಿ ಬಂತು. ಖಾತೆ ಮುಗಿಯುತ್ತೆ. save ಮಾಡಲಾ?`,
      };
    }
    return {
      text: `${care}${p.customerName} ಅವರಿಂದ ₹${r(p.amountRupees)} ಬಂತು. ₹${r(p.owedRupees)} ಬಾಕಿ ಇತ್ತು, ಇನ್ನು ₹${r(p.leftRupees)} ಬಾಕಿ ಉಳಿಯುತ್ತೆ. save ಮಾಡಲಾ?`,
      speech: `${care}${p.customerName} ಅವರಿಂದ ${r(p.amountRupees)} ರೂಪಾಯಿ ಬಂತು. ${r(p.owedRupees)} ರೂಪಾಯಿ ಬಾಕಿ ಇತ್ತು, ಇನ್ನು ${r(p.leftRupees)} ರೂಪಾಯಿ ಬಾಕಿ ಉಳಿಯುತ್ತೆ. save ಮಾಡಲಾ?`,
    };
  },

  repaymentCorrected: (p, needsReview) => {
    const base = kn.repaymentReadback(p, needsReview);
    return { text: `ಸರಿ ಮಾಡಿದೆ. ${base.text}`, speech: `ಸರಿ ಮಾಡಿದೆ. ${base.speech}` };
  },

  repaymentSaved: (customerName, leftRupees, changeRupees) => {
    if (leftRupees > 0) {
      return {
        text: `save ಆಯ್ತು. ${customerName} ಅವರದು ಇನ್ನೂ ₹${r(leftRupees)} ಬಾಕಿ.`,
        speech: `save ಆಯ್ತು. ${customerName} ಅವರದು ಇನ್ನೂ ${r(leftRupees)} ರೂಪಾಯಿ ಬಾಕಿ.`,
      };
    }
    const back = changeRupees > 0;
    return {
      text: `save ಆಯ್ತು. ${customerName} ಅವರ ಖಾತೆ ಮುಗೀತು.${back ? ` ₹${r(changeRupees)} ವಾಪಸ್ ಕೊಡೋದು ಮರೆಯಬೇಡಿ.` : ""}`,
      speech: `save ಆಯ್ತು. ${customerName} ಅವರ ಖಾತೆ ಮುಗೀತು.${back ? ` ${r(changeRupees)} ರೂಪಾಯಿ ವಾಪಸ್ ಕೊಡೋದು ಮರೆಯಬೇಡಿ.` : ""}`,
    };
  },

  linkStillOut: (customerName) => ({
    text: `${customerName} ಅವರಿಗೆ ಇನ್ನು payment link ನಲ್ಲಿ ಕಟ್ಟಬೇಡಿ ಅಂತ ಹೇಳಿ.`,
    speech: `${customerName} ಅವರಿಗೆ ಇನ್ನು payment link ನಲ್ಲಿ ಕಟ್ಟಬೇಡಿ ಅಂತ ಹೇಳಿ.`,
  }),

  qrSameMoney: (customerName, amountRupees) => ({
    text: `QR ನಲ್ಲಿ ₹${r(amountRupees)} ಬಂದಿದೆ, ಇನ್ನೂ ಯಾವ ಖಾತೆಗೂ ಸೇರಿಸಿಲ್ಲ. ಇದು ${customerName} ಅವರು ಕೊಟ್ಟಿದ್ದಾ?`,
    speech: `QR ನಲ್ಲಿ ${r(amountRupees)} ರೂಪಾಯಿ ಬಂದಿದೆ, ಇನ್ನೂ ಯಾವ ಖಾತೆಗೂ ಸೇರಿಸಿಲ್ಲ. ಇದು ${customerName} ಅವರು ಕೊಟ್ಟಿದ್ದಾ?`,
  }),

  noSuchCustomer: (customerName) => ({
    text: `${customerName} ಹೆಸರಲ್ಲಿ ಖಾತೆ ಇಲ್ಲ.`,
    speech: `${customerName} ಹೆಸರಲ್ಲಿ ಖಾತೆ ಇಲ್ಲ.`,
  }),

  nothingOwed: (customerName) => ({
    text: `${customerName} ಅವರದು ಯಾವ ಬಾಕಿಯೂ ಇಲ್ಲ.`,
    speech: `${customerName} ಅವರದು ಯಾವ ಬಾಕಿಯೂ ಇಲ್ಲ.`,
  }),

  customerOwes: (customerName, pendingRupees) => ({
    text: `${customerName} ಅವರದು ₹${r(pendingRupees)} ಬಾಕಿ ಇದೆ.`,
    speech: `${customerName} ಅವರದು ${r(pendingRupees)} ರೂಪಾಯಿ ಬಾಕಿ ಇದೆ.`,
  }),

  shopOwed: (pendingRupees, customers) => {
    const where = customers === 1 ? "ಒಂದೇ ಖಾತೆಯಲ್ಲಿ" : `${customers} ಖಾತೆಗಳಲ್ಲಿ`;
    return {
      text: `ಒಟ್ಟು ₹${r(pendingRupees)} ಬಾಕಿ, ${where}.`,
      speech: `ಒಟ್ಟು ${r(pendingRupees)} ರೂಪಾಯಿ ಬಾಕಿ, ${where}.`,
    };
  },

  nobodyOwes: () => ({ text: "ಈಗ ಯಾರದೂ ಬಾಕಿ ಇಲ್ಲ.", speech: "ಈಗ ಯಾರದೂ ಬಾಕಿ ಇಲ್ಲ." }),
};
