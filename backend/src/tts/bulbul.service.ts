import type { SarvamAI } from "sarvamai";
import type { Env } from "../config/env.js";
import { getSarvamClient, mapSarvamError, SARVAM_REQUEST_OPTIONS } from "../sarvam/client.js";

export interface TextToSpeech {
  /** Returns WAV bytes. */
  synthesize(text: string): Promise<Buffer>;
  /** WAV bytes as they are generated, so playback can start early. */
  stream?(text: string): AsyncIterable<Uint8Array>;
}

export class BulbulTextToSpeech implements TextToSpeech {
  constructor(private readonly env: Env) {}

  private request(text: string) {
    return {
      text,
      language_code: "hi-IN",
      model: this.env.SARVAM_TTS_MODEL as SarvamAI.TextToSpeechModel,
      speaker: this.env.PARI_TTS_SPEAKER as SarvamAI.TextToSpeechSpeaker,
      pace: this.env.PARI_TTS_PACE,
      output_audio_codec: "wav",
      speech_sample_rate: 22050,
    } as const;
  }

  async synthesize(text: string): Promise<Buffer> {
    const client = getSarvamClient(this.env.SARVAM_API_KEY);
    try {
      const response = await client.textToSpeech.convert(this.request(text), SARVAM_REQUEST_OPTIONS);
      return Buffer.concat(response.audios.map((a) => Buffer.from(a, "base64")));
    } catch (err) {
      throw mapSarvamError(err, "text-to-speech");
    }
  }

  async *stream(text: string): AsyncIterable<Uint8Array> {
    const client = getSarvamClient(this.env.SARVAM_API_KEY);
    let reader: ReadableStreamDefaultReader<Uint8Array>;
    try {
      const response = await client.textToSpeech.convertStream(this.request(text), SARVAM_REQUEST_OPTIONS);
      const body = response.stream();
      if (!body) throw new Error("Empty text-to-speech stream");
      reader = body.getReader();
    } catch (err) {
      throw mapSarvamError(err, "text-to-speech");
    }
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  }
}

/** Pari repeats herself a lot ("Save ho gaya."); identical text is only paid for once. */
export class CachedTextToSpeech implements TextToSpeech {
  private readonly cache = new Map<string, Buffer>();

  constructor(
    private readonly inner: TextToSpeech,
    private readonly maxEntries = 300,
  ) {}

  private remember(key: string, audio: Buffer): void {
    this.cache.set(key, audio);
    if (this.cache.size > this.maxEntries) this.cache.delete(this.cache.keys().next().value!);
  }

  private hit(key: string): Buffer | undefined {
    const audio = this.cache.get(key);
    if (audio) {
      this.cache.delete(key);
      this.cache.set(key, audio);
    }
    return audio;
  }

  async synthesize(text: string): Promise<Buffer> {
    const key = text.trim();
    const cached = this.hit(key);
    if (cached) return cached;
    const audio = await this.inner.synthesize(key);
    this.remember(key, audio);
    return audio;
  }

  async *stream(text: string): AsyncIterable<Uint8Array> {
    const key = text.trim();
    const cached = this.hit(key);
    if (cached) {
      yield cached;
      return;
    }
    if (!this.inner.stream) {
      yield await this.synthesize(key);
      return;
    }
    const chunks: Uint8Array[] = [];
    for await (const chunk of this.inner.stream(key)) {
      chunks.push(chunk);
      yield chunk;
    }
    this.remember(key, Buffer.concat(chunks));
  }
}
