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
};
