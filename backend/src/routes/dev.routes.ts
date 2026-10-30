import { randomBytes } from "node:crypto";
import { Router } from "express";
import { SimulateLinkPaidBody, SimulateQrBody } from "../contracts/index.js";
import { toEntryDto } from "../contracts/mappers.js";
import type { AppContext } from "../context.js";
import { merchantId } from "../helpers/auth.js";
import { AppError } from "../helpers/errors.js";
import { getEntry } from "../ledger/repository.js";
import { toPaise } from "../ledger/state.js";

/** Payment simulators. Mounted only when PARI_PAYTM_MODE=mock; they run the same reconciler as real callbacks. */
export function devRoutes(ctx: AppContext): Router {
  const router = Router();

  router.post("/dev/simulate/link-paid", async (req, res) => {
    const mid = merchantId(req);
    const body = SimulateLinkPaidBody.parse(req.body);
    let link;
    if (body.orderId) {
      link = await ctx.db.selectFrom("payment_links").selectAll().where("order_id", "=", body.orderId).executeTakeFirst();
    } else {
      const entry = await getEntry(ctx.db, mid, body.entryId!);
      link = await ctx.db
        .selectFrom("payment_links")
        .selectAll()
        .where("entry_id", "=", entry.id)
        .orderBy("created_at", "desc")
        .executeTakeFirst();
    }
    if (!link) throw new AppError(404, "NO_LINK", "No payment link found. Send one first with collect.");

    const { pending_paise } = await getEntry(ctx.db, mid, link.entry_id);
    const amountPaise =
      body.amountRupees !== undefined ? toPaise(body.amountRupees) : Math.min(link.amount_paise, pending_paise) || link.amount_paise;
    const outcome = await ctx.reconciler.handleLinkPayment({
      txnId: `SIM${Date.now()}${randomBytes(3).toString("hex")}`,
      status: "TXN_SUCCESS",
      amountPaise,
      references: [link.order_id],
      raw: { simulated: "true" },
    });
    res.json({ outcome, entry: toEntryDto(await getEntry(ctx.db, mid, link.entry_id)) });
  });

  router.post("/dev/simulate/qr", async (req, res) => {
    const body = SimulateQrBody.parse(req.body);
    const suggestion = await ctx.reconciler.handleQrPayment(merchantId(req), {
      amountPaise: toPaise(body.amountRupees),
      payerName: body.payerName,
    });
    res.status(201).json({ suggestion });
  });

  return router;
}
