import type { Strings } from './types';

export const te: Strings = {
  locale: 'te-IN',

  common: {
    yes: 'అవును',
    no: 'కాదు',
    tryAgain: 'మళ్ళీ ప్రయత్నించండి',
  },

  tabs: {
    listen: 'మాట్లాడండి',
    qr: 'QR',
    ledger: 'ఖాతా',
    qrToMatch: (count) => `QR, ${count} payment లు match చేయాలి`,
  },

  listen: {
    hints: {
      IDLE: 'ఎవరు ఏమి కొన్నారు, ఎంత ఇచ్చారు.',
      AWAITING_ENTRY_CONFIRM: 'అవును, కాదు, లేదా ఏమి మార్చాలో.',
      AWAITING_COLLECT_CHOICE: 'అవునా కాదా?',
      AWAITING_PHONE: 'పది అంకెలూ చెప్పండి.',
      AWAITING_PHONE_CONFIRM: 'అవునా కాదా?',
      AWAITING_QR_MATCH: 'అవునా కాదా?',
    },
    listening: 'వింటున్నాను…',
    thinking: 'ఆలోచిస్తున్నాను…',
    start: 'ఆకాశాన్ని తాకి మాట్లాడండి',
    example: '“రవి గారు 350 రూపాయల సామాను తీసుకున్నారు, 200 UPI లో ఇచ్చారు, 150 బాకీ”',
    sayYes: 'లేదా ఆకాశాన్ని తాకి “అవును” అనండి',
    sayNumber: 'ఆకాశాన్ని తాకి number చెప్పండి.',
    breakdown: (total, paid, pending) => `మొత్తం ${total} · ఇచ్చింది ${paid} · బాకీ ${pending}`,
    linkOffer: 'SMS ద్వారా Paytm payment link',
    linkOfferTo: (phone) => `${phone} కి SMS ద్వారా Paytm payment link`,
    linkSent: (phone) => `${phone} కి పంపాను. డబ్బు రాగానే entry దానంతటదే పూర్తవుతుంది.`,
    paidToQr: 'మీ షాప్ QR కి వచ్చింది',
    save: 'అవును, save చేయండి',
    sendLink: 'link పంపండి',
    notNow: 'ఇప్పుడు వద్దు',
    skip: 'వదిలేయండి',
    viewLedger: 'ఖాతాలో చూడండి',
    speakEntry: 'ఒక entry చెప్పండి',
    answerByVoice: 'మాటతో జవాబు ఇవ్వండి',
    stopListening: 'వినడం ఆపండి',
    changeLanguage: 'భాష మార్చండి',
  },

  notices: {
    micBlocked: {
      title: 'Pari కి microphone కావాలి',
      detail: 'settings లో అనుమతి ఇవ్వండి, లేదా button లతో జవాబు ఇవ్వండి.',
    },
    micFailed: { title: 'microphone మొదలవలేదు', detail: 'మళ్ళీ ప్రయత్నించడానికి ఆకాశాన్ని తాకండి.' },
    nothingHeard: 'ఏమీ వినిపించలేదు, మళ్ళీ చెప్పండి.',
    offline: (apiUrl) => ({
      title: 'Pari అందుబాటులో లేదు',
      detail: `backend ${apiUrl} లో నడుస్తోందో లేదో చూడండి.`,
    }),
    cantHear: 'Pari ఇప్పుడు వినలేకపోతోంది',
    failed: { title: 'అది జరగలేదు', detail: 'మళ్ళీ ప్రయత్నించడానికి ఆకాశాన్ని తాకండి.' },
  },

  qr: {
    overline: 'డబ్బు తీసుకోండి',
    title: 'scan చేసి pay చేయండి',
    loadFailed: 'మీ QR load కాలేదు.',
    copy: 'ID copy చేయండి',
    copied: 'copy అయింది',
    share: 'share చేయండి',
    shareMessage: (shop, payload) => `Pyari Pari తో ${shop} కి pay చేయండి: ${payload}`,
    overLink: 'link అడిగినదానికంటే ఎక్కువ',
    onQr: 'మీ QR లో',
    waiting: (count) => `ఇంకా ${count} వేచి ఉన్నాయి`,
    ask: (amount, name) => `${amount} వచ్చింది, ${name} దా?`,
    askWhose: (amount) => `${amount} వచ్చింది. ఎవరిది?`,
    noMatch: 'ఈ payment ఏ open entry తోనూ match కాలేదు.',
    staysPending: (left, pending) => `${pending} బాకీలో ${left} ఇంకా బాకీ ఉంటుంది`,
    clears: (pending) => `${pending} బాకీ పూర్తిగా తీరుతుంది`,
    clearsWithExtra: (pending, extra) => `${pending} బాకీ తీరుతుంది, ${extra} ఎక్కువ వచ్చింది`,
    okay: 'సరే',
  },

  ledger: {
    title: 'ఖాతా',
    toCollect: 'రావాల్సింది',
    collectedToday: 'ఈరోజు వచ్చింది',
    openEntries: 'బాకీ ఉన్న entry లు',
    filters: { all: 'అన్నీ', open: 'బాకీ ఉన్నవి', closed: 'పూర్తయినవి' },
    empty: {
      all: 'ఇంకా entry లు లేవు. “మాట్లాడండి” tab లో ఒకటి చెప్పండి, confirm చేయగానే ఇక్కడ కనిపిస్తుంది.',
      open: 'వసూలు చేయాల్సింది ఏమీ లేదు. అన్ని entry లు పూర్తయ్యాయి.',
      closed: 'ఇంకా ఏ entry పూర్తి కాలేదు.',
    },
    loadFailed: 'ఖాతా load కాలేదు.',
    closedByLink: 'link తో పూర్తయింది',
    closedByQr: 'QR తో పూర్తయింది',
    paidInFull: 'పూర్తిగా ఇచ్చారు',
    linkSent: 'link వెళ్ళింది',
    paid: (amount) => `${amount} ఇచ్చారు`,
    nothingPaid: 'ఇంకా ఏమీ ఇవ్వలేదు',
    pending: 'బాకీ',
    settled: 'ఇచ్చింది',
    today: 'ఈరోజు',
    yesterday: 'నిన్న',
  },

  language: {
    title: 'Pari భాషను ఎంచుకోండి',
    note: 'Pari ఈ భాషలో విని జవాబు ఇస్తుంది. తర్వాత “మాట్లాడండి” tab లో మార్చుకోవచ్చు.',
    failed: 'save కాలేదు. మళ్ళీ ప్రయత్నించండి.',
  },
};
