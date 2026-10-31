/** Odia: Odia script on screen and for speech, with ₹ spoken as ଟଙ୍କା. */
import { type LineBook, phoneForDisplay, phoneForSpeech, r } from "./book.js";

export const od: LineBook = {
  entryReadback: (e, needsReview) => {
    const care = needsReview ? "ଥରେ ଧ୍ୟାନ ଦେଇ ଶୁଣନ୍ତୁ। " : "";
    if (e.paidRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.pendingRupees)} ଉଧାର। save କରିବି?`,
        speech: `${care}${e.customerName}, ${r(e.pendingRupees)} ଟଙ୍କା ଉଧାର। save କରିବି?`,
      };
    }
    if (e.pendingRupees === 0) {
      return {
        text: `${care}${e.customerName}, ₹${r(e.totalRupees)}ର ଜିନିଷ, ପୂରା ₹${r(e.paidRupees)} ମିଳିଗଲା। save କରିବି?`,
        speech: `${care}${e.customerName}, ${r(e.totalRupees)} ଟଙ୍କାର ଜିନିଷ, ପୂରା ${r(e.paidRupees)} ଟଙ୍କା ମିଳିଗଲା। save କରିବି?`,
      };
    }
    return {
      text: `${care}${e.customerName}, ମୋଟ ₹${r(e.totalRupees)}, ₹${r(e.paidRupees)} ମିଳିଲା, ₹${r(e.pendingRupees)} ବାକି। save କରିବି?`,
      speech: `${care}${e.customerName}, ମୋଟ ${r(e.totalRupees)} ଟଙ୍କା, ${r(e.paidRupees)} ମିଳିଲା, ${r(e.pendingRupees)} ବାକି। save କରିବି?`,
    };
  },

  savedAskCollect: (pendingRupees) => ({
    text: `save ହୋଇଗଲା। ₹${r(pendingRupees)}ର payment link ପଠାଇବି?`,
    speech: `save ହୋଇଗଲା। ${r(pendingRupees)} ଟଙ୍କାର payment link ପଠାଇବି?`,
  }),

  savedClosed: () => ({
    text: "save ହୋଇଗଲା। ପୂରା payment ମିଳିଗଲା, ଖାତା ବନ୍ଦ।",
    speech: "save ହୋଇଗଲା। ପୂରା payment ମିଳିଗଲା, ଖାତା ବନ୍ଦ।",
  }),

  entryRejected: () => ({
    text: "ଠିକ ଅଛି, entry cancel। ପୁଣି କୁହନ୍ତୁ।",
    speech: "ଠିକ ଅଛି, entry cancel। ପୁଣି କୁହନ୍ତୁ।",
  }),

  entryCorrected: (e, needsReview) => {
    const base = od.entryReadback(e, needsReview);
    return { text: `ଠିକ କରିଦେଲି। ${base.text}`, speech: `ଠିକ କରିଦେଲି। ${base.speech}` };
  },

  askPhone: (customerName) => ({
    text: `${customerName}-ଙ୍କ mobile ନମ୍ବର କୁହନ୍ତୁ।`,
    speech: `${customerName}-ଙ୍କ mobile ନମ୍ବର କୁହନ୍ତୁ।`,
  }),

  phoneReadback: (phone) => ({
    text: `${phoneForDisplay(phone)}। ଠିକ ଅଛି?`,
    speech: `${phoneForSpeech(phone)}। ଠିକ ଅଛି?`,
  }),

  phoneInvalid: () => ({
    text: "ଏହି ନମ୍ବର ଠିକ ଲାଗୁନାହିଁ। 10 ଅଙ୍କର mobile ନମ୍ବର କୁହନ୍ତୁ।",
    speech: "ଏହି ନମ୍ବର ଠିକ ଲାଗୁନାହିଁ। ଦଶ ଅଙ୍କର mobile ନମ୍ବର କୁହନ୍ତୁ।",
  }),

  phoneRetry: () => ({
    text: "ଠିକ ଅଛି, ନମ୍ବର ପୁଣି କୁହନ୍ତୁ।",
    speech: "ଠିକ ଅଛି, ନମ୍ବର ପୁଣି କୁହନ୍ତୁ।",
  }),

  linkSent: (customerName, amountRupees) => ({
    text: `link ପଠାଇଦେଲି। ${customerName}-ଙ୍କୁ ₹${r(amountRupees)}ର link SMS ହୋଇଗଲା।`,
    speech: `link ପଠାଇଦେଲି। ${customerName}-ଙ୍କୁ ${r(amountRupees)} ଟଙ୍କାର link SMS ହୋଇଗଲା।`,
  }),

  collectDeclined: () => ({
    text: "ଠିକ ଅଛି, link ପଠାଇଲି ନାହିଁ। entry ଖୋଲା ଅଛି।",
    speech: "ଠିକ ଅଛି, link ପଠାଇଲି ନାହିଁ। entry ଖୋଲା ଅଛି।",
  }),

  linkPaid: (customerName, amountRupees, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `${customerName} ₹${r(amountRupees)} ଦେଇଦେଲେ। ଖାତା ବନ୍ଦ।`,
          speech: `${customerName} ${r(amountRupees)} ଟଙ୍କା ଦେଇଦେଲେ। ଖାତା ବନ୍ଦ।`,
        }
      : {
          text: `${customerName} ₹${r(amountRupees)} ଦେଲେ। ଏବେ ₹${r(pendingRupees)} ବାକି।`,
          speech: `${customerName} ${r(amountRupees)} ଟଙ୍କା ଦେଲେ। ଏବେ ${r(pendingRupees)} ଟଙ୍କା ବାକି।`,
        },

  qrAsk: (amountRupees, customerName, pendingRupees) => {
    const over = amountRupees > pendingRupees;
    return {
      text: `₹${r(amountRupees)} ଆସିଛି, ${customerName}-ଙ୍କର କି?${over ? ` (ବାକି କେବଳ ₹${r(pendingRupees)} ଥିଲା।)` : ""}`,
      speech: `${r(amountRupees)} ଟଙ୍କା ଆସିଛି, ${customerName}-ଙ୍କର କି?${over ? ` ବାକି କେବଳ ${r(pendingRupees)} ଟଙ୍କା ଥିଲା।` : ""}`,
    };
  },

  qrNoCandidate: (amountRupees) => ({
    text: `₹${r(amountRupees)}ର QR payment ଆସିଛି। କୌଣସି ଖୋଲା entry ସହ ମେଳ ହେଲା ନାହିଁ।`,
    speech: `${r(amountRupees)} ଟଙ୍କାର QR payment ଆସିଛି। କୌଣସି ଖୋଲା entry ସହ ମେଳ ହେଲା ନାହିଁ।`,
  }),

  qrMatched: (customerName, pendingRupees) =>
    pendingRupees === 0
      ? {
          text: `ଠିକ ଅଛି, ${customerName}-ଙ୍କ ଖାତାରେ ଯୋଡ଼ିଦେଲି। ଖାତା ବନ୍ଦ।`,
          speech: `ଠିକ ଅଛି, ${customerName}-ଙ୍କ ଖାତାରେ ଯୋଡ଼ିଦେଲି। ଖାତା ବନ୍ଦ।`,
        }
      : {
          text: `ଠିକ ଅଛି, ${customerName}-ଙ୍କ ଖାତାରେ ଯୋଡ଼ିଦେଲି। ଏବେ ₹${r(pendingRupees)} ବାକି।`,
          speech: `ଠିକ ଅଛି, ${customerName}-ଙ୍କ ଖାତାରେ ଯୋଡ଼ିଦେଲି। ଏବେ ${r(pendingRupees)} ଟଙ୍କା ବାକି।`,
        },

  paymentUnmatched: (amountRupees) => ({
    text: `₹${r(amountRupees)}ର payment ଆସିଛି, କିନ୍ତୁ ତାହାର entry ଆଗରୁ ବନ୍ଦ ହୋଇସାରିଛି। ଅଲଗା କରି ରଖିଲି।`,
    speech: `${r(amountRupees)} ଟଙ୍କାର payment ଆସିଛି, କିନ୍ତୁ ତାହାର entry ଆଗରୁ ବନ୍ଦ ହୋଇସାରିଛି। ଅଲଗା କରି ରଖିଲି।`,
  }),

  linkFailed: () => ({
    text: "Paytm ରୁ link ତିଆରି ହୋଇପାରିଲା ନାହିଁ। ଟିକେ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    speech: "Paytm ରୁ link ତିଆରି ହୋଇପାରିଲା ନାହିଁ। ଟିକେ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
  }),

  qrLeftUnmatched: () => ({
    text: "ଠିକ ଅଛି, ଏହି payment ଅଲଗା କରି ରଖିଲି।",
    speech: "ଠିକ ଅଛି, ଏହି payment ଅଲଗା କରି ରଖିଲି।",
  }),

  notUnderstoodYesNo: () => ({
    text: "କ୍ଷମା କରିବେ, ବୁଝିପାରିଲି ନାହିଁ। ହଁ କିମ୍ବା ନା କୁହନ୍ତୁ।",
    speech: "କ୍ଷମା କରିବେ, ବୁଝିପାରିଲି ନାହିଁ। ହଁ କିମ୍ବା ନା କୁହନ୍ତୁ।",
  }),

  notAnEntry: () => ({
    text: "କ୍ଷମା କରିବେ, ବୁଝିପାରିଲି ନାହିଁ। ଏମିତି କୁହନ୍ତୁ: ମହାନ୍ତି ବାବୁ 350 ଟଙ୍କାର ଜିନିଷ ନେଲେ, 200 ଦେଲେ, 150 ବାକି।",
    speech: "କ୍ଷମା କରିବେ, ବୁଝିପାରିଲି ନାହିଁ। ଏମିତି କୁହନ୍ତୁ: ମହାନ୍ତି ବାବୁ 350 ଟଙ୍କାର ଜିନିଷ ନେଲେ, 200 ଦେଲେ, 150 ବାକି।",
  }),

  amountsUnclear: () => ({
    text: "ଟଙ୍କା ପରିମାଣ ସଫା ଶୁଣାଗଲା ନାହିଁ। ଆଉ ଥରେ କୁହନ୍ତୁ।",
    speech: "ଟଙ୍କା ପରିମାଣ ସଫା ଶୁଣାଗଲା ନାହିଁ। ଆଉ ଥରେ କୁହନ୍ତୁ।",
  }),

  newCustomer: () => ({ text: "ନୂଆ ଖାତା।", speech: "ନୂଆ ଖାତା।" }),

  sameCustomer: (spokenName, knownName) => ({
    text: `${spokenName} ଓ ${knownName} ଏକା ଲୋକ କି?`,
    speech: `${spokenName} ଓ ${knownName} ଏକା ଲୋକ କି?`,
  }),

  pendingFirst: (nextCustomerName) => ({
    text: `${nextCustomerName}-ଙ୍କ entry ଏହା ପରେ। ପ୍ରଥମେ ଏହା:`,
    speech: `${nextCustomerName}-ଙ୍କ entry ଏହା ପରେ। ପ୍ରଥମେ ଏହା:`,
  }),

  nextEntry: () => ({ text: "ଏବେ ପରବର୍ତ୍ତୀ entry।", speech: "ଏବେ ପରବର୍ତ୍ତୀ entry।" }),

  unsaved: (customerNames) => ({
    text: `${customerNames}-ଙ୍କ entry save ହୋଇନଥିଲା।`,
    speech: `${customerNames}-ଙ୍କ entry save ହୋଇନଥିଲା।`,
  }),

  changeUnclear: () => ({ text: "କଣ ବଦଳାଇବାକୁ ହେବ, ବୁଝିପାରିଲି ନାହିଁ।", speech: "କଣ ବଦଳାଇବାକୁ ହେବ, ବୁଝିପାରିଲି ନାହିଁ।" }),

  askName: () => ({ text: "କାହା ନାଁରେ ଲେଖିବି?", speech: "କାହା ନାଁରେ ଲେଖିବି?" }),

  askAmount: (customerName) => ({ text: `${customerName}, କେତେ ଟଙ୍କା?`, speech: `${customerName}, କେତେ ଟଙ୍କା?` }),

  repaymentReadback: (p, needsReview) => {
    const care = needsReview ? "ଥରେ ଧ୍ୟାନ ଦେଇ ଶୁଣନ୍ତୁ। " : "";
    if (p.changeRupees > 0) {
      const paid = p.amountRupees + p.changeRupees;
      return {
        text: `${care}${p.customerName} ₹${r(paid)} ଦେଲେ, କିନ୍ତୁ ଉଧାର କେବଳ ₹${r(p.owedRupees)} ଥିଲା। ଖାତା ବନ୍ଦ ହେବ, ₹${r(p.changeRupees)} ଫେରାଇବାକୁ ହେବ। save କରିବି?`,
        speech: `${care}${p.customerName} ${r(paid)} ଟଙ୍କା ଦେଲେ, କିନ୍ତୁ ଉଧାର କେବଳ ${r(p.owedRupees)} ଟଙ୍କା ଥିଲା। ଖାତା ବନ୍ଦ ହେବ, ${r(p.changeRupees)} ଟଙ୍କା ଫେରାଇବାକୁ ହେବ। save କରିବି?`,
      };
    }
    if (p.leftRupees === 0) {
      return {
        text: `${care}${p.customerName}-ଙ୍କଠାରୁ ପୂରା ₹${r(p.amountRupees)} ମିଳିଲା। ଖାତା ବନ୍ଦ ହେବ। save କରିବି?`,
        speech: `${care}${p.customerName}-ଙ୍କଠାରୁ ପୂରା ${r(p.amountRupees)} ଟଙ୍କା ମିଳିଲା। ଖାତା ବନ୍ଦ ହେବ। save କରିବି?`,
      };
    }
    return {
      text: `${care}${p.customerName}-ଙ୍କଠାରୁ ₹${r(p.amountRupees)} ମିଳିଲା। ₹${r(p.owedRupees)} ବାକି ଥିଲା, ଏବେ ₹${r(p.leftRupees)} ବାକି ରହିବ। save କରିବି?`,
      speech: `${care}${p.customerName}-ଙ୍କଠାରୁ ${r(p.amountRupees)} ଟଙ୍କା ମିଳିଲା। ${r(p.owedRupees)} ଟଙ୍କା ବାକି ଥିଲା, ଏବେ ${r(p.leftRupees)} ଟଙ୍କା ବାକି ରହିବ। save କରିବି?`,
    };
  },

  repaymentCorrected: (p, needsReview) => {
    const base = od.repaymentReadback(p, needsReview);
    return { text: `ଠିକ କରିଦେଲି। ${base.text}`, speech: `ଠିକ କରିଦେଲି। ${base.speech}` };
  },

  repaymentSaved: (customerName, leftRupees, changeRupees) => {
    if (leftRupees > 0) {
      return {
        text: `save ହୋଇଗଲା। ${customerName}-ଙ୍କର ଏବେ ₹${r(leftRupees)} ବାକି।`,
        speech: `save ହୋଇଗଲା। ${customerName}-ଙ୍କର ଏବେ ${r(leftRupees)} ଟଙ୍କା ବାକି।`,
      };
    }
    const back = changeRupees > 0;
    return {
      text: `save ହୋଇଗଲା। ${customerName}-ଙ୍କ ଖାତା ବନ୍ଦ।${back ? ` ₹${r(changeRupees)} ଫେରାଇବାକୁ ଭୁଲନ୍ତୁ ନାହିଁ।` : ""}`,
      speech: `save ହୋଇଗଲା। ${customerName}-ଙ୍କ ଖାତା ବନ୍ଦ।${back ? ` ${r(changeRupees)} ଟଙ୍କା ଫେରାଇବାକୁ ଭୁଲନ୍ତୁ ନାହିଁ।` : ""}`,
    };
  },

  linkStillOut: (customerName) => ({
    text: `${customerName}-ଙ୍କୁ କହିଦିଅନ୍ତୁ, ଏବେ payment link ରେ ଟଙ୍କା ନ ଦେବାକୁ।`,
    speech: `${customerName}-ଙ୍କୁ କହିଦିଅନ୍ତୁ, ଏବେ payment link ରେ ଟଙ୍କା ନ ଦେବାକୁ।`,
  }),

  qrSameMoney: (customerName, amountRupees) => ({
    text: `QR ରେ ₹${r(amountRupees)} ଆସିଛି, ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଖାତାରେ ଯୋଡ଼ା ହୋଇନାହିଁ। ଏହା କି ${customerName}-ଙ୍କ ଟଙ୍କା?`,
    speech: `QR ରେ ${r(amountRupees)} ଟଙ୍କା ଆସିଛି, ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଖାତାରେ ଯୋଡ଼ା ହୋଇନାହିଁ। ଏହା କି ${customerName}-ଙ୍କ ଟଙ୍କା?`,
  }),

  noSuchCustomer: (customerName) => ({
    text: `${customerName}-ଙ୍କ ନାଁରେ କୌଣସି ଖାତା ମିଳିଲା ନାହିଁ।`,
    speech: `${customerName}-ଙ୍କ ନାଁରେ କୌଣସି ଖାତା ମିଳିଲା ନାହିଁ।`,
  }),

  nothingOwed: (customerName) => ({
    text: `${customerName}-ଙ୍କର କିଛି ଉଧାର ବାକି ନାହିଁ।`,
    speech: `${customerName}-ଙ୍କର କିଛି ଉଧାର ବାକି ନାହିଁ।`,
  }),

  customerOwes: (customerName, pendingRupees) => ({
    text: `${customerName}-ଙ୍କର ₹${r(pendingRupees)} ବାକି ଅଛି।`,
    speech: `${customerName}-ଙ୍କର ${r(pendingRupees)} ଟଙ୍କା ବାକି ଅଛି।`,
  }),

  shopOwed: (pendingRupees, customers) => {
    const where = customers === 1 ? "ଗୋଟିଏ ଖାତାରେ" : `${customers}ଟି ଖାତାରେ`;
    return {
      text: `ମୋଟ ₹${r(pendingRupees)} ବାକି, ${where}।`,
      speech: `ମୋଟ ${r(pendingRupees)} ଟଙ୍କା ବାକି, ${where}।`,
    };
  },

  nobodyOwes: () => ({ text: "ଏବେ କାହାରି ଉଧାର ବାକି ନାହିଁ।", speech: "ଏବେ କାହାରି ଉଧାର ବାକି ନାହିଁ।" }),
};
