import { formatMoney } from '@/lib/format';
import type { AssistantTurn, VoiceSession, VoiceSessionHandlers } from '@/types/assistant';
import type { LedgerEntry } from '@/types/ledger';

import { mockDb } from './db';

type EntryDraft = Pick<LedgerEntry, 'party' | 'note' | 'amount' | 'direction'>;

type Script = {
  transcript: string;
  respond: () => Omit<AssistantTurn, 'transcript'>;
};

function record(draft: EntryDraft, reply: (entry: LedgerEntry) => string) {
  const entry: LedgerEntry = {
    ...draft,
    id: `le_${Date.now()}`,
    source: 'voice',
    createdAt: new Date().toISOString(),
  };
  mockDb.ledger.unshift(entry);
  return { entry, reply: reply(entry) };
}

const scripts: Script[] = [
  {
    transcript: 'Ramesh paid me five hundred rupees for the rent',
    respond: () =>
      record(
        { party: 'Ramesh Kumar', note: 'Rent', amount: 50_000, direction: 'in' },
        (entry) => `Got it. ${formatMoney(entry.amount)} from Ramesh is in your ledger.`,
      ),
  },
  {
    transcript: 'I gave Sunita twelve hundred for the groceries',
    respond: () =>
      record(
        { party: 'Sunita Devi', note: 'Groceries', amount: 120_000, direction: 'out' },
        (entry) => `Noted ${formatMoney(entry.amount)} paid to Sunita for groceries.`,
      ),
  },
  {
    transcript: 'How much money came in this week',
    respond: () => {
      const weekAgo = Date.now() - 7 * 86_400_000;
      const total = mockDb.ledger
        .filter((e) => e.direction === 'in' && Date.parse(e.createdAt) >= weekAgo)
        .reduce((sum, e) => sum + e.amount, 0);
      return { reply: `You received ${formatMoney(total)} in the last seven days.` };
    },
  },
];

let nextScript = 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Plays back a scripted utterance with a believable input level, then answers it. */
export function startMockVoiceSession({
  onLevel,
  onTranscript,
  onSilence,
}: VoiceSessionHandlers): VoiceSession {
  const script = scripts[nextScript++ % scripts.length];
  const words = script.transcript.split(' ');
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let heard = 0;
  let speaking = false;
  let tick = 0;
  let stopped = false;

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  const meter = setInterval(() => {
    tick += 1;
    const level = speaking
      ? 0.3 + 0.5 * Math.abs(Math.sin(tick * 0.55)) * (0.6 + 0.4 * Math.random())
      : 0.03 + Math.random() * 0.05;
    onLevel(level);
  }, 80);

  const speakNextWord = () => {
    heard += 1;
    onTranscript(words.slice(0, heard).join(' '));
    if (heard < words.length) {
      later(speakNextWord, 230 + Math.random() * 190);
    } else {
      later(() => {
        speaking = false;
        later(onSilence, 1100);
      }, 250);
    }
  };

  later(() => {
    speaking = true;
    speakNextWord();
  }, 650);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(meter);
    timers.forEach(clearTimeout);
    timers.clear();
    onLevel(0);
  };

  return {
    finish: async () => {
      stop();
      await wait(1100);
      if (heard === 0) {
        return { transcript: '', reply: "I didn't catch that. Tap the sky and try again." };
      }
      return { transcript: script.transcript, ...script.respond() };
    },
    cancel: stop,
  };
}
