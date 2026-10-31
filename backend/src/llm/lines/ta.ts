/** Tamil: spoken-style Tamil on screen and for speech, with ₹ spoken as ரூபாய். */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const ta: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "ஒரு தடவை கவனமா கேளுங்க. " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} கடன். save பண்ணட்டுமா?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} ரூபாய் கடன். save பண்ணட்டுமா?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)}-க்கு சாமான், முழுசா ₹${r(e.paidRupees)} வந்துடுச்சு. save பண்ணட்டுமா?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} ரூபாய்க்கு சாமான், முழுசா ${r(e.paidRupees)} ரூபாய் வந்துடுச்சு. save பண்ணட்டுமா?`,
      };
    }
    return {
      text: `${care}${e.customerName}, மொத்தம் ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} வந்துச்சு, ₹${r(e.pendingRupees)} பாக்கி. save பண்ணட்டுமா?`,
      speech: `${care}${e.customerName}, மொத்தம் ${r(e.totalRupees)} ரூபாய், ${r(e.paidRupees)} வந்துச்சு, ${r(e.pendingRupees)} பாக்கி. save பண்ணட்டுமா?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save ஆயிடுச்சு. ₹${r(pendingRupees)}-க்கு payment link அனுப்பட்டுமா?`,
    speech: `save ஆயிடுச்சு. ${r(pendingRupees)} ரூபாய்க்கு payment link அனுப்பட்டுமா?`,
  }),

  savedClosed: () => ({
    text: "save ஆயிடுச்சு. முழு பணமும் வந்துடுச்சு, கணக்கு முடிஞ்சது.",
    speech: "save ஆயிடுச்சு. முழு பணமும் வந்துடுச்சு, கணக்கு முடிஞ்சது.",
  }),

  entryRejected: () => ({
    text: "சரி, entry cancel பண்ணிட்டேன். மறுபடியும் சொல்லுங்க.",
    speech: "சரி, entry cancel பண்ணிட்டேன். மறுபடியும் சொல்லுங்க.",
  }),

  entryCorrected: (e, needsReview) => {
    const base = ta.entryReadback(e, needsReview);
    return { text: `சரி பண்ணிட்டேன். ${base.text}`, speech: `சரி பண்ணிட்டேன். ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName}-ஓட mobile number சொல்லுங்க.`,
    speech: `${customerName}-ஓட mobile number சொல்லுங்க.`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}. சரியா?`,
    speech: `${phoneForSpeech(phone)}. சரியா?`,
  }),

  phoneInvalid: () => ({
    text: "இந்த number சரியா தெரியல. 10 digit mobile number சொல்லுங்க.",
    speech: "இந்த number சரியா தெரியல. பத்து digit mobile number சொல்லுங்க.",
  }),

  phoneRetry: () => ({
    text: "சரி, number-ஐ மறுபடியும் சொல்லுங்க.",
    speech: "சரி, number-ஐ மறுபடியும் சொல்லுங்க.",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link அனுப்பிட்டேன். ${customerName}-க்கு ₹${r(amountRupees)} link SMS-ல போயிடுச்சு.`,
    speech: `link அனுப்பிட்டேன். ${customerName}-க்கு ${r(amountRupees)} ரூபாய் link SMS-ல போயிடுச்சு.`,
  }),

  collectDeclined: () => ({
    text: "சரி, link அனுப்பல. entry இன்னும் open-ஆ இருக்கு.",
    speech: "சரி, link அனுப்பல. entry இன்னும் open-ஆ இருக்கு.",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} ₹${r(amountRupees)} கொடுத்துட்டாங்க. கணக்கு முடிஞ்சது.`,
          speech: `${customerName} ${r(amountRupees)} ரூபாய் கொடுத்துட்டாங்க. கணக்கு முடிஞ்சது.`,
        }
      : {
          text: `${customerName} ₹${r(amountRupees)} கொடுத்தாங்க. இன்னும் ₹${r(pendingRupees)} பாக்கி.`,
          speech: `${customerName} ${r(amountRupees)} ரூபாய் கொடுத்தாங்க. இன்னும் ${r(pendingRupees)} ரூபாய் பாக்கி.`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} வந்திருக்கு, ${customerName}-ஓடதா?${over ? ` (பாக்கி ₹${r(pendingRupees)} தான் இருந்தது.)` : ""}`,
      speech: `${r(amountRupees)} ரூபாய் வந்திருக்கு, ${customerName}-ஓடதா?${over ? ` பாக்கி ${r(pendingRupees)} ரூபாய் தான் இருந்தது.` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)} QR payment வந்திருக்கு. எந்த open entry-யோடயும் match ஆகல.`,
    speech: `${r(amountRupees)} ரூபாய் QR payment வந்திருக்கு. எந்த open entry-யோடயும் match ஆகல.`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `சரி, ${customerName} கணக்குல சேர்த்துட்டேன். கணக்கு முடிஞ்சது.`,
          speech: `சரி, ${customerName} கணக்குல சேர்த்துட்டேன். கணக்கு முடிஞ்சது.`,
        }
      : {
          text: `சரி, ${customerName} கணக்குல சேர்த்துட்டேன். இன்னும் ₹${r(pendingRupees)} பாக்கி.`,
          speech: `சரி, ${customerName} கணக்குல சேர்த்துட்டேன். இன்னும் ${r(pendingRupees)} ரூபாய் பாக்கி.`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)} payment வந்திருக்கு, ஆனா அதோட entry ஏற்கனவே முடிஞ்சிடுச்சு. தனியா வச்சிருக்கேன்.`,
    speech: `${r(amountRupees)} ரூபாய் payment வந்திருக்கு, ஆனா அதோட entry ஏற்கனவே முடிஞ்சிடுச்சு. தனியா வச்சிருக்கேன்.`,
  }),

  linkFailed: () => ({
    text: "Paytm-ல link உருவாக்க முடியல. கொஞ்ச நேரம் கழிச்சு மறுபடியும் try பண்ணுங்க.",
    speech: "Paytm-ல link உருவாக்க முடியல. கொஞ்ச நேரம் கழிச்சு மறுபடியும் try பண்ணுங்க.",
  }),

  qrLeftUnmatched: () => ({
    text: "சரி, இந்த payment-ஐ தனியா வச்சிருக்கேன்.",
    speech: "சரி, இந்த payment-ஐ தனியா வச்சிருக்கேன்.",
  }),

  notUnderstoodYesNo: () => ({
    text: "மன்னிக்கணும், புரியல. ஆமா அல்லது இல்லைன்னு சொல்லுங்க.",
    speech: "மன்னிக்கணும், புரியல. ஆமா அல்லது இல்லைன்னு சொல்லுங்க.",
  }),

  notAnEntry: () => ({
    text: "மன்னிக்கணும், புரியல. இப்படி சொல்லுங்க: முருகன் அண்ணா 350 ரூபாய்க்கு சாமான் வாங்கினாரு, 200 கொடுத்தாரு, 150 பாக்கி.",
    speech: "மன்னிக்கணும், புரியல. இப்படி சொல்லுங்க: முருகன் அண்ணா 350 ரூபாய்க்கு சாமான் வாங்கினாரு, 200 கொடுத்தாரு, 150 பாக்கி.",
  }),

  amountsUnclear: () => ({
    text: "தொகை சரியா கேக்கல. இன்னொரு தடவை சொல்லுங்க.",
    speech: "தொகை சரியா கேக்கல. இன்னொரு தடவை சொல்லுங்க.",
  }),

  newCustomer: () => ({ text: "புது கணக்கு.", speech: "புது கணக்கு." }),

  sameCustomer: (spokenName, knownName) => ({
    text: `${spokenName}-உம் ${knownName}-உம் ஒரே ஆளா?`,
    speech: `${spokenName}-உம் ${knownName}-உம் ஒரே ஆளா?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName} entry அடுத்தது. முதல்ல இது:`,
    speech: `${nextCustomerName} entry அடுத்தது. முதல்ல இது:`,
  }),

  nextEntry: () => ({ text: "அடுத்த entry.", speech: "அடுத்த entry." }),

  unsaved: (customerNames) => ({
    text: `${customerNames} entry save ஆகல.`,
    speech: `${customerNames} entry save ஆகல.`,
  }),

  changeUnclear: () => ({ text: "என்ன மாத்தணும்னு புரியல.", speech: "என்ன மாத்தணும்னு புரியல." }),

  askName: () => ({ text: "யார் பேர்ல எழுதணும்?", speech: "யார் பேர்ல எழுதணும்?" }),

  askAmount: (customerName) => ({ text: `${customerName}, எவ்வளவு ரூபாய்?`, speech: `${customerName}, எவ்வளவு ரூபாய்?` }),

  repaymentReadback: (p, needsReview) => {
    const care = needsReview ? "ஒரு தடவை கவனமா கேளுங்க. " : "";
    if (p.changeRupees > 0) {
      const paid = p.amountRupees + p.changeRupees;
      return {
        text: `${care}${p.customerName} ₹${r(paid)} கொடுத்தாங்க, ஆனா கடன் ₹${r(p.owedRupees)} தான். கணக்கு முடிஞ்சிடும், ₹${r(p.changeRupees)} திருப்பி கொடுக்கணும். save பண்ணட்டுமா?`,
        speech: `${care}${p.customerName} ${r(paid)} ரூபாய் கொடுத்தாங்க, ஆனா கடன் ${r(p.owedRupees)} ரூபாய் தான். கணக்கு முடிஞ்சிடும், ${r(p.changeRupees)} ரூபாய் திருப்பி கொடுக்கணும். save பண்ணட்டுமா?`,
      };
    }
    if (p.leftRupees === 0) {
      return {
        text: `${care}${p.customerName} கிட்ட இருந்து முழுசா ₹${r(p.amountRupees)} வந்துச்சு. கணக்கு முடிஞ்சிடும். save பண்ணட்டுமா?`,
        speech: `${care}${p.customerName} கிட்ட இருந்து முழுசா ${r(p.amountRupees)} ரூபாய் வந்துச்சு. கணக்கு முடிஞ்சிடும். save பண்ணட்டுமா?`,
      };
    }
    return {
      text: `${care}${p.customerName} கிட்ட இருந்து ₹${r(p.amountRupees)} வந்துச்சு. ₹${r(p.owedRupees)} பாக்கி இருந்தது, இனி ₹${r(p.leftRupees)} பாக்கி. save பண்ணட்டுமா?`,
      speech: `${care}${p.customerName} கிட்ட இருந்து ${r(p.amountRupees)} ரூபாய் வந்துச்சு. ${r(p.owedRupees)} ரூபாய் பாக்கி இருந்தது, இனி ${r(p.leftRupees)} ரூபாய் பாக்கி. save பண்ணட்டுமா?`,
    };
  },

  repaymentCorrected: (p, needsReview) => {
    const base = ta.repaymentReadback(p, needsReview);
    return { text: `சரி பண்ணிட்டேன். ${base.text}`, speech: `சரி பண்ணிட்டேன். ${base.speech}` };
  },

  repaymentSaved: (customerName, leftRupees, changeRupees) => {
    if (leftRupees > 0) {
      return {
        text: `save ஆயிடுச்சு. ${customerName}-க்கு இன்னும் ₹${r(leftRupees)} பாக்கி.`,
        speech: `save ஆயிடுச்சு. ${customerName}-க்கு இன்னும் ${r(leftRupees)} ரூபாய் பாக்கி.`,
      };
    }
    const back = changeRupees > 0;
    return {
      text: `save ஆயிடுச்சு. ${customerName} கணக்கு முடிஞ்சது.${back ? ` ₹${r(changeRupees)} திருப்பி கொடுக்க மறக்காதீங்க.` : ""}`,
      speech: `save ஆயிடுச்சு. ${customerName} கணக்கு முடிஞ்சது.${back ? ` ${r(changeRupees)} ரூபாய் திருப்பி கொடுக்க மறக்காதீங்க.` : ""}`,
    };
  },

  linkStillOut: (customerName) => ({
    text: `${customerName} கிட்ட இனி payment link-ல கட்ட வேண்டாம்னு சொல்லிடுங்க.`,
    speech: `${customerName} கிட்ட இனி payment link-ல கட்ட வேண்டாம்னு சொல்லிடுங்க.`,
  }),

  qrSameMoney: (customerName, amountRupees) => ({
    text: `QR-ல ₹${r(amountRupees)} வந்திருக்கு, இன்னும் எந்த கணக்குலயும் சேர்க்கல. இது ${customerName} கொடுத்ததா?`,
    speech: `QR-ல ${r(amountRupees)} ரூபாய் வந்திருக்கு, இன்னும் எந்த கணக்குலயும் சேர்க்கல. இது ${customerName} கொடுத்ததா?`,
  }),

  noSuchCustomer: (customerName) => ({
    text: `${customerName} பேர்ல கணக்கு இல்ல.`,
    speech: `${customerName} பேர்ல கணக்கு இல்ல.`,
  }),

  nothingOwed: (customerName) => ({
    text: `${customerName}-க்கு பாக்கி எதுவும் இல்ல.`,
    speech: `${customerName}-க்கு பாக்கி எதுவும் இல்ல.`,
  }),

  customerOwes: (customerName, pendingRupees) => ({
    text: `${customerName}-க்கு ₹${r(pendingRupees)} பாக்கி.`,
    speech: `${customerName}-க்கு ${r(pendingRupees)} ரூபாய் பாக்கி.`,
  }),

  shopOwed: (pendingRupees, customers) => {
    const where = customers === 1 ? "ஒரே கணக்குல" : `${customers} கணக்குல`;
    return {
      text: `மொத்தம் ₹${r(pendingRupees)} பாக்கி, ${where}.`,
      speech: `மொத்தம் ${r(pendingRupees)} ரூபாய் பாக்கி, ${where}.`,
    };
  },

  nobodyOwes: () => ({ text: "இப்போ யாருக்கும் பாக்கி இல்ல.", speech: "இப்போ யாருக்கும் பாக்கி இல்ல." }),
};
