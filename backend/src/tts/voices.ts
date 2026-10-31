import type { SarvamAI } from "sarvamai";
import type { Language } from "../contracts/index.js";

export interface Voice {
  model: SarvamAI.TextToSpeechModel;
  speaker: SarvamAI.TextToSpeechSpeaker;
}

/**
 * Pari's voice in each language. All are female so she sounds like one person. Bulbul v4 has no Malayalam
 * or Odia voices and no female Tamil or clearly female Punjabi one, so those four use v3's general voice.
 */
export const VOICES: Record<Language, Voice> = {
  "hi-IN": { model: "bulbul:v4-flash", speaker: "simran_enhi_customer" },
  "en-IN": { model: "bulbul:v4-flash", speaker: "simran_en_customer" },
  "bn-IN": { model: "bulbul:v4-flash", speaker: "roopa_bn_conversational" },
  "te-IN": { model: "bulbul:v4-flash", speaker: "kavitha_te_conversation" },
  "kn-IN": { model: "bulbul:v4-flash", speaker: "chaitra_kn_conversation" },
  "mr-IN": { model: "bulbul:v4-flash", speaker: "ishita_mr_conversational" },
  "gu-IN": { model: "bulbul:v4-flash", speaker: "pooja_gu_customer" },
  "ta-IN": { model: "bulbul:v3", speaker: "simran" },
  "ml-IN": { model: "bulbul:v3", speaker: "simran" },
  "od-IN": { model: "bulbul:v3", speaker: "simran" },
  "pa-IN": { model: "bulbul:v3", speaker: "simran" },
};
