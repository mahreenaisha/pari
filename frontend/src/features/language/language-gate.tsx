import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';

import { useProfile } from '@/features/qr/use-profile';

/** How long a slow backend may hold the app back before it opens in Hindi anyway. */
const PROFILE_WAIT_MS = 4000;

/**
 * Renders nothing, under the splash screen, until the merchant's language is known,
 * so the app never shows Hindi and then switches. The web has no splash screen, hence rendering nothing.
 */
export function LanguageGate({ children }: { children: ReactNode }) {
  const { isPending } = useProfile();
  const [gaveUp, setGaveUp] = useState(false);
  const ready = !isPending || gaveUp;

  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), PROFILE_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  return ready ? children : null;
}
