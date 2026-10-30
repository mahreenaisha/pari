const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export const env = {
  apiUrl,
  /** In-app mock data is served until a backend URL is configured. */
  useMocks: apiUrl === '' || process.env.EXPO_PUBLIC_USE_MOCKS === 'true',
} as const;
