import type { Strings } from './types';

export const gu: Strings = {
  locale: 'gu-IN',

  common: {
    yes: 'હા',
    no: 'ના',
    tryAgain: 'ફરી પ્રયત્ન કરો',
  },

  tabs: {
    listen: 'બોલો',
    qr: 'QR',
    ledger: 'ખાતું',
    qrToMatch: (count) => `QR, ${count} payment match કરવાના બાકી`,
  },

  listen: {
    hints: {
      IDLE: 'કોણે શું લીધું, અને કેટલા આપ્યા.',
      AWAITING_ENTRY_CONFIRM: 'હા, ના, અથવા શું બદલવું.',
      AWAITING_COLLECT_CHOICE: 'હા કે ના?',
      AWAITING_PHONE: 'દસેય આંકડા બોલો.',
      AWAITING_PHONE_CONFIRM: 'હા કે ના?',
      AWAITING_QR_MATCH: 'હા કે ના?',
    },
    listening: 'સાંભળું છું…',
    thinking: 'વિચારું છું…',
    start: 'આકાશને અડીને બોલો',
    example: '“મહેતાભાઈએ 350 રૂપિયાનો સામાન લીધો, 200 UPI થી આપ્યા, 150 બાકી”',
    sayYes: 'અથવા આકાશને અડીને “હા” બોલો',
    sayNumber: 'આકાશને અડીને number બોલો.',
    breakdown: (total, paid, pending) => `કુલ ${total} · આપ્યા ${paid} · બાકી ${pending}`,
    linkOffer: 'SMS થી Paytm payment link',
    linkOfferTo: (phone) => `${phone} પર SMS થી Paytm payment link`,
    linkSent: (phone) => `${phone} પર મોકલી. પૈસા આવતાં જ entry જાતે બંધ થઈ જશે.`,
    paidToQr: 'તમારી દુકાનના QR પર આવ્યા',
    save: 'હા, save કરો',
    sendLink: 'link મોકલો',
    notNow: 'હમણાં નહીં',
    skip: 'રહેવા દો',
    viewLedger: 'ખાતામાં જુઓ',
    speakEntry: 'એક entry બોલો',
    answerByVoice: 'બોલીને જવાબ આપો',
    stopListening: 'સાંભળવાનું બંધ કરો',
    changeLanguage: 'ભાષા બદલો',
  },

  notices: {
    micBlocked: {
      title: 'Pari ને microphone જોઈએ',
      detail: 'settings માં મંજૂરી આપો, અથવા button થી જવાબ આપો.',
    },
    micFailed: { title: 'microphone ચાલુ ન થયું', detail: 'ફરી પ્રયત્ન કરવા આકાશને અડો.' },
    nothingHeard: 'કંઈ સંભળાયું નહીં, ફરી બોલો.',
    offline: (apiUrl) => ({
      title: 'Pari સુધી પહોંચાતું નથી',
      detail: `backend ${apiUrl} પર ચાલે છે કે નહીં તે જુઓ.`,
    }),
    cantHear: 'Pari ને અત્યારે સંભળાતું નથી',
    failed: { title: 'એ ન થયું', detail: 'ફરી પ્રયત્ન કરવા આકાશને અડો.' },
  },

  qr: {
    overline: 'પૈસા મેળવો',
    title: 'scan કરીને pay કરો',
    loadFailed: 'તમારો QR load ન થયો.',
    copy: 'ID copy કરો',
    copied: 'copy થઈ ગયું',
    share: 'share કરો',
    shareMessage: (shop, payload) => `Pyari Pari થી ${shop} ને pay કરો: ${payload}`,
    overLink: 'link માં માંગ્યા કરતાં વધારે',
    onQr: 'તમારા QR પર',
    waiting: (count) => `હજી ${count} રાહ જુએ છે`,
    ask: (amount, name) => `${amount} આવ્યા, ${name} ના?`,
    askWhose: (amount) => `${amount} આવ્યા. કોના છે?`,
    noMatch: 'આ payment કોઈ ખુલ્લી entry સાથે મેળ ખાતું નથી.',
    staysPending: (left, pending) => `${pending} બાકીમાંથી ${left} હજી બાકી રહેશે`,
    clears: (pending) => `${pending} બાકી પૂરું ચૂકતે થશે`,
    clearsWithExtra: (pending, extra) => `${pending} બાકી ચૂકતે થશે, ${extra} વધારે આવ્યા`,
    okay: 'ઠીક છે',
  },

  ledger: {
    title: 'ખાતું',
    toCollect: 'લેવાના બાકી',
    collectedToday: 'આજે આવ્યા',
    openEntries: 'ખુલ્લી entry',
    filters: { all: 'બધી', open: 'ખુલ્લી', closed: 'બંધ' },
    empty: {
      all: 'હજી કોઈ entry નથી. “બોલો” tab પર એક બોલો, confirm કરતાં જ અહીં દેખાશે.',
      open: 'ઉઘરાવવાનું કંઈ નથી. બધી entry બંધ છે.',
      closed: 'હજી કોઈ entry બંધ નથી થઈ.',
    },
    loadFailed: 'ખાતું load ન થયું.',
    closedByLink: 'link થી બંધ',
    closedByQr: 'QR થી બંધ',
    paidInFull: 'પૂરા પૈસા આપ્યા',
    linkSent: 'link મોકલી',
    paid: (amount) => `${amount} આપ્યા`,
    nothingPaid: 'હજી કંઈ નથી આપ્યું',
    pending: 'બાકી',
    settled: 'ચૂકવ્યા',
    today: 'આજે',
    yesterday: 'ગઈકાલે',
  },

  language: {
    title: 'Pari ની ભાષા પસંદ કરો',
    note: 'Pari આ ભાષામાં સાંભળશે અને જવાબ આપશે. પછીથી “બોલો” tab પરથી બદલી શકો છો.',
    failed: 'save ન થયું. ફરી પ્રયત્ન કરો.',
  },
};
