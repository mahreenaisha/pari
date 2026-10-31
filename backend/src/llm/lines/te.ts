/** Telugu: Telugu script on screen and for speech, with ₹ spoken as రూపాయలు. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const te: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "ఒకసారి జాగ్రత్తగా వినండి. " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} అప్పు. save చేయనా?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} రూపాయలు అప్పు. save చేయనా?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)} సామాను, పూర్తిగా ₹${r(e.paidRupees)} వచ్చేసింది. save చేయనా?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} రూపాయల సామాను, పూర్తిగా ${r(e.paidRupees)} రూపాయలు వచ్చేశాయి. save చేయనా?`,
      };
    }
    return {
      text: `${care}${e.customerName}, మొత్తం ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} వచ్చింది, ₹${r(e.pendingRupees)} బాకీ. save చేయనా?`,
      speech: `${care}${e.customerName}, మొత్తం ${r(e.totalRupees)} రూపాయలు, ${r(e.paidRupees)} వచ్చాయి, ${r(e.pendingRupees)} బాకీ. save చేయనా?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save అయింది. ₹${r(pendingRupees)} కి payment link పంపనా?`,
    speech: `save అయింది. ${r(pendingRupees)} రూపాయలకి payment link పంపనా?`,
  }),

  savedClosed: () => ({
    text: "save అయింది. డబ్బు పూర్తిగా వచ్చేసింది, ఖాతా పూర్తయింది.",
    speech: "save అయింది. డబ్బు పూర్తిగా వచ్చేసింది, ఖాతా పూర్తయింది.",
  }),

  entryRejected: () => ({
    text: "సరే, entry cancel చేశాను. మళ్ళీ చెప్పండి.",
    speech: "సరే, entry cancel చేశాను. మళ్ళీ చెప్పండి.",
  }),

  entryCorrected: (e, needsReview) => {
    const base = te.entryReadback(e, needsReview);
    return { text: `సరిచేశాను. ${base.text}`, speech: `సరిచేశాను. ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName} mobile number చెప్పండి.`,
    speech: `${customerName} mobile number చెప్పండి.`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}. సరైనదేనా?`,
    speech: `${phoneForSpeech(phone)}. సరైనదేనా?`,
  }),

  phoneInvalid: () => ({
    text: "ఈ number సరిగ్గా లేనట్టుంది. 10 అంకెల mobile number చెప్పండి.",
    speech: "ఈ number సరిగ్గా లేనట్టుంది. పది అంకెల mobile number చెప్పండి.",
  }),

  phoneRetry: () => ({
    text: "సరే, number మళ్ళీ చెప్పండి.",
    speech: "సరే, number మళ్ళీ చెప్పండి.",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link పంపేశాను. ${customerName} కి ₹${r(amountRupees)} link SMS లో వెళ్ళింది.`,
    speech: `link పంపేశాను. ${customerName} కి ${r(amountRupees)} రూపాయల link SMS లో వెళ్ళింది.`,
  }),

  collectDeclined: () => ({
    text: "సరే, link పంపలేదు. entry ఇంకా open గానే ఉంది.",
    speech: "సరే, link పంపలేదు. entry ఇంకా open గానే ఉంది.",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} ₹${r(amountRupees)} ఇచ్చేశారు. ఖాతా పూర్తయింది.`,
          speech: `${customerName} ${r(amountRupees)} రూపాయలు ఇచ్చేశారు. ఖాతా పూర్తయింది.`,
        }
      : {
          text: `${customerName} ₹${r(amountRupees)} ఇచ్చారు. ఇంకా ₹${r(pendingRupees)} బాకీ.`,
          speech: `${customerName} ${r(amountRupees)} రూపాయలు ఇచ్చారు. ఇంకా ${r(pendingRupees)} రూపాయలు బాకీ.`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} వచ్చింది, ${customerName} దా?${over ? ` (బాకీ ₹${r(pendingRupees)} మాత్రమే ఉండేది.)` : ""}`,
      speech: `${r(amountRupees)} రూపాయలు వచ్చాయి, ${customerName} దా?${over ? ` బాకీ ${r(pendingRupees)} రూపాయలు మాత్రమే ఉండేది.` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)} QR payment వచ్చింది. ఏ open entry తోనూ match కాలేదు.`,
    speech: `${r(amountRupees)} రూపాయల QR payment వచ్చింది. ఏ open entry తోనూ match కాలేదు.`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `సరే, ${customerName} ఖాతాలో కలిపాను. ఖాతా పూర్తయింది.`,
          speech: `సరే, ${customerName} ఖాతాలో కలిపాను. ఖాతా పూర్తయింది.`,
        }
      : {
          text: `సరే, ${customerName} ఖాతాలో కలిపాను. ఇంకా ₹${r(pendingRupees)} బాకీ.`,
          speech: `సరే, ${customerName} ఖాతాలో కలిపాను. ఇంకా ${r(pendingRupees)} రూపాయలు బాకీ.`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)} payment వచ్చింది, కానీ దాని entry ఇదివరకే పూర్తయింది. దాన్ని పక్కన పెట్టాను.`,
    speech: `${r(amountRupees)} రూపాయల payment వచ్చింది, కానీ దాని entry ఇదివరకే పూర్తయింది. దాన్ని పక్కన పెట్టాను.`,
  }),

  linkFailed: () => ({
    text: "Paytm లో link తయారు కాలేదు. కాసేపయ్యాక మళ్ళీ ప్రయత్నించండి.",
    speech: "Paytm లో link తయారు కాలేదు. కాసేపయ్యాక మళ్ళీ ప్రయత్నించండి.",
  }),

  qrLeftUnmatched: () => ({
    text: "సరే, ఈ payment ని పక్కన పెట్టాను.",
    speech: "సరే, ఈ payment ని పక్కన పెట్టాను.",
  }),

  notUnderstoodYesNo: () => ({
    text: "క్షమించండి, అర్థం కాలేదు. అవును లేదా కాదు అని చెప్పండి.",
    speech: "క్షమించండి, అర్థం కాలేదు. అవును లేదా కాదు అని చెప్పండి.",
  }),

  notAnEntry: () => ({
    text: "క్షమించండి, అర్థం కాలేదు. ఇలా చెప్పండి: రవి గారు 350 రూపాయల సామాను తీసుకున్నారు, 200 ఇచ్చారు, 150 బాకీ.",
    speech: "క్షమించండి, అర్థం కాలేదు. ఇలా చెప్పండి: రవి గారు 350 రూపాయల సామాను తీసుకున్నారు, 200 ఇచ్చారు, 150 బాకీ.",
  }),

  amountsUnclear: () => ({
    text: "మొత్తం సరిగ్గా వినిపించలేదు. ఇంకోసారి చెప్పండి.",
    speech: "మొత్తం సరిగ్గా వినిపించలేదు. ఇంకోసారి చెప్పండి.",
  }),

  newCustomer: () => ({ text: "కొత్త ఖాతా.", speech: "కొత్త ఖాతా." }),

  sameCustomer: (spokenName, knownName) => ({
    text: `${spokenName}, ${knownName} ఇద్దరూ ఒకరేనా?`,
    speech: `${spokenName}, ${knownName} ఇద్దరూ ఒకరేనా?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName} entry తర్వాత. ముందు ఇది:`,
    speech: `${nextCustomerName} entry తర్వాత. ముందు ఇది:`,
  }),

  nextEntry: () => ({ text: "ఇప్పుడు తర్వాతి entry.", speech: "ఇప్పుడు తర్వాతి entry." }),

  unsaved: (customerNames) => ({
    text: `${customerNames} entry save కాలేదు.`,
    speech: `${customerNames} entry save కాలేదు.`,
  }),

  changeUnclear: () => ({ text: "ఏం మార్చాలో అర్థం కాలేదు.", speech: "ఏం మార్చాలో అర్థం కాలేదు." }),

  askName: () => ({ text: "ఎవరి పేరు మీద రాయాలి?", speech: "ఎవరి పేరు మీద రాయాలి?" }),

  askAmount: (customerName) => ({ text: `${customerName}, ఎన్ని రూపాయలు?`, speech: `${customerName}, ఎన్ని రూపాయలు?` }),

  repaymentReadback: (p, needsReview) => {
    const care = needsReview ? "ఒకసారి జాగ్రత్తగా వినండి. " : "";
    if (p.changeRupees > 0) {
      const paid = p.amountRupees + p.changeRupees;
      return {
        text: `${care}${p.customerName} ₹${r(paid)} ఇచ్చారు, కానీ బాకీ ₹${r(p.owedRupees)} మాత్రమే. ఖాతా పూర్తవుతుంది, ₹${r(p.changeRupees)} తిరిగి ఇవ్వాలి. save చేయనా?`,
        speech: `${care}${p.customerName} ${r(paid)} రూపాయలు ఇచ్చారు, కానీ బాకీ ${r(p.owedRupees)} రూపాయలు మాత్రమే. ఖాతా పూర్తవుతుంది, ${r(p.changeRupees)} రూపాయలు తిరిగి ఇవ్వాలి. save చేయనా?`,
      };
    }
    if (p.leftRupees === 0) {
      return {
        text: `${care}${p.customerName} నుంచి పూర్తిగా ₹${r(p.amountRupees)} వచ్చాయి. ఖాతా పూర్తవుతుంది. save చేయనా?`,
        speech: `${care}${p.customerName} నుంచి పూర్తిగా ${r(p.amountRupees)} రూపాయలు వచ్చాయి. ఖాతా పూర్తవుతుంది. save చేయనా?`,
      };
    }
    return {
      text: `${care}${p.customerName} నుంచి ₹${r(p.amountRupees)} వచ్చాయి. ₹${r(p.owedRupees)} బాకీ ఉండేది, ఇక ₹${r(p.leftRupees)} బాకీ ఉంటుంది. save చేయనా?`,
      speech: `${care}${p.customerName} నుంచి ${r(p.amountRupees)} రూపాయలు వచ్చాయి. ${r(p.owedRupees)} రూపాయలు బాకీ ఉండేది, ఇక ${r(p.leftRupees)} రూపాయలు బాకీ ఉంటుంది. save చేయనా?`,
    };
  },

  repaymentCorrected: (p, needsReview) => {
    const base = te.repaymentReadback(p, needsReview);
    return { text: `సరిచేశాను. ${base.text}`, speech: `సరిచేశాను. ${base.speech}` };
  },

  repaymentSaved: (customerName, leftRupees, changeRupees) => {
    if (leftRupees > 0) {
      return {
        text: `save అయింది. ${customerName} కి ఇంకా ₹${r(leftRupees)} బాకీ.`,
        speech: `save అయింది. ${customerName} కి ఇంకా ${r(leftRupees)} రూపాయలు బాకీ.`,
      };
    }
    const back = changeRupees > 0;
    return {
      text: `save అయింది. ${customerName} ఖాతా పూర్తయింది.${back ? ` ₹${r(changeRupees)} తిరిగి ఇవ్వడం మర్చిపోకండి.` : ""}`,
      speech: `save అయింది. ${customerName} ఖాతా పూర్తయింది.${back ? ` ${r(changeRupees)} రూపాయలు తిరిగి ఇవ్వడం మర్చిపోకండి.` : ""}`,
    };
  },

  linkStillOut: (customerName) => ({
    text: `${customerName} కి ఇక payment link లో కట్టొద్దని చెప్పండి.`,
    speech: `${customerName} కి ఇక payment link లో కట్టొద్దని చెప్పండి.`,
  }),

  qrSameMoney: (customerName, amountRupees) => ({
    text: `QR లో ₹${r(amountRupees)} వచ్చాయి, ఇంకా ఏ ఖాతాలోనూ కలపలేదు. ఇవి ${customerName} ఇచ్చినవేనా?`,
    speech: `QR లో ${r(amountRupees)} రూపాయలు వచ్చాయి, ఇంకా ఏ ఖాతాలోనూ కలపలేదు. ఇవి ${customerName} ఇచ్చినవేనా?`,
  }),

  noSuchCustomer: (customerName) => ({
    text: `${customerName} పేరుతో ఖాతా లేదు.`,
    speech: `${customerName} పేరుతో ఖాతా లేదు.`,
  }),

  nothingOwed: (customerName) => ({
    text: `${customerName} కి బాకీ ఏమీ లేదు.`,
    speech: `${customerName} కి బాకీ ఏమీ లేదు.`,
  }),

  customerOwes: (customerName, pendingRupees) => ({
    text: `${customerName} కి ₹${r(pendingRupees)} బాకీ ఉంది.`,
    speech: `${customerName} కి ${r(pendingRupees)} రూపాయలు బాకీ ఉంది.`,
  }),

  shopOwed: (pendingRupees, customers) => {
    const where = customers === 1 ? "ఒకే ఖాతాలో" : `${customers} ఖాతాల్లో`;
    return {
      text: `మొత్తం ₹${r(pendingRupees)} బాకీ, ${where}.`,
      speech: `మొత్తం ${r(pendingRupees)} రూపాయలు బాకీ, ${where}.`,
    };
  },

  nobodyOwes: () => ({ text: "ఇప్పుడు ఎవరికీ బాకీ లేదు.", speech: "ఇప్పుడు ఎవరికీ బాకీ లేదు." }),
};
