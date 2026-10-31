/** Marathi: Devanagari on screen and for speech, with ₹ spoken as रुपये. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const mr: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "एकदा नीट ऐका. " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} उधार. save करू का?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} रुपये उधार. save करू का?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)} चं सामान, पूर्ण ₹${r(e.paidRupees)} मिळाले. save करू का?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} रुपयांचं सामान, पूर्ण ${r(e.paidRupees)} रुपये मिळाले. save करू का?`,
      };
    }
    return {
      text: `${care}${e.customerName}, एकूण ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} मिळाले, ₹${r(e.pendingRupees)} बाकी. save करू का?`,
      speech: `${care}${e.customerName}, एकूण ${r(e.totalRupees)} रुपये, ${r(e.paidRupees)} मिळाले, ${r(e.pendingRupees)} बाकी. save करू का?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save झालं. ₹${r(pendingRupees)} ची payment link पाठवू का?`,
    speech: `save झालं. ${r(pendingRupees)} रुपयांची payment link पाठवू का?`,
  }),

  savedClosed: () => ({
    text: "save झालं. पूर्ण पैसे मिळाले, खातं बंद.",
    speech: "save झालं. पूर्ण पैसे मिळाले, खातं बंद.",
  }),

  entryRejected: () => ({
    text: "ठीक आहे, entry रद्द केली. पुन्हा सांगा.",
    speech: "ठीक आहे, entry रद्द केली. पुन्हा सांगा.",
  }),

  entryCorrected: (e, needsReview) => {
    const base = mr.entryReadback(e, needsReview);
    return { text: `दुरुस्त केलं. ${base.text}`, speech: `दुरुस्त केलं. ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName} यांचा mobile नंबर सांगा.`,
    speech: `${customerName} यांचा mobile नंबर सांगा.`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}. बरोबर आहे का?`,
    speech: `${phoneForSpeech(phone)}. बरोबर आहे का?`,
  }),

  phoneInvalid: () => ({
    text: "हा नंबर बरोबर वाटत नाही. 10 अंकी mobile नंबर सांगा.",
    speech: "हा नंबर बरोबर वाटत नाही. दहा अंकी mobile नंबर सांगा.",
  }),

  phoneRetry: () => ({
    text: "ठीक आहे, नंबर पुन्हा सांगा.",
    speech: "ठीक आहे, नंबर पुन्हा सांगा.",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link पाठवली. ${customerName} यांना ₹${r(amountRupees)} ची link SMS ने गेली.`,
    speech: `link पाठवली. ${customerName} यांना ${r(amountRupees)} रुपयांची link SMS ने गेली.`,
  }),

  collectDeclined: () => ({
    text: "ठीक आहे, link पाठवली नाही. entry उघडी आहे.",
    speech: "ठीक आहे, link पाठवली नाही. entry उघडी आहे.",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} यांनी ₹${r(amountRupees)} दिले. खातं बंद.`,
          speech: `${customerName} यांनी ${r(amountRupees)} रुपये दिले. खातं बंद.`,
        }
      : {
          text: `${customerName} यांनी ₹${r(amountRupees)} दिले. आता ₹${r(pendingRupees)} बाकी.`,
          speech: `${customerName} यांनी ${r(amountRupees)} रुपये दिले. आता ${r(pendingRupees)} रुपये बाकी.`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} आले, ${customerName} यांचे का?${over ? ` (बाकी फक्त ₹${r(pendingRupees)} होते.)` : ""}`,
      speech: `${r(amountRupees)} रुपये आले, ${customerName} यांचे का?${over ? ` बाकी फक्त ${r(pendingRupees)} रुपये होते.` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)} चं QR payment आलं. कोणत्याही उघड्या entry शी जुळलं नाही.`,
    speech: `${r(amountRupees)} रुपयांचं QR payment आलं. कोणत्याही उघड्या entry शी जुळलं नाही.`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `ठीक आहे, ${customerName} यांच्या खात्यात जोडलं. खातं बंद.`,
          speech: `ठीक आहे, ${customerName} यांच्या खात्यात जोडलं. खातं बंद.`,
        }
      : {
          text: `ठीक आहे, ${customerName} यांच्या खात्यात जोडलं. आता ₹${r(pendingRupees)} बाकी.`,
          speech: `ठीक आहे, ${customerName} यांच्या खात्यात जोडलं. आता ${r(pendingRupees)} रुपये बाकी.`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)} चं payment आलं, पण त्याची entry आधीच बंद आहे. बाजूला ठेवलं.`,
    speech: `${r(amountRupees)} रुपयांचं payment आलं, पण त्याची entry आधीच बंद आहे. बाजूला ठेवलं.`,
  }),

  linkFailed: () => ({
    text: "Paytm वरून link तयार झाली नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.",
    speech: "Paytm वरून link तयार झाली नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.",
  }),

  qrLeftUnmatched: () => ({
    text: "ठीक आहे, हे payment बाजूला ठेवलं.",
    speech: "ठीक आहे, हे payment बाजूला ठेवलं.",
  }),

  notUnderstoodYesNo: () => ({
    text: "माफ करा, समजलं नाही. हो किंवा नाही सांगा.",
    speech: "माफ करा, समजलं नाही. हो किंवा नाही सांगा.",
  }),

  notAnEntry: () => ({
    text: "माफ करा, समजलं नाही. असं सांगा: पाटील काकांनी 350 रुपयांचं सामान घेतलं, 200 दिले, 150 बाकी.",
    speech: "माफ करा, समजलं नाही. असं सांगा: पाटील काकांनी 350 रुपयांचं सामान घेतलं, 200 दिले, 150 बाकी.",
  }),

  amountsUnclear: () => ({
    text: "रक्कम नीट ऐकू आली नाही. पुन्हा एकदा सांगा.",
    speech: "रक्कम नीट ऐकू आली नाही. पुन्हा एकदा सांगा.",
  }),

  newCustomer: () => ({ text: "नवीन खातं.", speech: "नवीन खातं." }),

  sameCustomer: (spokenName, knownName) => ({
    text: `${spokenName} आणि ${knownName} एकच आहेत का?`,
    speech: `${spokenName} आणि ${knownName} एकच आहेत का?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName} यांची entry नंतर. आधी ही:`,
    speech: `${nextCustomerName} यांची entry नंतर. आधी ही:`,
  }),

  nextEntry: () => ({ text: "आता पुढची entry.", speech: "आता पुढची entry." }),

  unsaved: (customerNames) => ({
    text: `${customerNames} यांची entry save झाली नव्हती.`,
    speech: `${customerNames} यांची entry save झाली नव्हती.`,
  }),

  changeUnclear: () => ({ text: "काय बदलायचं ते समजलं नाही.", speech: "काय बदलायचं ते समजलं नाही." }),

  askName: () => ({ text: "कोणाच्या नावावर लिहू?", speech: "कोणाच्या नावावर लिहू?" }),

  askAmount: (customerName) => ({ text: `${customerName}, किती रुपये?`, speech: `${customerName}, किती रुपये?` }),

  repaymentReadback: (p, needsReview) => {
    const care = needsReview ? "एकदा नीट ऐका. " : "";
    if (p.changeRupees > 0) {
      const paid = p.amountRupees + p.changeRupees;
      return {
        text: `${care}${p.customerName} यांनी ₹${r(paid)} दिले, पण उधार फक्त ₹${r(p.owedRupees)} होतं. खातं बंद होईल, ₹${r(p.changeRupees)} परत द्यायचे आहेत. save करू का?`,
        speech: `${care}${p.customerName} यांनी ${r(paid)} रुपये दिले, पण उधार फक्त ${r(p.owedRupees)} रुपये होतं. खातं बंद होईल, ${r(p.changeRupees)} रुपये परत द्यायचे आहेत. save करू का?`,
      };
    }
    if (p.leftRupees === 0) {
      return {
        text: `${care}${p.customerName} यांच्याकडून पूर्ण ₹${r(p.amountRupees)} मिळाले. खातं बंद होईल. save करू का?`,
        speech: `${care}${p.customerName} यांच्याकडून पूर्ण ${r(p.amountRupees)} रुपये मिळाले. खातं बंद होईल. save करू का?`,
      };
    }
    return {
      text: `${care}${p.customerName} यांच्याकडून ₹${r(p.amountRupees)} मिळाले. ₹${r(p.owedRupees)} बाकी होते, आता ₹${r(p.leftRupees)} उरतील. save करू का?`,
      speech: `${care}${p.customerName} यांच्याकडून ${r(p.amountRupees)} रुपये मिळाले. ${r(p.owedRupees)} रुपये बाकी होते, आता ${r(p.leftRupees)} रुपये उरतील. save करू का?`,
    };
  },

  repaymentCorrected: (p, needsReview) => {
    const base = mr.repaymentReadback(p, needsReview);
    return { text: `दुरुस्त केलं. ${base.text}`, speech: `दुरुस्त केलं. ${base.speech}` };
  },

  repaymentSaved: (customerName, leftRupees, changeRupees) => {
    if (leftRupees > 0) {
      return {
        text: `save झालं. ${customerName} यांचे आता ₹${r(leftRupees)} बाकी.`,
        speech: `save झालं. ${customerName} यांचे आता ${r(leftRupees)} रुपये बाकी.`,
      };
    }
    const back = changeRupees > 0;
    return {
      text: `save झालं. ${customerName} यांचं खातं बंद.${back ? ` ₹${r(changeRupees)} परत द्यायला विसरू नका.` : ""}`,
      speech: `save झालं. ${customerName} यांचं खातं बंद.${back ? ` ${r(changeRupees)} रुपये परत द्यायला विसरू नका.` : ""}`,
    };
  },

  linkStillOut: (customerName) => ({
    text: `${customerName} यांना सांगा की आता payment link ने पैसे भरू नका.`,
    speech: `${customerName} यांना सांगा की आता payment link ने पैसे भरू नका.`,
  }),

  qrSameMoney: (customerName, amountRupees) => ({
    text: `QR वर ₹${r(amountRupees)} आले आहेत, अजून कुठल्याही खात्यात जोडले नाहीत. हे ${customerName} यांचेच आहेत का?`,
    speech: `QR वर ${r(amountRupees)} रुपये आले आहेत, अजून कुठल्याही खात्यात जोडले नाहीत. हे ${customerName} यांचेच आहेत का?`,
  }),

  noSuchCustomer: (customerName) => ({
    text: `${customerName} यांचं खातं सापडलं नाही.`,
    speech: `${customerName} यांचं खातं सापडलं नाही.`,
  }),

  nothingOwed: (customerName) => ({
    text: `${customerName} यांचं काहीच उधार बाकी नाही.`,
    speech: `${customerName} यांचं काहीच उधार बाकी नाही.`,
  }),

  customerOwes: (customerName, pendingRupees) => ({
    text: `${customerName} यांचे ₹${r(pendingRupees)} बाकी आहेत.`,
    speech: `${customerName} यांचे ${r(pendingRupees)} रुपये बाकी आहेत.`,
  }),

  shopOwed: (pendingRupees, customers) => {
    const where = customers === 1 ? "एकाच खात्यात" : `${customers} खात्यांमध्ये`;
    return {
      text: `एकूण ₹${r(pendingRupees)} बाकी, ${where}.`,
      speech: `एकूण ${r(pendingRupees)} रुपये बाकी, ${where}.`,
    };
  },

  nobodyOwes: () => ({ text: "आत्ता कोणाचंच उधार बाकी नाही.", speech: "आत्ता कोणाचंच उधार बाकी नाही." }),
};
