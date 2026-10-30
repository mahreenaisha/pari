import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ApiError, PariApi } from "../src/cli/api.js";
import type { PariEventDto } from "../src/contracts/index.js";
import { API_KEY, createTestContext, entryJson, type TestContext } from "./helpers.js";

const GUPTA = "Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki.";
const VERMA = "Verma ji ne 500 ka saman liya, 300 diye, 200 baaki.";

async function until<T>(read: () => T | undefined, ms = 3000): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const value = read();
    if (value !== undefined) return value;
    if (Date.now() > deadline) throw new Error("timed out waiting for event");
    await new Promise((r) => setTimeout(r, 20));
  }
}

/** Real HTTP server + the CLI's own client, mock Paytm, scripted LLM. */
describe("end to end (mock mode)", () => {
  let t: TestContext;
  let server: Server;
  let api: PariApi;
  const events: PariEventDto[] = [];
  const stop = new AbortController();

  beforeAll(async () => {
    t = await createTestContext();
    t.chat.set(GUPTA, entryJson("Gupta ji", 350, 200, 150));
    t.chat.set(VERMA, entryJson("Verma ji", 500, 300, 200));
    server = t.app.listen(0);
    await new Promise((r) => server.once("listening", r));
    api = new PariApi(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, API_KEY);
    let ready = false;
    void api
      .streamEvents((e) => (e.type === "ready" ? (ready = true) : events.push(e)), stop.signal)
      .catch(() => {});
    await until(() => (ready ? true : undefined));
  });

  afterAll(async () => {
    stop.abort();
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    await t.close();
  });

  it("speak -> confirm -> collect -> link paid closes the entry", async () => {
    const spoken = await api.voiceEntryText(GUPTA, true);
    expect(spoken.entry).toMatchObject({ customer: { name: "Gupta ji" }, status: "UNCONFIRMED", totalRupees: 350, paidRupees: 200, pendingRupees: 150 });
    expect(spoken.needsReview).toBe(false);
    expect(spoken.readbackAudio).toBeTruthy();
    const id = spoken.entry.shortId;

    const { entry: confirmed } = await api.confirm(id, "yes");
    expect(confirmed.status).toBe("OPEN");

    await expect(api.collect(id)).rejects.toMatchObject({ code: "PHONE_REQUIRED" } satisfies Partial<ApiError>);
    await expect(api.collect(id, "12345 67890")).rejects.toMatchObject({ code: "INVALID_PHONE" });
    const { link } = await api.collect(id, "98765 43210");
    expect(link).toMatchObject({ amountRupees: 150, phone: "9876543210", status: "ACTIVE" });
    expect(t.paytm.sent).toHaveLength(1);

    const part = await api.simulateLinkPaid(id, 100);
    expect(part.entry).toMatchObject({ status: "OPEN", pendingRupees: 50 });
    const rest = await api.simulateLinkPaid(id);
    expect(rest.entry).toMatchObject({ status: "CLOSED", paidRupees: 350, pendingRupees: 0 });

    const received = await until(() => {
      const hits = events.filter((e) => e.type === "payment.received");
      return hits.length >= 2 ? hits : undefined;
    });
    expect(received.at(-1)).toMatchObject({ entry: { status: "CLOSED" } });

    const closed = await api.entries("CLOSED");
    expect(closed.entries.map((e) => e.shortId)).toContain(id);
  });

  it("QR payment: Pari asks over SSE, the merchant says haan, the entry closes", async () => {
    const first = await api.converseText(VERMA, false);
    const entryId = first.entry!.id;
    await api.converseText("haan", false);
    const declined = await api.converseText("nahi", false);
    expect(declined.state).toBe("IDLE");

    await api.simulateQr(200, "Verma");
    const prompt = await until(() => events.find((e) => e.type === "pari.prompt"));
    expect(prompt).toMatchObject({ state: "AWAITING_QR_MATCH" });
    expect(prompt.type === "pari.prompt" && prompt.line.text).toContain("₹200 aaya, Verma ji ka?");

    const yes = await api.converseText("haan", false);
    expect(yes.state).toBe("IDLE");
    expect((await api.entry(entryId)).entry).toMatchObject({ status: "CLOSED", pendingRupees: 0 });
  });

  it("an unknown QR amount stays unmatched and is announced", async () => {
    await api.simulateQr(77);
    const announce = await until(() => events.find((e) => e.type === "pari.announce" && e.line.text.includes("77")));
    expect(announce).toBeTruthy();
    expect((await api.suggestions()).suggestions).toHaveLength(0);
  });

  it("reports a dead server as API_UNREACHABLE", async () => {
    await expect(new PariApi("http://127.0.0.1:9", API_KEY).health()).rejects.toMatchObject({ code: "API_UNREACHABLE" });
  });
});
