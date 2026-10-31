import type { ConversationState } from '@/types/api';

/** Why the last attempt didn't get through, shown until the next one. */
export type Notice = { title: string; detail?: string };

/**
 * The app's own text in one language. Amounts, phone numbers and names arrive
 * already formatted, so every language shows exactly the same figures.
 */
export type Strings = {
  /** `Intl` locale for dates and times. */
  locale: string;

  common: {
    yes: string;
    no: string;
    tryAgain: string;
  };

  tabs: {
    listen: string;
    qr: string;
    ledger: string;
    /** Accessibility label of the QR tab while payments wait to be matched. */
    qrToMatch: (count: number) => string;
  };

  listen: {
    /** Shown while Pari listens, by what she is waiting for. */
    hints: Record<ConversationState, string>;
    listening: string;
    thinking: string;
    start: string;
    /** An entry the merchant could say, in quotes. */
    example: string;
    /** Footnote under a yes/no question. */
    sayYes: string;
    sayNumber: string;
    /** Footnote under a question asking for a name or an amount. */
    sayAnswer: string;
    breakdown: (total: string, paid: string, pending: string) => string;
    linkOffer: string;
    linkOfferTo: (phone: string) => string;
    linkSent: (phone: string) => string;
    paidToQr: string;
    save: string;
    sendLink: string;
    notNow: string;
    skip: string;
    viewLedger: string;
    speakEntry: string;
    answerByVoice: string;
    stopListening: string;
    changeLanguage: string;
  };

  notices: {
    micBlocked: Notice;
    micFailed: Notice;
    nothingHeard: string;
    offline: (apiUrl: string) => Notice;
    /** Sarvam failed; the detail is the backend's own message. */
    cantHear: string;
    failed: Notice;
  };

  qr: {
    overline: string;
    title: string;
    loadFailed: string;
    copy: string;
    copied: string;
    share: string;
    shareMessage: (shop: string, payload: string) => string;
    /** A payment link was paid more than it asked for. */
    overLink: string;
    onQr: string;
    waiting: (count: number) => string;
    ask: (amount: string, name: string) => string;
    askWhose: (amount: string) => string;
    noMatch: string;
    staysPending: (left: string, pending: string) => string;
    clears: (pending: string) => string;
    clearsWithExtra: (pending: string, extra: string) => string;
    okay: string;
  };

  ledger: {
    title: string;
    toCollect: string;
    collectedToday: string;
    openEntries: string;
    filters: { all: string; open: string; closed: string };
    empty: { all: string; open: string; closed: string };
    loadFailed: string;
    closedByLink: string;
    closedByQr: string;
    closedByCash: string;
    paidInFull: string;
    linkSent: string;
    paid: (amount: string) => string;
    nothingPaid: string;
    /** Under an open entry's amount. */
    pending: string;
    /** Under a closed entry's amount. */
    settled: string;
    today: string;
    yesterday: string;
  };

  language: {
    title: string;
    note: string;
    failed: string;
  };
};
