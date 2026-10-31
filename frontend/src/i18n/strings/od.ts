import type { Strings } from './types';

/** Odia. Sarvam calls it od-IN, `Intl` knows it as `or`. */
export const od: Strings = {
  locale: 'or-IN',

  common: {
    yes: 'ହଁ',
    no: 'ନା',
    tryAgain: 'ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ',
  },

  tabs: {
    listen: 'କୁହନ୍ତୁ',
    qr: 'QR',
    ledger: 'ଖାତା',
    qrToMatch: (count) => `QR, ${count}ଟି payment ମିଳାଇବା ବାକି`,
  },

  listen: {
    hints: {
      IDLE: 'କିଏ କଣ ନେଲେ, ଆଉ କେତେ ଦେଲେ।',
      AWAITING_ENTRY_CONFIRM: 'ହଁ, ନା, କିମ୍ବା କଣ ବଦଳାଇବାକୁ ହେବ।',
      AWAITING_COLLECT_CHOICE: 'ହଁ କି ନା?',
      AWAITING_PHONE: 'ଦଶଟି ଯାକ ଅଙ୍କ କୁହନ୍ତୁ।',
      AWAITING_PHONE_CONFIRM: 'ହଁ କି ନା?',
      AWAITING_QR_MATCH: 'ହଁ କି ନା?',
    },
    listening: 'ଶୁଣୁଛି…',
    thinking: 'ଭାବୁଛି…',
    start: 'ଆକାଶକୁ ଛୁଇଁ କୁହନ୍ତୁ',
    example: '“ମହାନ୍ତି ବାବୁ 350 ଟଙ୍କାର ଜିନିଷ ନେଲେ, 200 UPI ରେ ଦେଲେ, 150 ବାକି”',
    sayYes: 'କିମ୍ବା ଆକାଶକୁ ଛୁଇଁ “ହଁ” କୁହନ୍ତୁ',
    sayNumber: 'ଆକାଶକୁ ଛୁଇଁ number କୁହନ୍ତୁ।',
    breakdown: (total, paid, pending) => `ମୋଟ ${total} · ଦେଲେ ${paid} · ବାକି ${pending}`,
    linkOffer: 'SMS ରେ Paytm payment link',
    linkOfferTo: (phone) => `${phone} କୁ SMS ରେ Paytm payment link`,
    linkSent: (phone) => `${phone} କୁ ପଠାଇଦେଲି। ଟଙ୍କା ଆସିଲେ entry ନିଜେ ବନ୍ଦ ହୋଇଯିବ।`,
    paidToQr: 'ଆପଣଙ୍କ ଦୋକାନ QR ରେ ଆସିଲା',
    save: 'ହଁ, save କରନ୍ତୁ',
    sendLink: 'link ପଠାନ୍ତୁ',
    notNow: 'ଏବେ ନୁହେଁ',
    skip: 'ଛାଡ଼ନ୍ତୁ',
    viewLedger: 'ଖାତାରେ ଦେଖନ୍ତୁ',
    speakEntry: 'ଗୋଟିଏ entry କୁହନ୍ତୁ',
    answerByVoice: 'କହି ଉତ୍ତର ଦିଅନ୍ତୁ',
    stopListening: 'ଶୁଣିବା ବନ୍ଦ କରନ୍ତୁ',
    changeLanguage: 'ଭାଷା ବଦଳାନ୍ତୁ',
  },

  notices: {
    micBlocked: {
      title: 'Pari କୁ microphone ଦରକାର',
      detail: 'settings ରେ ଅନୁମତି ଦିଅନ୍ତୁ, କିମ୍ବା button ରେ ଉତ୍ତର ଦିଅନ୍ତୁ।',
    },
    micFailed: { title: 'microphone ଚାଲୁ ହେଲା ନାହିଁ', detail: 'ପୁଣି ଚେଷ୍ଟା କରିବାକୁ ଆକାଶକୁ ଛୁଅନ୍ତୁ।' },
    nothingHeard: 'କିଛି ଶୁଭିଲା ନାହିଁ, ପୁଣି କୁହନ୍ତୁ।',
    offline: (apiUrl) => ({
      title: 'Pari ପାଖରେ ପହଞ୍ଚି ହେଉନାହିଁ',
      detail: `backend ${apiUrl} ରେ ଚାଲୁଛି କି ନାହିଁ ଦେଖନ୍ତୁ।`,
    }),
    cantHear: 'Pari ଏବେ ଶୁଣିପାରୁନାହିଁ',
    failed: { title: 'ତାହା ହେଲା ନାହିଁ', detail: 'ପୁଣି ଚେଷ୍ଟା କରିବାକୁ ଆକାଶକୁ ଛୁଅନ୍ତୁ।' },
  },

  qr: {
    overline: 'ଟଙ୍କା ନିଅନ୍ତୁ',
    title: 'scan କରି pay କରନ୍ତୁ',
    loadFailed: 'ଆପଣଙ୍କ QR load ହେଲା ନାହିଁ।',
    copy: 'ID copy କରନ୍ତୁ',
    copied: 'copy ହେଲା',
    share: 'share କରନ୍ତୁ',
    shareMessage: (shop, payload) => `Pyari Pari ରେ ${shop} କୁ pay କରନ୍ତୁ: ${payload}`,
    overLink: 'link ରେ ମଗାଯାଇଥିବାଠାରୁ ଅଧିକ',
    onQr: 'ଆପଣଙ୍କ QR ରେ',
    waiting: (count) => `ଆଉ ${count}ଟି ଅପେକ୍ଷାରେ`,
    ask: (amount, name) => `${amount} ଆସିଛି, ${name}-ଙ୍କର କି?`,
    askWhose: (amount) => `${amount} ଆସିଛି। କାହାର?`,
    noMatch: 'ଏହି payment କୌଣସି ଖୋଲା entry ସହ ମେଳ ଖାଉନାହିଁ।',
    staysPending: (left, pending) => `${pending} ବାକିରୁ ${left} ଆହୁରି ବାକି ରହିବ`,
    clears: (pending) => `${pending} ବାକି ପୂରା ସୁଝିଯିବ`,
    clearsWithExtra: (pending, extra) => `${pending} ବାକି ସୁଝିଯିବ, ${extra} ଅଧିକ ଆସିଛି`,
    okay: 'ଠିକ ଅଛି',
  },

  ledger: {
    title: 'ଖାତା',
    toCollect: 'ଆଦାୟ ବାକି',
    collectedToday: 'ଆଜି ଆସିଲା',
    openEntries: 'ଖୋଲା entry',
    filters: { all: 'ସବୁ', open: 'ଖୋଲା', closed: 'ବନ୍ଦ' },
    empty: {
      all: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି entry ନାହିଁ। “କୁହନ୍ତୁ” tab ରେ ଗୋଟିଏ କୁହନ୍ତୁ, confirm କଲେ ଏଠାରେ ଦେଖାଯିବ।',
      open: 'ଆଦାୟ କରିବାକୁ କିଛି ନାହିଁ। ସବୁ entry ବନ୍ଦ।',
      closed: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି entry ବନ୍ଦ ହୋଇନାହିଁ।',
    },
    loadFailed: 'ଖାତା load ହେଲା ନାହିଁ।',
    closedByLink: 'link ରେ ବନ୍ଦ',
    closedByQr: 'QR ରେ ବନ୍ଦ',
    paidInFull: 'ପୂରା ଟଙ୍କା ଦେଲେ',
    linkSent: 'link ଗଲା',
    paid: (amount) => `${amount} ଦେଲେ`,
    nothingPaid: 'ଏପର୍ଯ୍ୟନ୍ତ କିଛି ଦେଇନାହାନ୍ତି',
    pending: 'ବାକି',
    settled: 'ଦେଲେ',
    today: 'ଆଜି',
    yesterday: 'ଗତକାଲି',
  },

  language: {
    title: 'Pari ର ଭାଷା ବାଛନ୍ତୁ',
    note: 'Pari ଏହି ଭାଷାରେ ଶୁଣିବ ଆଉ ଉତ୍ତର ଦେବ। ପରେ “କୁହନ୍ତୁ” tab ରୁ ବଦଳାଇ ପାରିବେ।',
    failed: 'save ହେଲା ନାହିଁ। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।',
  },
};
