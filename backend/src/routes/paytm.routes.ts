import express, { Router } from "express";
import type { AppContext } from "../context.js";

/** Paytm posts form-encoded fields; authenticated by CHECKSUMHASH, not by API key. */
export function paytmRoutes(ctx: AppContext): Router {
  const router = Router();

  router.post("/paytm/callback", express.urlencoded({ extended: false }), express.json(), async (req, res) => {
    const fields = Object.fromEntries(
      Object.entries((req.body ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
    );
    const notice = ctx.paytm.parseCallback(fields);
    if (!notice) {
      ctx.logger.warn({ orderId: fields.ORDERID }, "paytm callback with invalid signature");
      res.status(400).json({ error: { code: "INVALID_SIGNATURE", message: "Checksum verification failed" } });
      return;
    }
    const outcome = await ctx.reconciler.handleLinkPayment(notice);
    ctx.logger.info({ txnId: notice.txnId, outcome: outcome.status }, "paytm callback handled");
    res.json({ ok: true, outcome: outcome.status });
  });

  return router;
}
