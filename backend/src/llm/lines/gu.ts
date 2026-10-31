/** Gujarati: Gujarati script on screen and for speech, with ₹ spoken as રૂપિયા. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const gu: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "એક વાર ધ્યાનથી સાંભળો. " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} ઉધાર. save કરું?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} રૂપિયા ઉધાર. save કરું?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)} નો સામાન, પૂરા ₹${r(e.paidRupees)} મળી ગયા. save કરું?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} રૂપિયાનો સામાન, પૂરા ${r(e.paidRupees)} રૂપિયા મળી ગયા. save કરું?`,
      };
    }
    return {
      text: `${care}${e.customerName}, કુલ ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} મળ્યા, ₹${r(e.pendingRupees)} બાકી. save કરું?`,
      speech: `${care}${e.customerName}, કુલ ${r(e.totalRupees)} રૂપિયા, ${r(e.paidRupees)} મળ્યા, ${r(e.pendingRupees)} બાકી. save કરું?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save થઈ ગયું. ₹${r(pendingRupees)} ની payment link મોકલું?`,
    speech: `save થઈ ગયું. ${r(pendingRupees)} રૂપિયાની payment link મોકલું?`,
  }),

  savedClosed: () => ({
    text: "save થઈ ગયું. પૂરું payment મળી ગયું, ખાતું બંધ.",
    speech: "save થઈ ગયું. પૂરું payment મળી ગયું, ખાતું બંધ.",
  }),

  entryRejected: () => ({
    text: "ઠીક છે, entry cancel. ફરીથી બોલો.",
    speech: "ઠીક છે, entry cancel. ફરીથી બોલો.",
  }),

  entryCorrected: (e, needsReview) => {
    const base = gu.entryReadback(e, needsReview);
    return { text: `સુધારી દીધું. ${base.text}`, speech: `સુધારી દીધું. ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName} નો mobile નંબર કહો.`,
    speech: `${customerName} નો mobile નંબર કહો.`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}. બરાબર છે?`,
    speech: `${phoneForSpeech(phone)}. બરાબર છે?`,
  }),

  phoneInvalid: () => ({
    text: "આ નંબર બરાબર નથી લાગતો. 10 આંકડાનો mobile નંબર બોલો.",
    speech: "આ નંબર બરાબર નથી લાગતો. દસ આંકડાનો mobile નંબર બોલો.",
  }),

  phoneRetry: () => ({
    text: "ઠીક છે, નંબર ફરીથી બોલો.",
    speech: "ઠીક છે, નંબર ફરીથી બોલો.",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link મોકલી દીધી. ${customerName} ને ₹${r(amountRupees)} ની link SMS થઈ ગઈ.`,
    speech: `link મોકલી દીધી. ${customerName} ને ${r(amountRupees)} રૂપિયાની link SMS થઈ ગઈ.`,
  }),

  collectDeclined: () => ({
    text: "ઠીક છે, link નથી મોકલી. entry ખુલ્લી છે.",
    speech: "ઠીક છે, link નથી મોકલી. entry ખુલ્લી છે.",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} એ ₹${r(amountRupees)} આપી દીધા. ખાતું બંધ.`,
          speech: `${customerName} એ ${r(amountRupees)} રૂપિયા આપી દીધા. ખાતું બંધ.`,
        }
      : {
          text: `${customerName} એ ₹${r(amountRupees)} આપ્યા. હવે ₹${r(pendingRupees)} બાકી.`,
          speech: `${customerName} એ ${r(amountRupees)} રૂપિયા આપ્યા. હવે ${r(pendingRupees)} રૂપિયા બાકી.`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} આવ્યા, ${customerName} ના?${over ? ` (બાકી ફક્ત ₹${r(pendingRupees)} હતા.)` : ""}`,
      speech: `${r(amountRupees)} રૂપિયા આવ્યા, ${customerName} ના?${over ? ` બાકી ફક્ત ${r(pendingRupees)} રૂપિયા હતા.` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)} નું QR payment આવ્યું. કોઈ ખુલ્લી entry સાથે મેળ ન ખાધો.`,
    speech: `${r(amountRupees)} રૂપિયાનું QR payment આવ્યું. કોઈ ખુલ્લી entry સાથે મેળ ન ખાધો.`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `ઠીક છે, ${customerName} ના ખાતામાં ઉમેરી દીધું. ખાતું બંધ.`,
          speech: `ઠીક છે, ${customerName} ના ખાતામાં ઉમેરી દીધું. ખાતું બંધ.`,
        }
      : {
          text: `ઠીક છે, ${customerName} ના ખાતામાં ઉમેરી દીધું. હવે ₹${r(pendingRupees)} બાકી.`,
          speech: `ઠીક છે, ${customerName} ના ખાતામાં ઉમેરી દીધું. હવે ${r(pendingRupees)} રૂપિયા બાકી.`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)} નું payment આવ્યું, પણ એની entry પહેલેથી બંધ છે. અલગ રાખી દીધું.`,
    speech: `${r(amountRupees)} રૂપિયાનું payment આવ્યું, પણ એની entry પહેલેથી બંધ છે. અલગ રાખી દીધું.`,
  }),

  linkFailed: () => ({
    text: "Paytm પરથી link ન બની શકી. થોડી વાર પછી ફરી પ્રયત્ન કરો.",
    speech: "Paytm પરથી link ન બની શકી. થોડી વાર પછી ફરી પ્રયત્ન કરો.",
  }),

  qrLeftUnmatched: () => ({
    text: "ઠીક છે, આ payment અલગ રાખી દીધું.",
    speech: "ઠીક છે, આ payment અલગ રાખી દીધું.",
  }),

  notUnderstoodYesNo: () => ({
    text: "માફ કરજો, સમજાયું નહીં. હા કે ના બોલો.",
    speech: "માફ કરજો, સમજાયું નહીં. હા કે ના બોલો.",
  }),

  notAnEntry: () => ({
    text: "માફ કરજો, સમજાયું નહીં. આમ બોલો: મહેતાભાઈએ 350 રૂપિયાનો સામાન લીધો, 200 આપ્યા, 150 બાકી.",
    speech: "માફ કરજો, સમજાયું નહીં. આમ બોલો: મહેતાભાઈએ 350 રૂપિયાનો સામાન લીધો, 200 આપ્યા, 150 બાકી.",
  }),

  amountsUnclear: () => ({
    text: "રકમ બરાબર સંભળાઈ નહીં. ફરી એક વાર બોલો.",
    speech: "રકમ બરાબર સંભળાઈ નહીં. ફરી એક વાર બોલો.",
  }),

  newCustomer: () => ({ text: "નવું ખાતું.", speech: "નવું ખાતું." }),

  sameCustomer: (spokenName, knownName) => ({
    text: `${spokenName} અને ${knownName} એક જ છે?`,
    speech: `${spokenName} અને ${knownName} એક જ છે?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName} ની entry પછી. પહેલાં આ:`,
    speech: `${nextCustomerName} ની entry પછી. પહેલાં આ:`,
  }),

  nextEntry: () => ({ text: "હવે આગલી entry.", speech: "હવે આગલી entry." }),

  unsaved: (customerNames) => ({
    text: `${customerNames} ની entry save નહોતી થઈ.`,
    speech: `${customerNames} ની entry save નહોતી થઈ.`,
  }),

  changeUnclear: () => ({ text: "શું બદલવું છે, સમજાયું નહીં.", speech: "શું બદલવું છે, સમજાયું નહીં." }),

  askName: () => ({ text: "કોના નામે લખું?", speech: "કોના નામે લખું?" }),

  askAmount: (customerName) => ({ text: `${customerName}, કેટલા રૂપિયા?`, speech: `${customerName}, કેટલા રૂપિયા?` }),

  repaymentReadback: (p, needsReview) => {
    const care = needsReview ? "એક વાર ધ્યાનથી સાંભળો. " : "";
    if (p.changeRupees > 0) {
      const paid = p.amountRupees + p.changeRupees;
      return {
        text: `${care}${p.customerName} એ ₹${r(paid)} આપ્યા, પણ ઉધાર ફક્ત ₹${r(p.owedRupees)} હતું. ખાતું બંધ થશે, ₹${r(p.changeRupees)} પાછા આપવાના છે. save કરું?`,
        speech: `${care}${p.customerName} એ ${r(paid)} રૂપિયા આપ્યા, પણ ઉધાર ફક્ત ${r(p.owedRupees)} રૂપિયા હતું. ખાતું બંધ થશે, ${r(p.changeRupees)} રૂપિયા પાછા આપવાના છે. save કરું?`,
      };
    }
    if (p.leftRupees === 0) {
      return {
        text: `${care}${p.customerName} પાસેથી પૂરા ₹${r(p.amountRupees)} મળ્યા. ખાતું બંધ થશે. save કરું?`,
        speech: `${care}${p.customerName} પાસેથી પૂરા ${r(p.amountRupees)} રૂપિયા મળ્યા. ખાતું બંધ થશે. save કરું?`,
      };
    }
    return {
      text: `${care}${p.customerName} પાસેથી ₹${r(p.amountRupees)} મળ્યા. ₹${r(p.owedRupees)} બાકી હતા, હવે ₹${r(p.leftRupees)} બાકી રહેશે. save કરું?`,
      speech: `${care}${p.customerName} પાસેથી ${r(p.amountRupees)} રૂપિયા મળ્યા. ${r(p.owedRupees)} રૂપિયા બાકી હતા, હવે ${r(p.leftRupees)} રૂપિયા બાકી રહેશે. save કરું?`,
    };
  },

  repaymentCorrected: (p, needsReview) => {
    const base = gu.repaymentReadback(p, needsReview);
    return { text: `સુધારી દીધું. ${base.text}`, speech: `સુધારી દીધું. ${base.speech}` };
  },

  repaymentSaved: (customerName, leftRupees, changeRupees) => {
    if (leftRupees > 0) {
      return {
        text: `save થઈ ગયું. ${customerName} ના હવે ₹${r(leftRupees)} બાકી.`,
        speech: `save થઈ ગયું. ${customerName} ના હવે ${r(leftRupees)} રૂપિયા બાકી.`,
      };
    }
    const back = changeRupees > 0;
    return {
      text: `save થઈ ગયું. ${customerName} નું ખાતું બંધ.${back ? ` ₹${r(changeRupees)} પાછા આપવાનું ભૂલશો નહીં.` : ""}`,
      speech: `save થઈ ગયું. ${customerName} નું ખાતું બંધ.${back ? ` ${r(changeRupees)} રૂપિયા પાછા આપવાનું ભૂલશો નહીં.` : ""}`,
    };
  },

  linkStillOut: (customerName) => ({
    text: `${customerName} ને કહી દો કે હવે payment link થી પૈસા ન ભરે.`,
    speech: `${customerName} ને કહી દો કે હવે payment link થી પૈસા ન ભરે.`,
  }),

  qrSameMoney: (customerName, amountRupees) => ({
    text: `QR પર ₹${r(amountRupees)} આવ્યા છે, હજી કોઈ ખાતામાં ઉમેર્યા નથી. શું આ ${customerName} ના જ છે?`,
    speech: `QR પર ${r(amountRupees)} રૂપિયા આવ્યા છે, હજી કોઈ ખાતામાં ઉમેર્યા નથી. શું આ ${customerName} ના જ છે?`,
  }),

  noSuchCustomer: (customerName) => ({
    text: `${customerName} નું કોઈ ખાતું મળ્યું નહીં.`,
    speech: `${customerName} નું કોઈ ખાતું મળ્યું નહીં.`,
  }),

  nothingOwed: (customerName) => ({
    text: `${customerName} નું કોઈ ઉધાર બાકી નથી.`,
    speech: `${customerName} નું કોઈ ઉધાર બાકી નથી.`,
  }),

  customerOwes: (customerName, pendingRupees) => ({
    text: `${customerName} ના ₹${r(pendingRupees)} બાકી છે.`,
    speech: `${customerName} ના ${r(pendingRupees)} રૂપિયા બાકી છે.`,
  }),

  shopOwed: (pendingRupees, customers) => {
    const where = customers === 1 ? "એક જ ખાતામાં" : `${customers} ખાતાઓમાં`;
    return {
      text: `કુલ ₹${r(pendingRupees)} બાકી, ${where}.`,
      speech: `કુલ ${r(pendingRupees)} રૂપિયા બાકી, ${where}.`,
    };
  },

  nobodyOwes: () => ({ text: "અત્યારે કોઈનું ઉધાર બાકી નથી.", speech: "અત્યારે કોઈનું ઉધાર બાકી નથી." }),
};
