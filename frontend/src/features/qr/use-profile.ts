import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchProfile, setLanguage } from '@/services/profile-service';

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

export function useSetLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setLanguage,
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.me, profile),
  });
}
