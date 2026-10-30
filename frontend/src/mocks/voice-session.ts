import type { ListenFor, VoiceResult, VoiceSession, VoiceSessionHandlers } from '@/types/assistant';

import { mockDb } from './db';

type Script = {
  transcript: string;
  interpret: () => Omit<VoiceResult, 'transcript'>;
};

const entryScripts: Script[] = [
  {
    transcript: 'Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki',
    interpret: () => ({
      draft: mockDb.createDraft({ customerName: 'Gupta ji', total: 35_000, paid: 20_000, method: 'upi' }),
    }),
  },
  {
    transcript: 'Sunita ji ne 1200 ka samaan liya, 500 cash diye',
    interpret: () => ({
      draft: mockDb.createDraft({ customerName: 'Sunita Devi', total: 120_000, paid: 50_000, method: 'cash' }),
    }),
  },
  {
    transcript: 'Rahul ne 80 ki chai li, poore paise de diye',
    interpret: () => ({
      draft: mockDb.createDraft({ customerName: 'Rahul', total: 8_000, paid: 8_000, method: 'cash' }),
    }),
  },
];

const phoneScript: Script = { transcript: '98765 43210', interpret: () => ({ phone: '9876543210' }) };
const answerScript: Script = { transcript: 'Haan', interpret: () => ({ answer: 'yes' }) };

/** Speech-to-text plus extraction takes longest for a full entry. */
const THINKING_MS: Record<ListenFor, number> = { entry: 1100, phone: 500, answer: 400 };

let nextEntryScript = 0;

function pickScript(listenFor: ListenFor) {
  if (listenFor === 'phone') return phoneScript;
  if (listenFor === 'answer') return answerScript;
  return entryScripts[nextEntryScript++ % entryScripts.length];
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Plays back a scripted utterance with a believable input level, then interprets it. */
export function startMockVoiceSession(
  listenFor: ListenFor,
  { onLevel, onTranscript, onSilence }: VoiceSessionHandlers,
): VoiceSession {
  const script = pickScript(listenFor);
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
      await wait(THINKING_MS[listenFor]);
      if (heard === 0) return { transcript: '' };
      return { transcript: script.transcript, ...script.interpret() };
    },
    cancel: stop,
  };
}
