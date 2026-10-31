import type { Language } from '@/i18n/languages';
import type { MerchantDto } from '@/types/api';
import type { Profile } from '@/types/profile';

import { api } from './api-client';

function toProfile(me: MerchantDto): Profile {
  return {
    id: me.id,
    businessName: me.name,
    paymentAddress: me.upiId,
    qrPayload: me.qrPayload,
    language: me.language,
  };
}

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  return toProfile(await api.get<MerchantDto>('/me', signal));
}

/** Saved on the merchant, so the app, the CLI and Pari's announcements all follow it. */
export async function setLanguage(language: Language): Promise<Profile> {
  return toProfile(await api.patch<MerchantDto>('/me', { language }));
}
