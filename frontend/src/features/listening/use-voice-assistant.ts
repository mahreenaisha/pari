import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { ledgerKeys } from '@/features/ledger/use-ledger';
import { confirmEntry, discardEntry, sendPaymentLink, skipPaymentLink } from '@/services/ledger-service';
import { startVoiceSession } from '@/services/voice-service';
import type { ListenFor, VoiceResult, VoiceSession } from '@/types/assistant';
import type { LedgerEntry } from '@/types/ledger';

/** Where the merchant is in speak → confirm → collect. */
export type Step =
  | { kind: 'idle' }
  | { kind: 'listening'; listenFor: ListenFor }
  | { kind: 'thinking'; listenFor: ListenFor }
  | { kind: 'confirm'; draft: LedgerEntry }
  | { kind: 'collect'; entry: LedgerEntry; phone?: string }
  | { kind: 'working'; label: string }
  | { kind: 'done'; outcome: Outcome }
  | { kind: 'error' };

export type Outcome =
  | { kind: 'linkSent'; entry: LedgerEntry }
  | { kind: 'saved'; entry: LedgerEntry }
  | { kind: 'discarded' }
  | { kind: 'unheard' }
  | { kind: 'unclear' };

const ENERGY: Record<Step['kind'], number> = {
  idle: 0,
  listening: 1,
  thinking: 0.55,
  confirm: 0.3,
  collect: 0.3,
  working: 0.45,
  done: 0.15,
  error: 0,
};

export function useVoiceAssistant() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [transcript, setTranscript] = useState('');
  const session = useRef<VoiceSession | null>(null);
  /** The question a spoken answer belongs to, and where to return if nothing is heard. */
  const asked = useRef<Step>({ kind: 'idle' });

  /** 0–1 microphone loudness, smoothed for the orb. */
  const level = useSharedValue(0);
  /** 0–1 how "awake" the orb should look for the current step. */
  const energy = useSharedValue(0);

  useEffect(() => {
    energy.set(withTiming(ENERGY[step.kind], { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [energy, step.kind]);

  const refreshLedger = () => queryClient.invalidateQueries({ queryKey: ledgerKeys.all });

  const run = async (label: string, task: () => Promise<Step>) => {
    setStep({ kind: 'working', label });
    try {
      setStep(await task());
    } catch {
      setStep({ kind: 'error' });
    }
  };

  const confirm = (draft: LedgerEntry) =>
    run('Saving…', async () => {
      const entry = await confirmEntry(draft.id);
      await refreshLedger();
      return entry.pending > 0
        ? { kind: 'collect', entry }
        : { kind: 'done', outcome: { kind: 'saved', entry } };
    });

  // Both are fire-and-forget: a lost discard leaves a draft nobody sees, and a
  // lost skip changes nothing the merchant relies on.
  const reject = (draft: LedgerEntry) => {
    setStep({ kind: 'done', outcome: { kind: 'discarded' } });
    discardEntry(draft.id).catch(() => {});
  };

  const sendLink = (entry: LedgerEntry, phone?: string) =>
    run('Sending link…', async () => {
      const sent = await sendPaymentLink(entry.id, phone);
      await refreshLedger();
      return { kind: 'done', outcome: { kind: 'linkSent', entry: sent } };
    });

  const skipLink = (entry: LedgerEntry) => {
    setStep({ kind: 'done', outcome: { kind: 'saved', entry } });
    skipPaymentLink(entry.id).catch(() => {});
  };

  const answer = (result: VoiceResult, question: Step) => {
    if (question.kind === 'confirm' && result.answer) {
      if (result.answer === 'yes') void confirm(question.draft);
      else reject(question.draft);
    } else if (question.kind === 'collect' && result.answer) {
      if (result.answer === 'yes') void sendLink(question.entry, question.phone);
      else skipLink(question.entry);
    } else {
      setStep(question);
    }
  };

  const finish = async (listenFor: ListenFor) => {
    const active = session.current;
    if (!active) return;
    session.current = null;
    setStep({ kind: 'thinking', listenFor });
    const question = asked.current;
    try {
      const result = await active.finish();
      if (listenFor === 'entry') {
        if (result.draft) setStep({ kind: 'confirm', draft: result.draft });
        else setStep({ kind: 'done', outcome: { kind: result.transcript ? 'unclear' : 'unheard' } });
      } else if (listenFor === 'phone') {
        setStep(result.phone && question.kind === 'collect' ? { ...question, phone: result.phone } : question);
      } else {
        answer(result, question);
      }
    } catch {
      setStep({ kind: 'error' });
    }
  };

  const listen = (listenFor: ListenFor, from: Step) => {
    asked.current = from;
    setTranscript('');
    setStep({ kind: 'listening', listenFor });
    session.current = startVoiceSession(listenFor, {
      onLevel: (value) => level.set(withTiming(value, { duration: 120 })),
      onTranscript: setTranscript,
      onSilence: () => void finish(listenFor),
    });
  };

  /** The orb is the mic: it starts a new entry, or answers whatever was just asked. */
  const tapOrb = () => {
    switch (step.kind) {
      case 'listening':
        void finish(step.listenFor);
        break;
      case 'thinking':
      case 'working':
        break;
      case 'confirm':
        listen('answer', step);
        break;
      case 'collect':
        listen(step.phone || step.entry.customer.phone ? 'answer' : 'phone', step);
        break;
      default:
        listen('entry', { kind: 'idle' });
    }
  };

  useFocusEffect(
    useCallback(
      () => () => {
        if (!session.current) return;
        session.current.cancel();
        session.current = null;
        setStep(asked.current);
      },
      [],
    ),
  );

  return { step, transcript, level, energy, tapOrb, confirm, reject, sendLink, skipLink };
}
