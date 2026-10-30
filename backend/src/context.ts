import type { Env } from "./config/env.js";
import { ConversationEngine } from "./conversation/session.js";
import type { Database } from "./db/client.js";
import { EventBus } from "./events/bus.js";
import type { Logger } from "./helpers/logger.js";
import { CollectService } from "./ledger/collect.js";
import { Reconciler } from "./ledger/reconciler.js";
import type { Db } from "./ledger/repository.js";
import type { ChatModel } from "./llm/chat.js";
import { EntryExtractor } from "./llm/extractor.js";
import { SarvamChatModel } from "./llm/sarvam-chat.js";
import type { PaytmClient } from "./paytm/client.js";
import { MockPaytmClient } from "./paytm/mock.client.js";
import { SandboxPaytmClient } from "./paytm/sandbox.client.js";
import { SaarasSpeechToText, type SpeechToText } from "./stt/saaras.service.js";
import { BulbulTextToSpeech, CachedTextToSpeech, type TextToSpeech } from "./tts/bulbul.service.js";

export interface AppContext {
  env: Env;
  logger: Logger;
  database: Database;
  db: Db;
  stt: SpeechToText;
  tts: TextToSpeech;
  chat: ChatModel;
  extractor: EntryExtractor;
  paytm: PaytmClient;
  events: EventBus;
  reconciler: Reconciler;
  collect: CollectService;
  conversation: ConversationEngine;
}

export interface ContextOverrides {
  stt?: SpeechToText;
  tts?: TextToSpeech;
  chat?: ChatModel;
  paytm?: PaytmClient;
}

export function createContext(env: Env, logger: Logger, database: Database, overrides: ContextOverrides = {}): AppContext {
  const db = database.db;
  const events = new EventBus();
  const stt = overrides.stt ?? new SaarasSpeechToText(env);
  const tts = new CachedTextToSpeech(overrides.tts ?? new BulbulTextToSpeech(env));
  const chat = overrides.chat ?? new SarvamChatModel(env);
  const paytm =
    overrides.paytm ?? (env.PARI_PAYTM_MODE === "sandbox" ? new SandboxPaytmClient(env) : new MockPaytmClient(logger));
  const extractor = new EntryExtractor(chat);
  const reconciler = new Reconciler(db, events, logger);
  const collect = new CollectService(db, paytm, events);
  const conversation = new ConversationEngine({ db, extractor, reconciler, collect, events, logger });
  return { env, logger, database, db, stt, tts, chat, extractor, paytm, events, reconciler, collect, conversation };
}
