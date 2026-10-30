import { Router } from "express";
import { ConverseTextBody, type ConverseResponse } from "../contracts/index.js";
import type { AppContext } from "../context.js";
import { merchantId } from "../helpers/auth.js";
import { AppError } from "../helpers/errors.js";
import { audioFromRequest, audioUpload, boolField } from "../helpers/upload.js";

export function converseRoutes(ctx: AppContext): Router {
  const router = Router();

  /** One turn with Pari: JSON `{ text }` or multipart `audio`. */
  router.post("/converse", audioUpload, async (req, res) => {
    const mid = merchantId(req);
    const audio = audioFromRequest(req);
    let text: string;
    let speak: boolean;
    let transcript: string | undefined;
    let sttMs: number | undefined;
    let t = performance.now();
    if (audio) {
      const result = await ctx.stt.transcribe(audio);
      sttMs = Math.round(performance.now() - t);
      transcript = result.transcript;
      text = result.transcript;
      speak = boolField(req.body?.speak, true);
      if (!text) throw new AppError(422, "NOTHING_HEARD", "No speech was recognised in the clip");
    } else {
      const body = ConverseTextBody.parse(req.body);
      text = body.text;
      speak = body.speak;
    }

    t = performance.now();
    const turn = await ctx.conversation.handle(mid, text);
    const thinkMs = Math.round(performance.now() - t);
    const body: ConverseResponse = {
      sessionId: turn.sessionId,
      state: turn.state,
      reply: turn.reply,
      ...(transcript !== undefined ? { transcript } : {}),
      ...(turn.entry ? { entry: turn.entry } : {}),
      ...(turn.link ? { link: turn.link } : {}),
      ...(turn.needsReview !== undefined ? { needsReview: turn.needsReview } : {}),
    };
    body.timings = { thinkMs, ...(sttMs !== undefined ? { sttMs } : {}) };
    if (speak) {
      t = performance.now();
      body.replyAudio = (await ctx.tts.synthesize(turn.reply.speech)).toString("base64");
      body.timings.ttsMs = Math.round(performance.now() - t);
    }
    res.json(body);
  });

  router.get("/converse/state", (req, res) => {
    const session = ctx.conversation.getSession(merchantId(req));
    res.json({ sessionId: session.id, state: session.state, entryId: session.entryId });
  });

  router.post("/converse/reset", (req, res) => {
    const session = ctx.conversation.reset(merchantId(req));
    res.json({ sessionId: session.id, state: session.state });
  });

  return router;
}
