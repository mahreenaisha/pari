import { startMockVoiceSession } from '@/mocks/voice-session';
import type { ListenFor, VoiceSession, VoiceSessionHandlers } from '@/types/assistant';

/**
 * Captures speech and interprets it as `listenFor`. Simulated for now; the real
 * version streams the microphone to the backend (speech-to-text, then entry
 * extraction) and can replace the body without changing callers.
 */
export function startVoiceSession(listenFor: ListenFor, handlers: VoiceSessionHandlers): VoiceSession {
  return startMockVoiceSession(listenFor, handlers);
}
