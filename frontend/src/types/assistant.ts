import type { LedgerEntry } from './ledger';

/** What the assistant expects to hear, which decides how the speech is interpreted. */
export type ListenFor = 'entry' | 'phone' | 'answer';

export type VoiceResult = {
  /** What the merchant said. Empty when nothing was heard. */
  transcript: string;
  /** For `entry`: the extracted, still unconfirmed entry. */
  draft?: LedgerEntry;
  /** For `phone`: ten digits. */
  phone?: string;
  /** For `answer`: a spoken "haan" or "nahi". */
  answer?: 'yes' | 'no';
};

export type VoiceSessionHandlers = {
  /** 0–1 input loudness, emitted several times a second. */
  onLevel: (level: number) => void;
  /** Running transcript of everything heard so far. */
  onTranscript: (text: string) => void;
  /** The speaker went quiet, so the session can be finished. */
  onSilence: () => void;
};

export type VoiceSession = {
  /** Stops capturing and resolves with the interpreted speech. */
  finish: () => Promise<VoiceResult>;
  cancel: () => void;
};
