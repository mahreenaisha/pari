import { startMockVoiceSession } from '@/mocks/voice-session';
import type { VoiceSession, VoiceSessionHandlers } from '@/types/assistant';

/**
 * Starts capturing speech for the assistant. Simulated for now; a real
 * implementation (microphone capture + assistant backend) can replace the body
 * without changing callers.
 */
export function startVoiceSession(handlers: VoiceSessionHandlers): VoiceSession {
  return startMockVoiceSession(handlers);
}
