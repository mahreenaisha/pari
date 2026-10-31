import type { Language } from "./contracts/index.js";
import type { Db } from "./ledger/repository.js";

/** What Pari hears and speaks until the merchant picks a language. */
export const DEFAULT_LANGUAGE: Language = "hi-IN";

export const LANGUAGE_NAMES: Record<Language, string> = {
  "hi-IN": "Hindi",
  "en-IN": "English",
  "bn-IN": "Bengali",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
  "kn-IN": "Kannada",
  "ml-IN": "Malayalam",
  "mr-IN": "Marathi",
  "gu-IN": "Gujarati",
  "pa-IN": "Punjabi",
  "od-IN": "Odia",
};

/**
 * The language each merchant picked, read once and then cached. Payment
 * announcements have no request to read it from, so everything asks here.
 */
export class MerchantLanguages {
  private readonly picked = new Map<string, Language | null>();

  constructor(private readonly db: Db) {}

  /** null until the merchant picks one. */
  async chosen(merchantId: string): Promise<Language | null> {
    const cached = this.picked.get(merchantId);
    if (cached !== undefined) return cached;
    const row = await this.db.selectFrom("merchants").select("language").where("id", "=", merchantId).executeTakeFirst();
    const language = row?.language ?? null;
    this.picked.set(merchantId, language);
    return language;
  }

  async get(merchantId: string): Promise<Language> {
    return (await this.chosen(merchantId)) ?? DEFAULT_LANGUAGE;
  }

  async set(merchantId: string, language: Language): Promise<void> {
    await this.db.updateTable("merchants").set({ language }).where("id", "=", merchantId).execute();
    this.picked.set(merchantId, language);
  }
}
