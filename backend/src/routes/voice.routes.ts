import { Router } from "express";
import { VoiceEntryTextBody, type VoiceEntryResponse } from "../contracts/index.js";
import { toEntryDto } from "../contracts/mappers.js";
import type { AppContext } from "../context.js";
import { merchantId } from "../helpers/auth.js";
import { AppError } from "../helpers/errors.js";
import { audioFromRequest, audioUpload, boolField } from "../helpers/upload.js";
import { assertExtractionEntry } from "../llm/extractor.js";
import { lines } from "../llm/readback.js";
import { createUnconfirmedEntry, findOrCreateCustomer, listCustomers } from "../ledger/repository.js";
import { toPaise } from "../ledger/state.js";

/** Single-shot entry creation, for clients that drive the confirm step themselves. */
export function voiceRoutes(ctx: AppContext): Router {
  const router = Router();

  router.post("/voice/entry", audioUpload, async (req, res) => {
    const mid = merchantId(req);
    const audio = audioFromRequest(req);
    let transcript: string;
    let language: string | null = null;
    let speak: boolean;
    if (audio) {
      const result = await ctx.stt.transcribe(audio);
      transcript = result.transcript;
      language = result.languageCode;
      speak = boolField(req.body?.speak, true);
      if (!transcript) throw new AppError(422, "NOTHING_HEARD", "No speech was recognised in the clip");
    } else {
      const body = VoiceEntryTextBody.parse(req.body);
      transcript = body.text;
      speak = body.speak;
    }

    const customers = await listCustomers(ctx.db, mid);
    const result = await ctx.extractor.extract(
      transcript,
      customers.map((c) => c.name),
    );
    assertExtractionEntry(result);
    const { customer } = await findOrCreateCustomer(ctx.db, mid, result.extraction.customerName);
    const entry = await createUnconfirmedEntry(ctx.db, {
      merchantId: mid,
      customerId: customer.id,
      totalPaise: toPaise(result.extraction.totalRupees),
      paidPaise: toPaise(result.extraction.paidRupees),
      pendingPaise: toPaise(result.extraction.pendingRupees),
      transcript,
      language,
      needsReview: result.needsReview,
    });
    const dto = toEntryDto(entry);
    const readback = lines.entryReadback(
      { customerName: dto.customer.name, totalRupees: dto.totalRupees, paidRupees: dto.paidRupees, pendingRupees: dto.pendingRupees },
      result.needsReview,
    );
    const body: VoiceEntryResponse = {
      transcript,
      entry: dto,
      readback,
      needsReview: result.needsReview,
      unverifiedFields: result.unverifiedFields,
    };
    if (speak) body.readbackAudio = (await ctx.tts.synthesize(readback.speech)).toString("base64");
    res.status(201).json(body);
  });

  return router;
}
