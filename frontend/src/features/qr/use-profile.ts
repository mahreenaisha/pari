import { useQuery } from '@tanstack/react-query';

import { fetchProfile } from '@/services/profile-service';

export const profileKeys = {
  me: ['profile', 'me'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: ({ signal }) => fetchProfile(signal),
    staleTime: 5 * 60_000,
  });
}
