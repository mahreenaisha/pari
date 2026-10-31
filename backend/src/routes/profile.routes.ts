import { Router } from "express";
import { PatchMeBody } from "../contracts/index.js";
import { toMerchantDto } from "../contracts/mappers.js";
import type { AppContext } from "../context.js";
import { currentMerchant } from "../helpers/auth.js";

export function profileRoutes(ctx: AppContext): Router {
  const router = Router();

  /** The shop the API key belongs to, what its QR code carries, and the language Pari speaks. */
  router.get("/me", async (req, res) => {
    const merchant = currentMerchant(req);
    const language = await ctx.languages.chosen(merchant.id);
    res.json(toMerchantDto({ ...merchant, language }, ctx.env.PARI_UPI_ID));
  });

  /** Picks the language Pari hears and speaks, for every client and for payment announcements. */
  router.patch("/me", async (req, res) => {
    const merchant = currentMerchant(req);
    const { language } = PatchMeBody.parse(req.body);
    await ctx.languages.set(merchant.id, language);
    res.json(toMerchantDto({ ...merchant, language }, ctx.env.PARI_UPI_ID));
  });

  return router;
}
