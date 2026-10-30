import { env } from '@/config/env';
import { mockDb, mockLatency } from '@/mocks/db';
import type { Profile } from '@/types/profile';

import { api } from './api-client';

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  if (env.useMocks) {
    return mockLatency(mockDb.profile(), 300);
  }
  return api.get<Profile>('/me', signal);
}
