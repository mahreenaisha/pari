/** The 11 languages Sarvam can both hear and speak, with the codes the backend uses. */
export const LANGUAGES = [
  { code: 'hi-IN', name: 'हिन्दी', english: 'Hindi' },
  { code: 'en-IN', name: 'English', english: 'English' },
  { code: 'bn-IN', name: 'বাংলা', english: 'Bengali' },
  { code: 'ta-IN', name: 'தமிழ்', english: 'Tamil' },
  { code: 'te-IN', name: 'తెలుగు', english: 'Telugu' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ', english: 'Kannada' },
  { code: 'ml-IN', name: 'മലയാളം', english: 'Malayalam' },
  { code: 'mr-IN', name: 'मराठी', english: 'Marathi' },
  { code: 'gu-IN', name: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'od-IN', name: 'ଓଡ଼ିଆ', english: 'Odia' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

/** What the app and Pari use until the merchant picks a language. */
export const DEFAULT_LANGUAGE: Language = 'hi-IN';

export function languageName(code: Language) {
  return LANGUAGES.find((language) => language.code === code)?.name ?? code;
}
