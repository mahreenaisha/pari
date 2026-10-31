import { Router } from "express";
import { TtsBody, type SttResponse } from "../contracts/index.js";
import type { AppContext } from "../context.js";
import { merchantId } from "../helpers/auth.js";
import { AppError } from "../helpers/errors.js";
import { audioFromRequest, audioUpload } from "../helpers/upload.js";

export function speechRoutes(ctx: AppContext): Router {
  const router = Router();

  /** Plain transcription, in the merchant's language. */
  router.post("/stt", audioUpload, async (req, res) => {
    const audio = audioFromRequest(req);
    if (!audio) throw new AppError(400, "AUDIO_REQUIRED", "Send the clip as multipart field 'audio'");
    const result = await ctx.stt.transcribe(audio, { language: await ctx.languages.get(merchantId(req)) });
    const body: SttResponse = { transcript: result.transcript, languageCode: result.languageCode };
    res.json(body);
  });

  /** WAV for any line Pari should say, e.g. `speech` and `language` from an SSE prompt. Cached by text and language. */
  router.post("/tts", async (req, res) => {
    const body = TtsBody.parse(req.body);
    const language = body.language ?? (await ctx.languages.get(merchantId(req)));
    const audio = await ctx.tts.synthesize(body.text, language);
    res.type("audio/wav").send(audio);
  });

  /**
   * Same WAV, streamed while Bulbul generates it, so playback starts ~1s
   * sooner. Works as an <audio src> too: /api/tts/stream?text=...&language=...&key=...
   */
  router.get("/tts/stream", async (req, res) => {
    const body = TtsBody.parse({ text: req.query.text, language: req.query.language });
    const text = body.text;
    const language = body.language ?? (await ctx.languages.get(merchantId(req)));
    const chunks = ctx.tts.stream
      ? ctx.tts.stream(text, language)
      : (async function* () { yield await ctx.tts.synthesize(text, language); })();
    const iterator = chunks[Symbol.asyncIterator]();
    const first = await iterator.next();
    res.type("audio/wav").setHeader("Cache-Control", "no-store");
    if (!first.done) res.write(first.value);
    try {
      for (let next = await iterator.next(); !next.done; next = await iterator.next()) {
        if (!res.write(next.value)) await new Promise((r) => res.once("drain", r));
      }
    } catch (err) {
      ctx.logger.warn({ err }, "tts stream broke off");
    }
    res.end();
  });

  return router;
}
