import { Router } from "express";
import { VoiceEntryTextBody, type VoiceEntryResponse } from "../contracts/index.js";
import { toEntryDto } from "../contracts/mappers.js";
import type { AppContext } from "../context.js";
import { merchantId } from "../helpers/auth.js";
import { AppError } from "../helpers/errors.js";
import { audioFromRequest, audioUpload, boolField } from "../helpers/upload.js";
import { firstEntry, KNOWN_CUSTOMERS } from "../llm/extractor.js";
import { linesFor } from "../llm/lines/index.js";
import { createUnconfirmedEntry, findOrCreateCustomer, knownCustomerNames } from "../ledger/repository.js";
import { toPaise } from "../ledger/state.js";

/** Single-shot entry creation, for clients that drive the confirm step themselves. */
export function voiceRoutes(ctx: AppContext): Router {
  const router = Router();

  router.post("/voice/entry", audioUpload, async (req, res) => {
    const mid = merchantId(req);
    const language = await ctx.languages.get(mid);
    const audio = audioFromRequest(req);
    let transcript: string;
    let speak: boolean;
    if (audio) {
      transcript = (await ctx.stt.transcribe(audio, { language })).transcript;
      speak = boolField(req.body?.speak, true);
      if (!transcript) throw new AppError(422, "NOTHING_HEARD", "No speech was recognised in the clip");
    } else {
      const body = VoiceEntryTextBody.parse(req.body);
      transcript = body.text;
      speak = body.speak;
    }

    const heard = firstEntry(await ctx.extractor.extract(transcript, await knownCustomerNames(ctx.db, mid, KNOWN_CUSTOMERS), language));
    const { customer } = await findOrCreateCustomer(ctx.db, mid, heard.extraction.customerName);
    const entry = await createUnconfirmedEntry(ctx.db, {
      merchantId: mid,
      customerId: customer.id,
      totalPaise: toPaise(heard.extraction.totalRupees),
      paidPaise: toPaise(heard.extraction.paidRupees),
      pendingPaise: toPaise(heard.extraction.pendingRupees),
      transcript,
      language,
      needsReview: heard.needsReview,
    });
    const dto = toEntryDto(entry);
    const readback = linesFor(language).entryReadback(
      { customerName: dto.customer.name, totalRupees: dto.totalRupees, paidRupees: dto.paidRupees, pendingRupees: dto.pendingRupees },
      heard.needsReview,
    );
    const body: VoiceEntryResponse = {
      transcript,
      entry: dto,
      readback,
      needsReview: heard.needsReview,
      unverifiedFields: heard.unverifiedFields,
    };
    if (speak) body.readbackAudio = (await ctx.tts.synthesize(readback.speech, readback.language)).toString("base64");
    res.status(201).json(body);
  });

  return router;
}
