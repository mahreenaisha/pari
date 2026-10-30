import type { SarvamAI } from "sarvamai";
import type { Env } from "../config/env.js";
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

export interface SpeechToText {
  transcribe(audio: AudioInput, opts?: { keyterms?: string[] }): Promise<Transcription>;
}

export class SaarasSpeechToText implements SpeechToText {
  constructor(private readonly env: Env) {}

  async transcribe(audio: AudioInput, opts: { keyterms?: string[] } = {}): Promise<Transcription> {
    const client = getSarvamClient(this.env.SARVAM_API_KEY);
    const keyterms = ["Pari", ...(opts.keyterms ?? [])].slice(0, 50);
    try {
      const response = await client.speechToText.transcribe(
        {
          file: { data: audio.data, filename: audio.filename, contentType: audio.mimeType },
          model: this.env.SARVAM_STT_MODEL as SarvamAI.SpeechToTextModel,
          mode: this.env.SARVAM_STT_MODE as SarvamAI.Mode,
          language_code: this.env.SARVAM_STT_LANGUAGE as SarvamAI.SpeechToTextLanguage,
          ...(this.env.SARVAM_STT_MODEL === "saaras:v4" ? { keyterms } : {}),
        },
        SARVAM_REQUEST_OPTIONS,
      );
      return { transcript: response.transcript.trim(), languageCode: response.language_code ?? null };
    } catch (err) {
      throw mapSarvamError(err, "speech-to-text");
    }
  }
}
