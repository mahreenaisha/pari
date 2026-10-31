import type { Strings } from './types';

export const bn: Strings = {
  locale: 'bn-IN',

  common: {
    yes: 'হ্যাঁ',
    no: 'না',
    tryAgain: 'আবার চেষ্টা করুন',
  },

  tabs: {
    listen: 'বলুন',
    qr: 'QR',
    ledger: 'খাতা',
    qrToMatch: (count) => `QR, ${count}টি payment মেলানো বাকি`,
  },

  listen: {
    hints: {
      IDLE: 'কে কী নিলেন, আর কত দিলেন।',
      AWAITING_ENTRY_CONFIRM: 'হ্যাঁ, না, অথবা কী বদলাতে হবে।',
      AWAITING_COLLECT_CHOICE: 'হ্যাঁ নাকি না?',
      AWAITING_PHONE: 'দশটা সংখ্যাই বলুন।',
      AWAITING_PHONE_CONFIRM: 'হ্যাঁ নাকি না?',
      AWAITING_QR_MATCH: 'হ্যাঁ নাকি না?',
    },
    listening: 'শুনছি…',
    thinking: 'ভাবছি…',
    start: 'আকাশ ছুঁয়ে বলুন',
    example: '“ঘোষবাবু 350 টাকার জিনিস নিলেন, 200 UPI-তে দিলেন, 150 বাকি”',
    sayYes: 'অথবা আকাশ ছুঁয়ে বলুন “হ্যাঁ”',
    sayNumber: 'আকাশ ছুঁয়ে নম্বরটা বলুন।',
    breakdown: (total, paid, pending) => `মোট ${total} · দিয়েছেন ${paid} · বাকি ${pending}`,
    linkOffer: 'SMS-এ Paytm payment link',
    linkOfferTo: (phone) => `${phone}-এ SMS-এ Paytm payment link`,
    linkSent: (phone) => `${phone}-এ পাঠানো হয়েছে। টাকা এলে entry নিজেই বন্ধ হয়ে যাবে।`,
    paidToQr: 'আপনার দোকানের QR-এ এসেছে',
    save: 'হ্যাঁ, save করুন',
    sendLink: 'link পাঠান',
    notNow: 'এখন না',
    skip: 'থাক',
    viewLedger: 'খাতায় দেখুন',
    speakEntry: 'একটা entry বলুন',
    answerByVoice: 'মুখে উত্তর দিন',
    stopListening: 'শোনা থামান',
    changeLanguage: 'ভাষা বদলান',
  },

  notices: {
    micBlocked: {
      title: 'Pari-র microphone লাগবে',
      detail: 'settings-এ অনুমতি দিন, অথবা button টিপে উত্তর দিন।',
    },
    micFailed: { title: 'microphone চালু হলো না', detail: 'আবার চেষ্টা করতে আকাশ ছুঁয়ে দিন।' },
    nothingHeard: 'কিছু শোনা গেল না, আবার বলুন।',
    offline: (apiUrl) => ({
      title: 'Pari-র সাথে যোগাযোগ হচ্ছে না',
      detail: `backend ${apiUrl}-এ চলছে কিনা দেখুন।`,
    }),
    cantHear: 'Pari এখন শুনতে পাচ্ছে না',
    failed: { title: 'হলো না', detail: 'আবার চেষ্টা করতে আকাশ ছুঁয়ে দিন।' },
  },

  qr: {
    overline: 'টাকা নিন',
    title: 'স্ক্যান করে পে করুন',
    loadFailed: 'আপনার QR আনা গেল না।',
    copy: 'ID কপি করুন',
    copied: 'কপি হয়েছে',
    share: 'শেয়ার করুন',
    shareMessage: (shop, payload) => `Pyari Pari দিয়ে ${shop}-কে টাকা দিন: ${payload}`,
    overLink: 'link-এ যত চাওয়া হয়েছিল তার বেশি',
    onQr: 'আপনার QR-এ',
    waiting: (count) => `আরও ${count}টি অপেক্ষায়`,
    ask: (amount, name) => `${amount} এসেছে, ${name}-এর?`,
    askWhose: (amount) => `${amount} এসেছে। কার?`,
    noMatch: 'এই payment কোনো খোলা entry-র সাথে মেলেনি।',
    staysPending: (left, pending) => `${pending} বাকির মধ্যে ${left} বাকি থাকবে`,
    clears: (pending) => `${pending} বাকি পুরো শোধ হয়ে যাবে`,
    clearsWithExtra: (pending, extra) => `${pending} বাকি শোধ হয়ে যাবে, ${extra} বেশি এসেছে`,
    okay: 'ঠিক আছে',
  },

  ledger: {
    title: 'খাতা',
    toCollect: 'পাওনা',
    collectedToday: 'আজ এসেছে',
    openEntries: 'খোলা entry',
    filters: { all: 'সব', open: 'খোলা', closed: 'বন্ধ' },
    empty: {
      all: 'এখনও কোনো entry নেই। “বলুন” tab-এ একটা বলুন, confirm করলেই এখানে দেখা যাবে।',
      open: 'আদায়ের কিছু নেই। সব entry বন্ধ।',
      closed: 'এখনও কোনো entry বন্ধ হয়নি।',
    },
    loadFailed: 'খাতা আনা গেল না।',
    closedByLink: 'link-এ শোধ',
    closedByQr: 'QR-এ শোধ',
    paidInFull: 'পুরো টাকা দিয়েছেন',
    linkSent: 'link পাঠানো হয়েছে',
    paid: (amount) => `${amount} দিয়েছেন`,
    nothingPaid: 'এখনও কিছু দেননি',
    pending: 'বাকি',
    settled: 'শোধ',
    today: 'আজ',
    yesterday: 'গতকাল',
  },

  language: {
    title: 'Pari-র ভাষা বেছে নিন',
    note: 'Pari এই ভাষায় শুনবে আর উত্তর দেবে। পরে “বলুন” tab থেকে বদলাতে পারবেন।',
    failed: 'save হলো না। আবার চেষ্টা করুন।',
  },
};
