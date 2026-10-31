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
};
