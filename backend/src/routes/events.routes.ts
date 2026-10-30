import { Router } from "express";
import type { AppContext } from "../context.js";
import { merchantId } from "../helpers/auth.js";

/** Server-sent events. Event names are `pari.<type>`, e.g. `pari.payment.received`. */
export function eventsRoutes(ctx: AppContext): Router {
  const router = Router();

  router.get("/events", (req, res) => {
    const mid = merchantId(req);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`event: pari.ready\ndata: ${JSON.stringify({ state: ctx.conversation.getSession(mid).state })}\n\n`);

    const unsubscribe = ctx.events.subscribe(mid, (event) => {
      const name = event.type.startsWith("pari.") ? event.type : `pari.${event.type}`;
      res.write(`event: ${name}\ndata: ${JSON.stringify(event)}\n\n`);
    });
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 20_000);
    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  return router;
}
