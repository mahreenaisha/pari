import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { ConverseResponse, PariEventDto } from "../src/contracts/index.js";
import {
  API_KEY,
  balanceJson,
  createTestContext,
  entryEvent,
  entryJson,
  recordJson,
  repaymentEvent,
  repaymentJson,
  type TestContext,
} from "./helpers.js";

const DECK = "Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki.";
const WAV = Buffer.alloc(4000, 1);

let t: TestContext;
const contexts: TestContext[] = [];
const auth = { "x-api-key": API_KEY };

beforeEach(async () => {
  t = await createTestContext();
  contexts.push(t);
  t.chat.set(DECK, entryJson("Gupta ji", 350, 200, 150));
  t.chat.set("nahi, Gupta ji ka 300 ka saamaan tha, 200 diye", entryJson("Gupta ji", 300, 200, null));
  t.chat.set("Verma ji ko 150 udhaar", entryJson("Verma ji", 150, null, null));
  t.chat.set("Sunita didi 150 baaki", entryJson("Sunita didi", null, null, 150));
});
afterAll(async () => {
  for (const c of contexts) await c.close();
});

async function say(text: string, speak = false): Promise<ConverseResponse> {
  const res = await request(t.app).post("/api/converse").set(auth).send({ text, speak });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as ConverseResponse;
}

/** The deck entry, saved without a link: Gupta ji owes ₹150. */
async function guptaOwes150(): Promise<string> {
  const turn = await say(DECK);
  await say("haan");
  await say("nahi");
  return turn.entry!.id;
}

describe("Pari conversation (deck flow)", () => {
  it("speak -> confirm -> link -> phone -> link paid closes by order id", async () => {
    const events: PariEventDto[] = [];
    t.ctx.events.subscribe(t.merchantId, (e) => events.push(e));

    let turn = await say(DECK, true);
    expect(turn.state).toBe("AWAITING_ENTRY_CONFIRM");
    expect(turn.reply.text).toBe("Gupta ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?");
    expect(turn.entry).toMatchObject({ status: "UNCONFIRMED", pendingRupees: 150 });
    expect(turn.replyAudio).toBeTruthy();

    turn = await say("Haan");
    expect(turn.state).toBe("AWAITING_COLLECT_CHOICE");
    expect(turn.reply.text).toBe("Save ho gaya. ₹150 ka payment link bhejun?");
    expect(turn.entry!.status).toBe("OPEN");

    turn = await say("haan bhej do");
    expect(turn.state).toBe("AWAITING_PHONE");
    expect(turn.reply.text).toBe("Gupta ji ka mobile number bataiye.");

    turn = await say("nau aath saat chhe paanch chaar teen do ek zero");
    expect(turn.state).toBe("AWAITING_PHONE_CONFIRM");
    expect(turn.reply.text).toBe("98765 43210. Sahi hai?");
    expect(turn.reply.speech).toContain("9 8 7 6 5, 4 3 2 1 0");

    turn = await say("haan sahi hai");
    expect(turn.state).toBe("IDLE");
    expect(turn.reply.text).toBe("Link bhej diya. Gupta ji ko ₹150 ka link SMS ho gaya.");
    expect(turn.link).toMatchObject({ amountRupees: 150, phone: "9876543210" });
    expect(t.paytm.sent).toHaveLength(1);

    await request(t.app)
      .post("/api/paytm/callback")
      .type("form")
      .send({ ORDERID: turn.link!.orderId, TXNID: "T-100", TXNAMOUNT: "150.00", STATUS: "TXN_SUCCESS" })
      .expect(200);
    const entry = await request(t.app).get(`/api/entries/${turn.entry!.id}`).set(auth).expect(200);
    expect(entry.body.entry).toMatchObject({ status: "CLOSED", pendingRupees: 0 });
    const announced = events.find((e) => e.type === "payment.received");
    expect(announced && "line" in announced && announced.line.text).toBe("Gupta ji ne ₹150 de diye. Khaata band.");
  });

  it("phone number is asked only once per customer", async () => {
    await say(DECK);
    await say("haan");
    await say("haan");
    await say("9876543210");
    await say("haan");

    await say(DECK);
    await say("haan");
    const turn = await say("haan");
    expect(turn.state).toBe("IDLE");
    expect(turn.reply.text).toContain("Link bhej diya");
  });

  it("'nahi' with a correction re-reads the amounts before saving", async () => {
    await say(DECK);
    const turn = await say("nahi, Gupta ji ka 300 ka saamaan tha, 200 diye");
    expect(turn.state).toBe("AWAITING_ENTRY_CONFIRM");
    expect(turn.reply.text).toBe("Theek kiya. Gupta ji, total ₹300, ₹200 mile, ₹100 baaki. Save karoon?");
    expect(turn.entry).toMatchObject({ status: "UNCONFIRMED", totalRupees: 300, pendingRupees: 100 });
  });

  it("plain 'nahi' cancels; nothing is saved without a yes", async () => {
    const first = await say(DECK);
    const turn = await say("nahi");
    expect(turn).toMatchObject({ state: "IDLE", reply: { text: "Theek hai, entry cancel. Dobara boliye." } });
    const entry = await request(t.app).get(`/api/entries/${first.entry!.id}`).set(auth).expect(200);
    expect(entry.body.entry.status).toBe("REJECTED");
  });

  it("asks again when the answer is unclear, without changing anything", async () => {
    await say(DECK);
    const turn = await say("kal dekhte hain");
    expect(turn.state).toBe("AWAITING_ENTRY_CONFIRM");
    expect(turn.reply.text).toContain("Haan ya nahi boliye");
  });

  it("rejects a number that is not an Indian mobile", async () => {
    await say("Verma ji ko 150 udhaar");
    await say("haan");
    await say("haan");
    const turn = await say("12345 67890");
    expect(turn).toMatchObject({ state: "AWAITING_PHONE", reply: { text: expect.stringContaining("10 digit") } });
  });

  it("declining the link leaves the entry open", async () => {
    await say(DECK);
    await say("haan");
    const turn = await say("nahi, abhi nahi");
    expect(turn).toMatchObject({ state: "IDLE", reply: { text: "Theek hai, link nahi bheja. Entry khuli hai." } });
  });

  it("small talk gets a hint, not an entry", async () => {
    const turn = await say("aaj bahut garmi hai");
    expect(turn.state).toBe("IDLE");
    expect(turn.reply.text).toContain("Aise boliye");
  });

  it("QR paid instead: Pari asks '₹150 aaya, Gupta ji ka?' and the merchant confirms", async () => {
    const prompts: PariEventDto[] = [];
    t.ctx.events.subscribe(t.merchantId, (e) => e.type === "pari.prompt" && prompts.push(e));

    await say(DECK);
    await say("haan");
    await say("nahi");

    await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 150 }).expect(201);
    await new Promise((r) => setTimeout(r, 50));
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({ state: "AWAITING_QR_MATCH", line: { text: "₹150 aaya, Gupta ji ka?" } });

    const turn = await say("haan");
    expect(turn).toMatchObject({
      state: "IDLE",
      reply: { text: "Theek hai, Gupta ji ke khaate mein jod diya. Khaata band." },
      entry: { status: "CLOSED" },
    });
  });

  it("a QR question settled by tap is not asked again by voice", async () => {
    await say(DECK);
    await say("haan");
    await say("nahi");
    const qr = await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 150 }).expect(201);
    await new Promise((r) => setTimeout(r, 50));
    const state = () => request(t.app).get("/api/converse/state").set(auth).expect(200);
    expect((await state()).body.state).toBe("AWAITING_QR_MATCH");

    const { payment, candidates } = qr.body.suggestion;
    await request(t.app).post(`/api/payments/${payment.id}/match`).set(auth).send({ entryId: candidates[0].entry.id }).expect(200);
    expect((await state()).body.state).toBe("IDLE");

    const turn = await say("haan");
    expect(turn.state).toBe("IDLE");
    expect(turn.reply.text).toContain("Aise boliye");
  });

  it("a tap on a different payment leaves the spoken question in place", async () => {
    await say(DECK);
    await say("haan");
    await say("nahi");
    const asked = await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 150 }).expect(201);
    await new Promise((r) => setTimeout(r, 50));
    const other = await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 100 }).expect(201);
    expect(other.body.suggestion.payment.id).not.toBe(asked.body.suggestion.payment.id);

    await request(t.app).post(`/api/payments/${other.body.suggestion.payment.id}/match`).set(auth).send({ reject: true }).expect(200);
    const turn = await say("haan");
    expect(turn).toMatchObject({ state: "IDLE", entry: { status: "CLOSED" } });
  });

  it("QR that arrives mid-conversation is asked right after the current flow ends", async () => {
    await say("Sunita didi 150 baaki");
    await say("haan");
    await say("nahi");
    await say(DECK);
    await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 150, payerName: "Gupta" }).expect(201);

    const stillCollecting = await say("haan");
    expect(stillCollecting.state).toBe("AWAITING_COLLECT_CHOICE");

    const turn = await say("nahi");
    expect(turn.state).toBe("AWAITING_QR_MATCH");
    expect(turn.reply.text).toBe("Theek hai, link nahi bheja. Entry khuli hai. ₹150 aaya, Gupta ji ka?");
  });

  it("'nahi' moves to the next candidate, then keeps the payment aside", async () => {
    await say("Sunita didi 150 baaki");
    await say("haan");
    await say("nahi");
    await say(DECK);
    await say("haan");
    await say("nahi");

    await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 150 }).expect(201);
    await new Promise((r) => setTimeout(r, 50));
    let turn = await say("nahi");
    expect(turn.state).toBe("AWAITING_QR_MATCH");
    expect(turn.reply.text).toMatch(/₹150 aaya, (Gupta ji|Sunita didi) ka\?/);
    turn = await say("nahi");
    expect(turn).toMatchObject({ state: "IDLE", reply: { text: "Theek hai, yeh payment alag rakh diya." } });

    const s = await request(t.app).get("/api/payments/suggestions").set(auth).expect(200);
    expect(s.body.suggestions).toHaveLength(0);
  });

  it("accepts audio turns and returns the transcript", async () => {
    t.stt.transcripts["entry.webm"] = DECK;
    const res = await request(t.app)
      .post("/api/converse")
      .set(auth)
      .field("speak", "false")
      .attach("audio", WAV, { filename: "entry.webm", contentType: "audio/webm" })
      .expect(200);
    expect(res.body).toMatchObject({ transcript: DECK, state: "AWAITING_ENTRY_CONFIRM" });
    expect(res.body.replyAudio).toBeUndefined();
  });

  it("reset drops back to IDLE", async () => {
    await say(DECK);
    await request(t.app).post("/api/converse/reset").set(auth).expect(200);
    const state = await request(t.app).get("/api/converse/state").set(auth).expect(200);
    expect(state.body.state).toBe("IDLE");
  });
});

describe("Pari in the merchant's language", () => {
  const TAMIL = "முருகன் அண்ணா 350 ரூபாய்க்கு சாமான் வாங்கினாரு, 200 கொடுத்தாரு, 150 பாக்கி";

  it("hears Tamil, answers from the Tamil table, and ஆமா confirms", async () => {
    await request(t.app).patch("/api/me").set(auth).send({ language: "ta-IN" }).expect(200);
    t.chat.set(TAMIL, entryJson("Murugan anna", 350, 200, 150));
    t.stt.transcripts["tamil.webm"] = TAMIL;
    const prompts: PariEventDto[] = [];
    t.ctx.events.subscribe(t.merchantId, (e) => e.type === "pari.prompt" && prompts.push(e));

    const res = await request(t.app)
      .post("/api/converse")
      .set(auth)
      .field("speak", "false")
      .attach("audio", WAV, { filename: "tamil.webm", contentType: "audio/webm" })
      .expect(200);
    expect(t.stt.languages).toEqual(["ta-IN"]);
    expect(t.chat.calls[0]![0]!.content).toContain("transcript in Tamil");
    expect(res.body.reply).toEqual({
      text: "புது கணக்கு. Murugan anna, மொத்தம் ₹350, ₹200 வந்துச்சு, ₹150 பாக்கி. save பண்ணட்டுமா?",
      speech: "புது கணக்கு. Murugan anna, மொத்தம் 350 ரூபாய், 200 வந்துச்சு, 150 பாக்கி. save பண்ணட்டுமா?",
      language: "ta-IN",
      key: "entryReadback",
    });
    const saved = await t.ctx.db.selectFrom("ledger_entries").select("language").where("id", "=", res.body.entry.id).executeTakeFirstOrThrow();
    expect(saved.language).toBe("ta-IN");

    let turn = await say("ஆமா");
    expect(turn).toMatchObject({
      state: "AWAITING_COLLECT_CHOICE",
      reply: { text: "save ஆயிடுச்சு. ₹150-க்கு payment link அனுப்பட்டுமா?", language: "ta-IN", key: "savedAskCollect" },
    });
    turn = await say("வேண்டாம்");
    expect(turn).toMatchObject({ state: "IDLE", reply: { key: "collectDeclined", language: "ta-IN" } });

    await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 150, payerName: "Murugan" }).expect(201);
    await new Promise((r) => setTimeout(r, 50));
    expect(prompts[0]).toMatchObject({ line: { text: "₹150 வந்திருக்கு, Murugan anna-ஓடதா?", language: "ta-IN", key: "qrAsk" } });
    turn = await say("சரி");
    expect(turn).toMatchObject({
      state: "IDLE",
      reply: { text: "சரி, Murugan anna கணக்குல சேர்த்துட்டேன். கணக்கு முடிஞ்சது.", key: "qrMatched" },
      entry: { status: "CLOSED" },
    });
  });

  it("takes a Bengali number for the link even though নয় (nine) also means no", async () => {
    const BENGALI = "ঘোষবাবু 350 টাকার জিনিস নিলেন, 200 দিলেন, 150 বাকি";
    await request(t.app).patch("/api/me").set(auth).send({ language: "bn-IN" }).expect(200);
    t.chat.set(BENGALI, entryJson("Ghosh babu", 350, 200, 150));
    await say(BENGALI);
    expect(await say("হ্যাঁ")).toMatchObject({ state: "AWAITING_COLLECT_CHOICE" });

    const turn = await say("নয় আট সাত ছয় পাঁচ চার তিন দুই এক শূন্য");
    expect(turn).toMatchObject({ state: "AWAITING_PHONE_CONFIRM", reply: { key: "phoneReadback", text: expect.stringContaining("98765 43210") } });
  });

  it("keeps Hindi for a merchant who hasn't picked a language", async () => {
    const turn = await say(DECK);
    expect(turn.reply).toMatchObject({ language: "hi-IN", key: "entryReadback" });
  });

  it("hears a Tamil yes that also changes the amount, which digits alone wouldn't show", async () => {
    const TAMIL = "முருகன் அண்ணா முன்னூத்தி ஐம்பது ரூபாய்க்கு வாங்கினாரு, பாக்கி வச்சாரு";
    const CHANGE = "ஆமா, ஆனா இருநூத்தி ஐம்பது கொடுத்தாரு";
    await request(t.app).patch("/api/me").set(auth).send({ language: "ta-IN" }).expect(200);
    t.chat.set(TAMIL, entryJson("Murugan anna", 350, null, null));
    t.chat.set(CHANGE, change(null, null, 250, null));
    await say(TAMIL);

    let turn = await say(CHANGE);
    expect(turn).toMatchObject({ state: "AWAITING_ENTRY_CONFIRM", reply: { key: "entryCorrected", text: expect.stringContaining("₹250") } });
    expect(turn.entry).toMatchObject({ status: "UNCONFIRMED", paidRupees: 250, pendingRupees: 100 });

    const calls = t.chat.calls.length;
    turn = await say("ஆமா");
    expect(turn).toMatchObject({ state: "AWAITING_COLLECT_CHOICE", entry: { status: "OPEN", pendingRupees: 100 } });
    expect(t.chat.calls).toHaveLength(calls);
  });

  it("reads a Tamil repayment back carefully when the amount was said as a word", async () => {
    const REPAID = "முருகன் அண்ணா நூறு ரூபாய் கொடுத்தாரு";
    await request(t.app).patch("/api/me").set(auth).send({ language: "ta-IN" }).expect(200);
    t.chat.set(TAMIL, entryJson("Murugan anna", 350, 200, 150));
    t.chat.set(REPAID, repaymentJson("Murugan anna", 100));
    await say(TAMIL);
    await say("ஆமா");
    await say("வேண்டாம்");

    expect(await say(REPAID)).toMatchObject({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: {
        text: "ஒரு தடவை கவனமா கேளுங்க. Murugan anna கிட்ட இருந்து ₹100 வந்துச்சு. ₹150 பாக்கி இருந்தது, இனி ₹50 பாக்கி. save பண்ணட்டுமா?",
        language: "ta-IN",
      },
      needsReview: true,
    });
    expect(await say("ஆமா")).toMatchObject({ state: "IDLE", reply: { text: "save ஆயிடுச்சு. Murugan anna-க்கு இன்னும் ₹50 பாக்கி." } });
  });
});

/** An answer to a read-back holds only what was said in it. */
const change = entryJson;

describe("Pari at the confirm step", () => {
  it("'haan, lekin 250 diye' corrects the amounts instead of saving the old ones", async () => {
    t.chat.set("haan, lekin 250 diye", change(null, null, 250, null));
    await say(DECK);
    let turn = await say("haan, lekin 250 diye");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Theek kiya. Gupta ji, total ₹350, ₹250 mile, ₹100 baaki. Save karoon?" },
      entry: { status: "UNCONFIRMED", paidRupees: 250 },
      needsReview: false,
    });
    expect(t.chat.calls.at(-1)![0]!.content).toContain("answering Pari's read-back of this entry: Gupta ji, total 350, paid 200, pending 150");

    turn = await say("haan");
    expect(turn).toMatchObject({ state: "AWAITING_COLLECT_CHOICE", reply: { text: "Save ho gaya. ₹100 ka payment link bhejun?" } });
  });

  it("asks again when the model can't place a new number, instead of saving the old amounts", async () => {
    const id = (await say(DECK)).entry!.id;
    const turn = await say("haan, lekin 250 diye");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Kya badalna hai, samajh nahi aaya. Gupta ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?" },
    });
    const saved = await request(t.app).get(`/api/entries/${id}`).set(auth).expect(200);
    expect(saved.body.entry).toMatchObject({ status: "UNCONFIRMED", paidRupees: 200 });
  });

  it("'haan, 350 sahi hai' saves straight away", async () => {
    await say(DECK);
    const calls = t.chat.calls.length;
    const turn = await say("haan, 350 sahi hai");
    expect(turn).toMatchObject({ state: "AWAITING_COLLECT_CHOICE", entry: { status: "OPEN", totalRupees: 350 } });
    expect(t.chat.calls).toHaveLength(calls);
  });

  it("'nahi, Verma ji ka hai' moves the entry to Verma ji", async () => {
    t.chat.set("nahi, Verma ji ka hai", change("Verma ji", null, null, null));
    await say(DECK);
    const turn = await say("nahi, Verma ji ka hai");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Theek kiya. Verma ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?" },
      entry: { status: "UNCONFIRMED", customer: { name: "Verma ji" } },
    });
  });

  it("asks the change again when the new amounts can't be right", async () => {
    t.chat.set("haan, 500 diye", change(null, null, 500, null));
    await say(DECK);
    const turn = await say("haan, 500 diye");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Kya badalna hai, samajh nahi aaya. Gupta ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?" },
    });
  });

  it("someone else's entry waits until this one is done, then gets read back", async () => {
    const first = await say(DECK);
    let turn = await say("Verma ji ko 150 udhaar");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Verma ji wali entry iske baad. Pehle yeh: Gupta ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?" },
    });
    const gupta = await request(t.app).get(`/api/entries/${first.entry!.id}`).set(auth).expect(200);
    expect(gupta.body.entry).toMatchObject({ status: "UNCONFIRMED", customer: { name: "Gupta ji" }, totalRupees: 350 });

    turn = await say("haan");
    expect(turn.state).toBe("AWAITING_COLLECT_CHOICE");
    turn = await say("nahi");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Theek hai, link nahi bheja. Entry khuli hai. Ab agli entry. Verma ji, ₹150 udhaar. Save karoon?" },
      entry: { status: "UNCONFIRMED", customer: { name: "Verma ji" } },
    });
  });

  it("a new entry said over a QR question is read back, and the QR question comes back after", async () => {
    await say(DECK);
    await say("haan");
    await say("nahi");
    await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 150 }).expect(201);
    await new Promise((r) => setTimeout(r, 50));

    let turn = await say("Verma ji ko 150 udhaar");
    expect(turn).toMatchObject({ state: "AWAITING_ENTRY_CONFIRM", reply: { text: "Verma ji, ₹150 udhaar. Save karoon?" } });
    await say("haan");
    turn = await say("nahi");
    expect(turn.state).toBe("AWAITING_QR_MATCH");
    expect(turn.reply.text).toMatch(/^Theek hai, link nahi bheja\. Entry khuli hai\. ₹150 aaya, (Gupta ji|Verma ji) ka\?$/);
  });

  it("a new entry instead of an answer about the link means no link", async () => {
    await say(DECK);
    await say("haan");
    const turn = await say("Sunita didi 150 baaki");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Theek hai, link nahi bheja. Entry khuli hai. Sunita didi, ₹150 udhaar. Save karoon?" },
    });
  });

  it("says which entry went unsaved when the session ran out", async () => {
    await say(DECK);
    t.ctx.conversation.getSession(t.merchantId).updatedAt -= 10 * 60_000;
    const turn = await say("Verma ji ko 150 udhaar");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Gupta ji wali entry save nahi hui thi. Verma ji, ₹150 udhaar. Save karoon?" },
    });
  });
});

describe("Pari and customer names", () => {
  const DIDI = "Gupta didi ne 200 ka saamaan liya";

  it("asks whether Gupta didi is Gupta ji, and opens a new khaata on no", async () => {
    t.chat.set(DIDI, entryJson("Gupta didi", 200, null, null));
    let turn = await say(DIDI);
    expect(turn).toMatchObject({ state: "AWAITING_CUSTOMER_CHOICE", reply: { text: "Gupta didi aur Gupta ji ek hi hain?" } });
    expect(turn.entry).toBeUndefined();

    turn = await say("nahi");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Naya khaata. Gupta didi, ₹200 udhaar. Save karoon?" },
      entry: { customer: { name: "Gupta didi" } },
    });
  });

  it("puts Gupta didi on Gupta ji's khaata when they're the same", async () => {
    t.chat.set(DIDI, entryJson("Gupta didi", 200, null, null));
    await say(DIDI);
    const turn = await say("haan");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Gupta ji, ₹200 udhaar. Save karoon?" },
      entry: { customer: { name: "Gupta ji" } },
    });
  });

  it("tells the merchant when a name opens a new khaata", async () => {
    t.chat.set("Ruta ji ko 150 udhaar", entryJson("Ruta ji", 150, null, null));
    const turn = await say("Ruta ji ko 150 udhaar");
    expect(turn.reply.text).toBe("Naya khaata. Ruta ji, ₹150 udhaar. Save karoon?");
  });

  it("gives the model only names that were saved", async () => {
    t.chat.set("Ruta ji ko 150 udhaar", entryJson("Ruta ji", 150, null, null));
    await say("Ruta ji ko 150 udhaar");
    await say("nahi");

    await say(DECK);
    const prompt = t.chat.calls.at(-1)![0]!.content;
    expect(prompt).toContain("Gupta ji");
    expect(prompt).not.toContain("Ruta ji");
  });
});

describe("Pari takes cash paid back", () => {
  const cash = () =>
    t.ctx.db.selectFrom("payments").select(["entry_id", "amount_paise", "match_status"]).where("source", "=", "CASH").execute();
  const entry = async (id: string) => (await request(t.app).get(`/api/entries/${id}`).set(auth).expect(200)).body.entry;

  beforeEach(() => t.chat.set("Gupta ji ne 100 diye", repaymentJson("Gupta ji", 100)));

  it("reads back what will be left, and saves it against the entry", async () => {
    const id = await guptaOwes150();
    let turn = await say("Gupta ji ne 100 diye");
    expect(turn).toMatchObject({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: { text: "Gupta ji se ₹100 mile. ₹150 baaki tha, ab ₹50 bachega. Save karoon?", key: "repaymentReadback" },
      needsReview: false,
    });
    expect(await cash()).toEqual([]);

    turn = await say("haan");
    expect(turn).toMatchObject({ state: "IDLE", reply: { text: "Save ho gaya. Gupta ji ka ab ₹50 baaki." } });
    expect(await entry(id)).toMatchObject({ status: "OPEN", paidRupees: 300, pendingRupees: 50 });
    expect(await cash()).toEqual([{ entry_id: id, amount_paise: 10000, match_status: "MATCHED" }]);
  });

  it("pays off the oldest entry first", async () => {
    t.chat.set("Gupta ji ko 200 udhaar", entryJson("Gupta ji", 200, null, null));
    t.chat.set("Gupta ji ne 250 diye", repaymentJson("Gupta ji", 250));
    const older = await guptaOwes150();
    const newer = (await say("Gupta ji ko 200 udhaar")).entry!.id;
    await say("haan");
    await say("nahi");

    expect((await say("Gupta ji ne 250 diye")).reply.text).toBe("Gupta ji se ₹250 mile. ₹350 baaki tha, ab ₹100 bachega. Save karoon?");
    expect((await say("haan")).reply.text).toBe("Save ho gaya. Gupta ji ka ab ₹100 baaki.");
    expect(await entry(older)).toMatchObject({ status: "CLOSED", pendingRupees: 0 });
    expect(await entry(newer)).toMatchObject({ status: "OPEN", pendingRupees: 100 });
    expect(await cash()).toHaveLength(2);
  });

  it("records only what was owed, and says how much to hand back", async () => {
    t.chat.set("Gupta ji ne 200 diye", repaymentJson("Gupta ji", 200));
    const id = await guptaOwes150();
    expect((await say("Gupta ji ne 200 diye")).reply.text).toBe(
      "Gupta ji ne ₹200 diye, par udhaar ₹150 hi tha. Khaata band ho jayega, ₹50 wapas dene hain. Save karoon?",
    );
    expect((await say("haan")).reply.text).toBe("Save ho gaya. Gupta ji ka khaata band. ₹50 wapas dena mat bhooliye.");
    expect(await entry(id)).toMatchObject({ status: "CLOSED", pendingRupees: 0 });
    expect(await cash()).toEqual([{ entry_id: id, amount_paise: 15000, match_status: "MATCHED" }]);
  });

  it("takes 'poora' as everything owed", async () => {
    t.chat.set("Gupta ji ne poora chuka diya", repaymentJson("Gupta ji", null, true));
    await guptaOwes150();
    expect((await say("Gupta ji ne poora chuka diya")).reply.text).toBe("Gupta ji se poore ₹150 mile. Khaata band ho jayega. Save karoon?");
    expect((await say("haan")).reply.text).toBe("Save ho gaya. Gupta ji ka khaata band.");
  });

  it("expires a payment link the cash paid off, and says not to pay it", async () => {
    t.chat.set("Gupta ji ne 150 diye", repaymentJson("Gupta ji", 150));
    await say(DECK);
    await say("haan");
    await say("haan");
    await say("9876543210");
    const sent = await say("haan");

    await say("Gupta ji ne 150 diye");
    expect((await say("haan")).reply.text).toBe(
      "Save ho gaya. Gupta ji ka khaata band. Gupta ji ko bata dijiye ki ab payment link se na bharein.",
    );
    const link = await t.ctx.db
      .selectFrom("payment_links")
      .select("status")
      .where("order_id", "=", sent.link!.orderId)
      .executeTakeFirstOrThrow();
    expect(link.status).toBe("EXPIRED");
  });

  it("asks whether QR money of the same amount is this money, so it isn't counted twice", async () => {
    const id = await guptaOwes150();
    await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 100 }).expect(201);
    await new Promise((r) => setTimeout(r, 50));

    let turn = await say("Gupta ji ne 100 diye");
    expect(turn).toMatchObject({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: { text: "QR pe ₹100 aaye hain, abhi kisi khaate mein nahi jude. Kya yeh Gupta ji wale hi hain?", key: "qrSameMoney" },
    });
    turn = await say("haan");
    expect(turn).toMatchObject({ state: "IDLE", reply: { key: "qrMatched" }, entry: { id, pendingRupees: 50 } });
    expect(await cash()).toEqual([]);
  });

  it("records the cash when the QR money was someone else's", async () => {
    const id = await guptaOwes150();
    await request(t.app).post("/api/dev/simulate/qr").set(auth).send({ amountRupees: 100 }).expect(201);
    await new Promise((r) => setTimeout(r, 50));
    await say("Gupta ji ne 100 diye");

    expect(await say("nahi")).toMatchObject({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: { text: "Gupta ji se ₹100 mile. ₹150 baaki tha, ab ₹50 bachega. Save karoon?" },
    });
    expect(await say("haan")).toMatchObject({ state: "IDLE", reply: { text: "Save ho gaya. Gupta ji ka ab ₹50 baaki." } });
    expect(await cash()).toEqual([{ entry_id: id, amount_paise: 10000, match_status: "MATCHED" }]);
  });

  it("'nahi, 120 diye' corrects the amount", async () => {
    t.chat.set("nahi, 120 diye", repaymentJson(null, 120));
    await guptaOwes150();
    await say("Gupta ji ne 100 diye");
    const turn = await say("nahi, 120 diye");
    expect(turn).toMatchObject({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: { text: "Theek kiya. Gupta ji se ₹120 mile. ₹150 baaki tha, ab ₹30 bachega. Save karoon?", key: "repaymentCorrected" },
      needsReview: false,
    });
    expect(t.chat.calls.at(-1)![0]!.content).toContain("answering Pari's read-back of this repayment: Gupta ji paid back 100 rupees");
  });

  it("asks again when the model can't place a new amount, instead of dropping the money", async () => {
    await guptaOwes150();
    await say("Gupta ji ne 100 diye");
    expect(await say("nahi, 120 diye")).toMatchObject({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: { text: "Kya badalna hai, samajh nahi aaya. Gupta ji se ₹100 mile. ₹150 baaki tha, ab ₹50 bachega. Save karoon?" },
    });
    expect(await cash()).toEqual([]);
  });

  it("'nahi, Verma ji ne diye' moves the money to Verma ji", async () => {
    t.chat.set("nahi, Verma ji ne diye", repaymentJson("Verma ji", null));
    await guptaOwes150();
    await say("Verma ji ko 150 udhaar");
    await say("haan");
    await say("nahi");
    await say("Gupta ji ne 100 diye");

    expect((await say("nahi, Verma ji ne diye")).reply.text).toBe("Theek kiya. Verma ji se ₹100 mile. ₹150 baaki tha, ab ₹50 bachega. Save karoon?");
    expect((await say("haan")).reply.text).toBe("Save ho gaya. Verma ji ka ab ₹50 baaki.");
  });

  it("'nahi' drops it, and nothing is recorded", async () => {
    const id = await guptaOwes150();
    await say("Gupta ji ne 100 diye");
    expect(await say("nahi")).toMatchObject({ state: "IDLE", reply: { key: "entryRejected" } });
    expect(await entry(id)).toMatchObject({ pendingRupees: 150 });
    expect(await cash()).toEqual([]);
  });

  it("says so when the customer owes nothing, or has no khaata", async () => {
    t.chat.set("Verma ji ne 100 diye", repaymentJson("Verma ji", 100));
    t.chat.set("Mehta ji ne 100 diye", repaymentJson("Mehta ji", 100));
    expect(await say("Verma ji ne 100 diye")).toMatchObject({ state: "IDLE", reply: { text: "Verma ji ka koi udhaar baaki nahi hai." } });
    expect(await say("Mehta ji ne 100 diye")).toMatchObject({ state: "IDLE", reply: { text: "Mehta ji ka koi khaata nahi mila." } });
    const customers = await t.ctx.db.selectFrom("customers").select("name").execute();
    expect(customers.map((c) => c.name)).not.toContain("Mehta ji");
  });

  it("names a repayment left unsaved when the session ran out", async () => {
    await guptaOwes150();
    await say("Gupta ji ne 100 diye");
    t.ctx.conversation.getSession(t.merchantId).updatedAt -= 10 * 60_000;
    expect((await say("aaj bahut garmi hai")).reply.text).toMatch(/^Gupta ji wali entry save nahi hui thi\. /);
  });
});

describe("Pari asks for what wasn't said", () => {
  beforeEach(() => t.chat.set("200 ka saamaan diya", entryJson(null, 200, null, null)));

  it("asks whose it is, and hears the answer with what came before", async () => {
    t.chat.set("200 ka saamaan diya. Verma ji", entryJson("Verma ji", 200, null, null));
    let turn = await say("200 ka saamaan diya");
    expect(turn).toMatchObject({ state: "AWAITING_NAME", reply: { text: "Kiske naam likhoon?", key: "askName" } });
    turn = await say("Verma ji");
    expect(turn).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Verma ji, ₹200 udhaar. Save karoon?" },
      entry: { transcript: "200 ka saamaan diya. Verma ji", needsReview: false },
    });
  });

  it("asks how much, then reads the repayment back", async () => {
    t.chat.set("Gupta ji ne paise diye", repaymentJson("Gupta ji", null));
    t.chat.set("Gupta ji ne paise diye. 100", repaymentJson("Gupta ji", 100));
    await guptaOwes150();
    expect(await say("Gupta ji ne paise diye")).toMatchObject({ state: "AWAITING_AMOUNT", reply: { text: "Gupta ji, kitne rupaye?" } });
    expect(await say("100")).toMatchObject({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: { text: "Gupta ji se ₹100 mile. ₹150 baaki tha, ab ₹50 bachega. Save karoon?" },
    });
  });

  it("a plain 'nahi' drops what was half said", async () => {
    await say("200 ka saamaan diya");
    const calls = t.chat.calls.length;
    expect(await say("nahi")).toMatchObject({ state: "IDLE", reply: { key: "entryRejected" } });
    expect(t.chat.calls).toHaveLength(calls);
  });

  it("asks for each piece once", async () => {
    t.chat.set("200 ka saamaan diya. pata nahi kaun tha", entryJson(null, 200, null, null));
    await say("200 ka saamaan diya");
    expect(await say("pata nahi kaun tha")).toMatchObject({ state: "IDLE", reply: { key: "notAnEntry" } });
  });
});

describe("Pari hears several things at once", () => {
  it("reads each back in turn", async () => {
    const BOTH = "Gupta ji ne 100 diye, aur Verma ji ko 150 udhaar";
    t.chat.set(BOTH, recordJson(repaymentEvent("Gupta ji", 100), entryEvent("Verma ji", 150, null, null)));
    await guptaOwes150();
    expect(await say(BOTH)).toMatchObject({
      state: "AWAITING_PAYMENT_CONFIRM",
      reply: { text: "Gupta ji se ₹100 mile. ₹150 baaki tha, ab ₹50 bachega. Save karoon?" },
    });
    expect(await say("haan")).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Save ho gaya. Gupta ji ka ab ₹50 baaki. Ab agli entry. Verma ji, ₹150 udhaar. Save karoon?" },
    });
  });

  it("answers one it can't read back, and goes on to the next", async () => {
    const BOTH = "Mehta ji ne 100 diye, aur Verma ji ko 150 udhaar";
    t.chat.set(BOTH, recordJson(repaymentEvent("Mehta ji", 100), entryEvent("Verma ji", 150, null, null)));
    expect(await say(BOTH)).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Mehta ji ka koi khaata nahi mila. Ab agli entry. Verma ji, ₹150 udhaar. Save karoon?" },
    });
  });

  it("a repayment said at an entry's read-back waits its turn", async () => {
    t.chat.set("haan, aur Verma ji ne 50 diye", recordJson(repaymentEvent("Verma ji", 50)));
    await say("Verma ji ko 150 udhaar");
    await say("haan");
    await say("nahi");
    await say(DECK);
    expect(await say("haan, aur Verma ji ne 50 diye")).toMatchObject({
      state: "AWAITING_ENTRY_CONFIRM",
      reply: { text: "Verma ji wali entry iske baad. Pehle yeh: Gupta ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?" },
    });
  });
});

describe("Pari answers what's owed", () => {
  it("for one customer", async () => {
    t.chat.set("Gupta ji ka kitna baaki hai?", balanceJson("Gupta ji"));
    t.chat.set("Verma ji ka kitna baaki hai?", balanceJson("Verma ji"));
    await guptaOwes150();
    expect(await say("Gupta ji ka kitna baaki hai?")).toMatchObject({
      state: "IDLE",
      reply: { text: "Gupta ji ka ₹150 baaki hai.", key: "customerOwes" },
    });
    expect((await say("Verma ji ka kitna baaki hai?")).reply.text).toBe("Verma ji ka koi udhaar baaki nahi hai.");
  });

  it("for the whole shop", async () => {
    t.chat.set("kul kitna udhaar hai?", balanceJson(null));
    expect((await say("kul kitna udhaar hai?")).reply.text).toBe("Abhi kisi ka udhaar baaki nahi hai.");
    await guptaOwes150();
    expect((await say("kul kitna udhaar hai?")).reply.text).toBe("Kul ₹150 baaki hai, ek hi khaate mein.");
    await say("Verma ji ko 150 udhaar");
    await say("haan");
    await say("nahi");
    expect((await say("kul kitna udhaar hai?")).reply.text).toBe("Kul ₹300 baaki hai, 2 khaaton mein.");
  });
});
