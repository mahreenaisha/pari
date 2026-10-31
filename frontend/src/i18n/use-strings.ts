import { useProfile } from '@/features/qr/use-profile';

import { DEFAULT_LANGUAGE, type Language } from './languages';
import { STRINGS } from './strings';

/** The merchant's language, Hindi until they pick one. */
export function useLanguage(): Language {
  return useProfile().data?.language ?? DEFAULT_LANGUAGE;
}

/** The app's own text in the merchant's language. */
export function useStrings() {
  return STRINGS[useLanguage()];
}
