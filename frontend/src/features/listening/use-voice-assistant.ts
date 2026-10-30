import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { ledgerKeys } from '@/features/ledger/use-ledger';
import { startVoiceSession } from '@/services/voice-service';
import type { AssistantTurn, VoiceSession } from '@/types/assistant';

export type AssistantStatus = 'idle' | 'listening' | 'thinking' | 'replied' | 'error';

const ENERGY: Record<AssistantStatus, number> = {
  idle: 0,
  listening: 1,
  thinking: 0.55,
  replied: 0.15,
  error: 0,
};

export function useVoiceAssistant() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [turn, setTurn] = useState<AssistantTurn | null>(null);
  const session = useRef<VoiceSession | null>(null);

  /** 0–1 microphone loudness, smoothed for the orb. */
  const level = useSharedValue(0);
  /** 0–1 how "awake" the orb should look for the current status. */
  const energy = useSharedValue(0);

  useEffect(() => {
    energy.set(withTiming(ENERGY[status], { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [energy, status]);

  const finish = async () => {
    const active = session.current;
    if (!active) return;
    session.current = null;
    setStatus('thinking');
    try {
      const result = await active.finish();
      setTurn(result);
      setStatus('replied');
      if (result.entry) {
        await queryClient.invalidateQueries({ queryKey: ledgerKeys.all });
      }
    } catch {
      setStatus('error');
    }
  };

  const start = () => {
    setTranscript('');
    setTurn(null);
    setStatus('listening');
    session.current = startVoiceSession({
      onLevel: (value) => level.set(withTiming(value, { duration: 120 })),
      onTranscript: setTranscript,
      onSilence: () => void finish(),
    });
  };

  const toggle = () => {
    if (status === 'listening') void finish();
    else if (status !== 'thinking') start();
  };

  useFocusEffect(
    useCallback(
      () => () => {
        if (!session.current) return;
        session.current.cancel();
        session.current = null;
        setStatus('idle');
      },
      [],
    ),
  );

  return { status, transcript, turn, level, energy, toggle };
}
