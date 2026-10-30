import { Router } from "express";
import { TtsBody, type SttResponse } from "../contracts/index.js";
import type { AppContext } from "../context.js";
import { AppError } from "../helpers/errors.js";
import { audioFromRequest, audioUpload } from "../helpers/upload.js";

export function speechRoutes(ctx: AppContext): Router {
  const router = Router();

  /** Plain transcription. */
  router.post("/stt", audioUpload, async (req, res) => {
    const audio = audioFromRequest(req);
    if (!audio) throw new AppError(400, "AUDIO_REQUIRED", "Send the clip as multipart field 'audio'");
    const result = await ctx.stt.transcribe(audio);
    const body: SttResponse = { transcript: result.transcript, languageCode: result.languageCode };
    res.json(body);
  });

  /** WAV for any line Pari should say, e.g. `speech` from an SSE prompt. Cached by text. */
  router.post("/tts", async (req, res) => {
    const { text } = TtsBody.parse(req.body);
    const audio = await ctx.tts.synthesize(text);
    res.type("audio/wav").send(audio);
  });

  /**
   * Same WAV, streamed while Bulbul generates it, so playback starts ~1s
   * sooner. Works as an <audio src> too: /api/tts/stream?text=...&key=...
   */
  router.get("/tts/stream", async (req, res) => {
    const { text } = TtsBody.parse({ text: req.query.text });
    const chunks = ctx.tts.stream ? ctx.tts.stream(text) : (async function* () { yield await ctx.tts.synthesize(text); })();
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
