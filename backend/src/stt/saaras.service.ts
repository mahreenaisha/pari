import type { SarvamAI } from "sarvamai";
import type { Env } from "../config/env.js";
import type { Language } from "../contracts/index.js";
import { getSarvamClient, mapSarvamError, SARVAM_REQUEST_OPTIONS } from "../sarvam/client.js";

export interface AudioInput {
  data: Buffer;
  filename: string;
  mimeType: string;
}

export interface Transcription {
  transcript: string;
  languageCode: string | null;
}

export interface TranscribeOptions {
  /** The merchant's language. Saaras is told it, because answers like "haan" are too short to detect. */
  language: Language;
  keyterms?: string[];
}

export interface SpeechToText {
  transcribe(audio: AudioInput, opts: TranscribeOptions): Promise<Transcription>;
}

export class SaarasSpeechToText implements SpeechToText {
  constructor(private readonly env: Env) {}

  async transcribe(audio: AudioInput, opts: TranscribeOptions): Promise<Transcription> {
    const client = getSarvamClient(this.env.SARVAM_API_KEY);
    // No default keyterms: "Pari" as one made Saaras write "Verma ji" and "dedh sau" as "Pari".
    const keyterms = (opts.keyterms ?? []).slice(0, 50);
    try {
      const response = await client.speechToText.transcribe(
        {
          file: { data: audio.data, filename: audio.filename, contentType: audio.mimeType },
          model: this.env.SARVAM_STT_MODEL as SarvamAI.SpeechToTextModel,
          mode: this.env.SARVAM_STT_MODE as SarvamAI.Mode,
          language_code: opts.language,
          ...(this.env.SARVAM_STT_MODEL === "saaras:v4" && keyterms.length ? { keyterms } : {}),
        },
        SARVAM_REQUEST_OPTIONS,
      );
      return { transcript: response.transcript.trim(), languageCode: response.language_code ?? null };
    } catch (err) {
      throw mapSarvamError(err, "speech-to-text");
    }
  }
}
