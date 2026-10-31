/** Malayalam: Malayalam script on screen and for speech, with ₹ spoken as രൂപ. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const ml: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "ഒന്ന് ശ്രദ്ധിച്ച് കേൾക്കൂ. " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} കടം. save ചെയ്യട്ടെ?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} രൂപ കടം. save ചെയ്യട്ടെ?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)}-ന്റെ സാധനം, മുഴുവൻ ₹${r(e.paidRupees)} കിട്ടി. save ചെയ്യട്ടെ?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} രൂപയുടെ സാധനം, മുഴുവൻ ${r(e.paidRupees)} രൂപയും കിട്ടി. save ചെയ്യട്ടെ?`,
      };
    }
    return {
      text: `${care}${e.customerName}, ആകെ ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} കിട്ടി, ₹${r(e.pendingRupees)} ബാക്കി. save ചെയ്യട്ടെ?`,
      speech: `${care}${e.customerName}, ആകെ ${r(e.totalRupees)} രൂപ, ${r(e.paidRupees)} കിട്ടി, ${r(e.pendingRupees)} ബാക്കി. save ചെയ്യട്ടെ?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save ആയി. ₹${r(pendingRupees)}-ന്റെ payment link അയയ്ക്കട്ടെ?`,
    speech: `save ആയി. ${r(pendingRupees)} രൂപയുടെ payment link അയയ്ക്കട്ടെ?`,
  }),

  savedClosed: () => ({
    text: "save ആയി. മുഴുവൻ പണവും കിട്ടി, കണക്ക് തീർന്നു.",
    speech: "save ആയി. മുഴുവൻ പണവും കിട്ടി, കണക്ക് തീർന്നു.",
  }),

  entryRejected: () => ({
    text: "ശരി, entry cancel ചെയ്തു. ഒന്നുകൂടി പറയൂ.",
    speech: "ശരി, entry cancel ചെയ്തു. ഒന്നുകൂടി പറയൂ.",
  }),

  entryCorrected: (e, needsReview) => {
    const base = ml.entryReadback(e, needsReview);
    return { text: `ശരിയാക്കി. ${base.text}`, speech: `ശരിയാക്കി. ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName}-ന്റെ mobile number പറയൂ.`,
    speech: `${customerName}-ന്റെ mobile number പറയൂ.`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}. ശരിയാണോ?`,
    speech: `${phoneForSpeech(phone)}. ശരിയാണോ?`,
  }),

  phoneInvalid: () => ({
    text: "ഈ number ശരിയല്ലെന്ന് തോന്നുന്നു. 10 അക്ക mobile number പറയൂ.",
    speech: "ഈ number ശരിയല്ലെന്ന് തോന്നുന്നു. പത്ത് അക്ക mobile number പറയൂ.",
  }),

  phoneRetry: () => ({
    text: "ശരി, number ഒന്നുകൂടി പറയൂ.",
    speech: "ശരി, number ഒന്നുകൂടി പറയൂ.",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link അയച്ചു. ${customerName}-ന് ₹${r(amountRupees)}-ന്റെ link SMS ആയി പോയി.`,
    speech: `link അയച്ചു. ${customerName}-ന് ${r(amountRupees)} രൂപയുടെ link SMS ആയി പോയി.`,
  }),

  collectDeclined: () => ({
    text: "ശരി, link അയച്ചില്ല. entry ഇപ്പോഴും open ആണ്.",
    speech: "ശരി, link അയച്ചില്ല. entry ഇപ്പോഴും open ആണ്.",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} ₹${r(amountRupees)} തന്നു. കണക്ക് തീർന്നു.`,
          speech: `${customerName} ${r(amountRupees)} രൂപ തന്നു. കണക്ക് തീർന്നു.`,
        }
      : {
          text: `${customerName} ₹${r(amountRupees)} തന്നു. ഇനി ₹${r(pendingRupees)} ബാക്കി.`,
          speech: `${customerName} ${r(amountRupees)} രൂപ തന്നു. ഇനി ${r(pendingRupees)} രൂപ ബാക്കി.`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} വന്നു, ${customerName}-ന്റേതാണോ?${over ? ` (ബാക്കി ₹${r(pendingRupees)} മാത്രമേ ഉണ്ടായിരുന്നുള്ളൂ.)` : ""}`,
      speech: `${r(amountRupees)} രൂപ വന്നു, ${customerName}-ന്റേതാണോ?${over ? ` ബാക്കി ${r(pendingRupees)} രൂപ മാത്രമേ ഉണ്ടായിരുന്നുള്ളൂ.` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)}-ന്റെ QR payment വന്നു. ഒരു open entry-യുമായും match ആയില്ല.`,
    speech: `${r(amountRupees)} രൂപയുടെ QR payment വന്നു. ഒരു open entry-യുമായും match ആയില്ല.`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `ശരി, ${customerName}-ന്റെ കണക്കിൽ ചേർത്തു. കണക്ക് തീർന്നു.`,
          speech: `ശരി, ${customerName}-ന്റെ കണക്കിൽ ചേർത്തു. കണക്ക് തീർന്നു.`,
        }
      : {
          text: `ശരി, ${customerName}-ന്റെ കണക്കിൽ ചേർത്തു. ഇനി ₹${r(pendingRupees)} ബാക്കി.`,
          speech: `ശരി, ${customerName}-ന്റെ കണക്കിൽ ചേർത്തു. ഇനി ${r(pendingRupees)} രൂപ ബാക്കി.`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)}-ന്റെ payment വന്നു, പക്ഷേ അതിന്റെ entry നേരത്തേ തീർന്നതാണ്. മാറ്റിവെച്ചു.`,
    speech: `${r(amountRupees)} രൂപയുടെ payment വന്നു, പക്ഷേ അതിന്റെ entry നേരത്തേ തീർന്നതാണ്. മാറ്റിവെച്ചു.`,
  }),

  linkFailed: () => ({
    text: "Paytm-ൽ link ഉണ്ടാക്കാൻ പറ്റിയില്ല. കുറച്ചു കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ.",
    speech: "Paytm-ൽ link ഉണ്ടാക്കാൻ പറ്റിയില്ല. കുറച്ചു കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ.",
  }),

  qrLeftUnmatched: () => ({
    text: "ശരി, ഈ payment മാറ്റിവെച്ചു.",
    speech: "ശരി, ഈ payment മാറ്റിവെച്ചു.",
  }),

  notUnderstoodYesNo: () => ({
    text: "ക്ഷമിക്കണം, മനസ്സിലായില്ല. അതെ അല്ലെങ്കിൽ ഇല്ല എന്ന് പറയൂ.",
    speech: "ക്ഷമിക്കണം, മനസ്സിലായില്ല. അതെ അല്ലെങ്കിൽ ഇല്ല എന്ന് പറയൂ.",
  }),

  notAnEntry: () => ({
    text: "ക്ഷമിക്കണം, മനസ്സിലായില്ല. ഇങ്ങനെ പറയൂ: രാജൻ ചേട്ടൻ 350 രൂപയുടെ സാധനം വാങ്ങി, 200 തന്നു, 150 ബാക്കി.",
    speech: "ക്ഷമിക്കണം, മനസ്സിലായില്ല. ഇങ്ങനെ പറയൂ: രാജൻ ചേട്ടൻ 350 രൂപയുടെ സാധനം വാങ്ങി, 200 തന്നു, 150 ബാക്കി.",
  }),

  amountsUnclear: () => ({
    text: "തുക വ്യക്തമായി കേട്ടില്ല. ഒന്നുകൂടി പറയൂ.",
    speech: "തുക വ്യക്തമായി കേട്ടില്ല. ഒന്നുകൂടി പറയൂ.",
  }),

  newCustomer: () => ({ text: "പുതിയ കണക്ക്.", speech: "പുതിയ കണക്ക്." }),

  sameCustomer: (spokenName, knownName) => ({
    text: `${spokenName}-ഉം ${knownName}-ഉം ഒരാൾ തന്നെയാണോ?`,
    speech: `${spokenName}-ഉം ${knownName}-ഉം ഒരാൾ തന്നെയാണോ?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName}-ന്റെ entry അടുത്തത്. ആദ്യം ഇത്:`,
    speech: `${nextCustomerName}-ന്റെ entry അടുത്തത്. ആദ്യം ഇത്:`,
  }),

  nextEntry: () => ({ text: "ഇനി അടുത്ത entry.", speech: "ഇനി അടുത്ത entry." }),

  unsaved: (customerNames) => ({
    text: `${customerNames}-ന്റെ entry save ആയിരുന്നില്ല.`,
    speech: `${customerNames}-ന്റെ entry save ആയിരുന്നില്ല.`,
  }),

  changeUnclear: () => ({ text: "എന്ത് മാറ്റണമെന്ന് മനസ്സിലായില്ല.", speech: "എന്ത് മാറ്റണമെന്ന് മനസ്സിലായില്ല." }),

  askName: () => ({ text: "ആരുടെ പേരിൽ എഴുതണം?", speech: "ആരുടെ പേരിൽ എഴുതണം?" }),

  askAmount: (customerName) => ({ text: `${customerName}, എത്ര രൂപ?`, speech: `${customerName}, എത്ര രൂപ?` }),

  repaymentReadback: (p, needsReview) => {
    const care = needsReview ? "ഒന്ന് ശ്രദ്ധിച്ച് കേൾക്കൂ. " : "";
    if (p.changeRupees > 0) {
      const paid = p.amountRupees + p.changeRupees;
      return {
        text: `${care}${p.customerName} ₹${r(paid)} തന്നു, പക്ഷേ കടം ₹${r(p.owedRupees)} മാത്രമായിരുന്നു. കണക്ക് തീരും, ₹${r(p.changeRupees)} തിരിച്ചു കൊടുക്കണം. save ചെയ്യട്ടെ?`,
        speech: `${care}${p.customerName} ${r(paid)} രൂപ തന്നു, പക്ഷേ കടം ${r(p.owedRupees)} രൂപ മാത്രമായിരുന്നു. കണക്ക് തീരും, ${r(p.changeRupees)} രൂപ തിരിച്ചു കൊടുക്കണം. save ചെയ്യട്ടെ?`,
      };
    }
    if (p.leftRupees === 0) {
      return {
        text: `${care}${p.customerName}-ൽ നിന്ന് മുഴുവൻ ₹${r(p.amountRupees)} കിട്ടി. കണക്ക് തീരും. save ചെയ്യട്ടെ?`,
        speech: `${care}${p.customerName}-ൽ നിന്ന് മുഴുവൻ ${r(p.amountRupees)} രൂപ കിട്ടി. കണക്ക് തീരും. save ചെയ്യട്ടെ?`,
      };
    }
    return {
      text: `${care}${p.customerName}-ൽ നിന്ന് ₹${r(p.amountRupees)} കിട്ടി. ₹${r(p.owedRupees)} ബാക്കിയുണ്ടായിരുന്നു, ഇനി ₹${r(p.leftRupees)} ബാക്കി. save ചെയ്യട്ടെ?`,
      speech: `${care}${p.customerName}-ൽ നിന്ന് ${r(p.amountRupees)} രൂപ കിട്ടി. ${r(p.owedRupees)} രൂപ ബാക്കിയുണ്ടായിരുന്നു, ഇനി ${r(p.leftRupees)} രൂപ ബാക്കി. save ചെയ്യട്ടെ?`,
    };
  },

  repaymentCorrected: (p, needsReview) => {
    const base = ml.repaymentReadback(p, needsReview);
    return { text: `ശരിയാക്കി. ${base.text}`, speech: `ശരിയാക്കി. ${base.speech}` };
  },

  repaymentSaved: (customerName, leftRupees, changeRupees) => {
    if (leftRupees > 0) {
      return {
        text: `save ആയി. ${customerName}-ന് ഇനി ₹${r(leftRupees)} ബാക്കി.`,
        speech: `save ആയി. ${customerName}-ന് ഇനി ${r(leftRupees)} രൂപ ബാക്കി.`,
      };
    }
    const back = changeRupees > 0;
    return {
      text: `save ആയി. ${customerName}-ന്റെ കണക്ക് തീർന്നു.${back ? ` ₹${r(changeRupees)} തിരിച്ചു കൊടുക്കാൻ മറക്കല്ലേ.` : ""}`,
      speech: `save ആയി. ${customerName}-ന്റെ കണക്ക് തീർന്നു.${back ? ` ${r(changeRupees)} രൂപ തിരിച്ചു കൊടുക്കാൻ മറക്കല്ലേ.` : ""}`,
    };
  },

  linkStillOut: (customerName) => ({
    text: `${customerName}-നോട് ഇനി payment link-ൽ അടയ്ക്കേണ്ടെന്ന് പറയൂ.`,
    speech: `${customerName}-നോട് ഇനി payment link-ൽ അടയ്ക്കേണ്ടെന്ന് പറയൂ.`,
  }),

  qrSameMoney: (customerName, amountRupees) => ({
    text: `QR-ൽ ₹${r(amountRupees)} വന്നിട്ടുണ്ട്, ഇതുവരെ ഒരു കണക്കിലും ചേർത്തിട്ടില്ല. ഇത് ${customerName} തന്നതാണോ?`,
    speech: `QR-ൽ ${r(amountRupees)} രൂപ വന്നിട്ടുണ്ട്, ഇതുവരെ ഒരു കണക്കിലും ചേർത്തിട്ടില്ല. ഇത് ${customerName} തന്നതാണോ?`,
  }),

  noSuchCustomer: (customerName) => ({
    text: `${customerName}-ന്റെ പേരിൽ കണക്കില്ല.`,
    speech: `${customerName}-ന്റെ പേരിൽ കണക്കില്ല.`,
  }),

  nothingOwed: (customerName) => ({
    text: `${customerName}-ന് ബാക്കിയൊന്നുമില്ല.`,
    speech: `${customerName}-ന് ബാക്കിയൊന്നുമില്ല.`,
  }),

  customerOwes: (customerName, pendingRupees) => ({
    text: `${customerName}-ന് ₹${r(pendingRupees)} ബാക്കിയുണ്ട്.`,
    speech: `${customerName}-ന് ${r(pendingRupees)} രൂപ ബാക്കിയുണ്ട്.`,
  }),

  shopOwed: (pendingRupees, customers) => {
    const where = customers === 1 ? "ഒരു കണക്കിൽ" : `${customers} കണക്കുകളിലായി`;
    return {
      text: `ആകെ ₹${r(pendingRupees)} ബാക്കി, ${where}.`,
      speech: `ആകെ ${r(pendingRupees)} രൂപ ബാക്കി, ${where}.`,
    };
  },

  nobodyOwes: () => ({ text: "ഇപ്പോൾ ആർക്കും ബാക്കിയില്ല.", speech: "ഇപ്പോൾ ആർക്കും ബാക്കിയില്ല." }),
};
