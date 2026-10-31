import { Router } from "express";
import { DeclineBody, MatchBody } from "../contracts/index.js";
import type { AppContext } from "../context.js";
import { merchantId } from "../helpers/auth.js";
import { getEntry } from "../ledger/repository.js";

export function paymentsRoutes(ctx: AppContext): Router {
  const router = Router();

  /** `asking` is the payment and entry Pari is asking about aloud, so the QR tab can show the same question. */
  router.get("/payments/suggestions", async (req, res) => {
    const mid = merchantId(req);
    res.json({ suggestions: await ctx.reconciler.getSuggestions(mid), asking: ctx.conversation.qrQuestion(mid) });
  });

  router.post("/payments/:id/match", async (req, res) => {
    const mid = merchantId(req);
    const body = MatchBody.parse(req.body);
    const result =
      "entryId" in body
        ? await ctx.reconciler.matchPayment(mid, req.params.id, body.entryId)
        : await ctx.reconciler.dismissPayment(mid, req.params.id, "REJECTED");
    await ctx.conversation.releasePayment(mid, result.payment.id);
    res.json(result);
  });

  /** `line` is set when that was the last suggestion and the payment was kept aside. */
  router.post("/payments/:id/decline", async (req, res) => {
    const mid = merchantId(req);
    const { entryId } = DeclineBody.parse(req.body);
    const entry = await getEntry(ctx.db, mid, entryId);
    const line = await ctx.conversation.declinePayment(mid, req.params.id, entry.id);
    res.json(line ? { line } : {});
  });

  return router;
}
