import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { createContext, type AppContext } from "../src/context.js";
import { openDatabase } from "../src/db/client.js";
import { migrate } from "../src/db/migrate.js";
import { seedDemo } from "../src/db/seed.js";
import { createLogger } from "../src/helpers/logger.js";
import type { ChatMessage, ChatModel } from "../src/llm/chat.js";
import { MockPaytmClient } from "../src/paytm/mock.client.js";
import type { AudioInput, SpeechToText, Transcription } from "../src/stt/saaras.service.js";
import type { TextToSpeech } from "../src/tts/bulbul.service.js";

export const API_KEY = "test-api-key-123";

type Reply = string | ((transcript: string) => string);

/** Returns scripted JSON per transcript, "other" for anything unscripted. */
export class FakeChat implements ChatModel {
  readonly calls: ChatMessage[][] = [];
  constructor(private readonly script: Record<string, Reply> = {}) {}

  set(transcript: string, reply: Reply): void {
    this.script[transcript] = reply;
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    this.calls.push(messages);
    const transcript = messages.find((m) => m.role === "user")!.content;
    const reply = this.script[transcript];
    if (reply === undefined) return JSON.stringify({ intent: "other", customerName: null, totalRupees: null, paidRupees: null, pendingRupees: null });
    return typeof reply === "function" ? reply(transcript) : reply;
  }
}

export const entryJson = (customerName: string, total: number | null, paid: number | null, pending: number | null) =>
  JSON.stringify({ intent: "entry", customerName, totalRupees: total, paidRupees: paid, pendingRupees: pending, items: null });

/** Audio files are "transcribed" by looking up their filename. */
export class FakeStt implements SpeechToText {
  constructor(readonly transcripts: Record<string, string> = {}) {}
  async transcribe(audio: AudioInput): Promise<Transcription> {
    return { transcript: this.transcripts[audio.filename] ?? "", languageCode: "hi-IN" };
  }
}

export class FakeTts implements TextToSpeech {
  readonly spoken: string[] = [];
  async synthesize(text: string): Promise<Buffer> {
    this.spoken.push(text);
    return Buffer.from(`RIFF-fake-${text.length}`);
  }
}

export interface TestContext {
  ctx: AppContext;
  app: ReturnType<typeof createApp>;
  chat: FakeChat;
  stt: FakeStt;
  tts: FakeTts;
  paytm: MockPaytmClient;
  merchantId: string;
  close(): Promise<void>;
}

export async function createTestContext(): Promise<TestContext> {
  const env = loadEnv({ NODE_ENV: "test", PARI_API_KEY: API_KEY, LOG_LEVEL: "silent" });
  const logger = createLogger("silent");
  const database = await openDatabase({ pgliteDir: "memory" });
  await migrate(database);
  const merchant = await seedDemo(database.db, API_KEY);
  const chat = new FakeChat();
  const stt = new FakeStt();
  const tts = new FakeTts();
  const paytm = new MockPaytmClient();
  const ctx = createContext(env, logger, database, { chat, stt, tts, paytm });
  return { ctx, app: createApp(ctx), chat, stt, tts, paytm, merchantId: merchant.id, close: () => database.close() };
}
