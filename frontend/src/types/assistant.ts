import type { LedgerEntry } from './ledger';

export type AssistantTurn = {
  /** What the user said. Empty when nothing was heard. */
  transcript: string;
  /** What the assistant answered. */
  reply: string;
  /** Ledger entry created from the request, if any. */
  entry?: LedgerEntry;
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
  /** Stops capturing and resolves with the assistant's answer. */
  finish: () => Promise<AssistantTurn>;
  cancel: () => void;
};
