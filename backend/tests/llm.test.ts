import { describe, expect, it } from "vitest";
import { EntryExtractor } from "../src/llm/extractor.js";
import { detectYesNo } from "../src/llm/intent.js";
import {
  checkAmountsAgainstTranscript,
  extractNumbers,
  formatRupees,
  parseIndianMobile,
  phoneForSpeech,
} from "../src/llm/numbers.js";
import { lines } from "../src/llm/readback.js";
import { completeAmounts } from "../src/llm/schemas.js";
import { entryJson, FakeChat } from "./helpers.js";

const DECK = "Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki.";

describe("extractNumbers", () => {
  it.each([
    [DECK, [350, 200, 150]],
    ["गुप्ता जी ने 350 का सामान लिया, 200 UPI दिया, 150 बाकी।", [350, 200, 150]],
    ["₹1,250 ka saamaan", [1250]],
    ["saade teen sau ka saamaan", [350]],
    ["dedh sau baaki", [150]],
    ["dhai hazaar", [2500]],
    ["paanch sau pachas", [550]],
    ["do hazaar", [2000]],
    ["do sau pachas", [250]],
    ["२०० दिए", [200]],
    ["5 hazaar", [5000]],
  ])("%s", (text, expected) => {
    expect(extractNumbers(text)).toEqual(expected);
  });

  it("does not read the verb 'do' (give) as 2", () => {
    expect(extractNumbers("link bhej do")).toEqual([]);
  });
});

describe("checkAmountsAgainstTranscript", () => {
  it("passes when every amount was spoken", () => {
    expect(checkAmountsAgainstTranscript({ total: 350, paid: 200, pending: 150 }, DECK).verified).toBe(true);
  });

  it("accepts a derived pending when total and paid were spoken", () => {
    expect(checkAmountsAgainstTranscript({ total: 350, paid: 200, pending: 150 }, "Gupta ji 350 ka saamaan, 200 diye").verified).toBe(true);
  });

  it("flags a misheard amount (350 heard as 355)", () => {
    const check = checkAmountsAgainstTranscript({ total: 355, paid: 200, pending: 155 }, DECK);
    expect(check.verified).toBe(false);
    expect(check.unverifiedFields).toEqual(expect.arrayContaining(["total", "pending"]));
  });
});

describe("parseIndianMobile", () => {
  it.each([
    ["98765 43210", "9876543210"],
    ["+91 98765-43210", "9876543210"],
    ["09876543210", "9876543210"],
    ["nau aath saat chhe paanch chaar teen do ek zero", "9876543210"],
    ["nine eight double seven six five four three two one", "9877654321"],
    ["नौ आठ सात छह पांच चार तीन दो एक शून्य", "9876543210"],
    ["haan, number hai 9876543210", "9876543210"],
  ])("%s", (text, expected) => {
    expect(parseIndianMobile(text)).toBe(expected);
  });

  it.each(["12345 67890", "98765", "haan bhejo"])("rejects %s", (text) => {
    expect(parseIndianMobile(text)).toBeNull();
  });

  it("formats digits for speech", () => {
    expect(phoneForSpeech("9876543210")).toBe("9 8 7 6 5, 4 3 2 1 0");
  });
});

describe("detectYesNo", () => {
  it.each([
    ["Haan", "yes"],
    ["haan ji, save karo", "yes"],
    ["theek hai", "yes"],
    ["हाँ", "yes"],
    ["bilkul bhej do", "yes"],
    ["nahi", "no"],
    ["theek nahi hai", "no"],
    ["नहीं, गलत है", "no"],
    ["mat bhejo", "no"],
    ["Gupta ji ka 300", "unknown"],
    ["kal aana", "unknown"],
  ])("%s -> %s", (text, expected) => {
    expect(detectYesNo(text)).toBe(expected);
  });
});

describe("completeAmounts", () => {
  const raw = (t: number | null, p: number | null, q: number | null) =>
    ({ intent: "entry", customerName: "x", totalRupees: t, paidRupees: p, pendingRupees: q }) as const;
  it("fills the one missing value", () => {
    expect(completeAmounts(raw(350, 200, null))).toEqual({ totalRupees: 350, paidRupees: 200, pendingRupees: 150 });
    expect(completeAmounts(raw(350, null, 150))).toEqual({ totalRupees: 350, paidRupees: 200, pendingRupees: 150 });
    expect(completeAmounts(raw(null, 200, 150))).toEqual({ totalRupees: 350, paidRupees: 200, pendingRupees: 150 });
  });
  it("treats a lone amount as pure udhar", () => {
    expect(completeAmounts(raw(500, null, null))).toEqual({ totalRupees: 500, paidRupees: 0, pendingRupees: 500 });
    expect(completeAmounts(raw(null, null, 150))).toEqual({ totalRupees: 150, paidRupees: 0, pendingRupees: 150 });
  });
});

describe("EntryExtractor", () => {
  it("extracts the deck example and verifies it", async () => {
    const chat = new FakeChat({ [DECK]: entryJson("Gupta ji", 350, 200, 150) });
    const result = await new EntryExtractor(chat).extract(DECK, ["Gupta ji"]);
    expect(result).toMatchObject({
      kind: "entry",
      needsReview: false,
      extraction: { customerName: "Gupta ji", totalRupees: 350, paidRupees: 200, pendingRupees: 150 },
    });
    expect(chat.calls[0]![0]!.content).toContain("Known customers: Gupta ji");
  });

  it("handles reasoning text and code fences around the JSON", async () => {
    const chat = new FakeChat({ [DECK]: `<think>hmm</think>\n\`\`\`json\n${entryJson("Gupta ji", 350, 200, 150)}\n\`\`\`` });
    expect((await new EntryExtractor(chat).extract(DECK)).kind).toBe("entry");
  });

  it("retries once with the validation error, then gives up", async () => {
    let calls = 0;
    const chat = new FakeChat({
      [DECK]: () => (++calls === 1 ? entryJson("Gupta ji", 350, 200, 100) : entryJson("Gupta ji", 350, 200, 150)),
    });
    const result = await new EntryExtractor(chat).extract(DECK);
    expect(result.kind).toBe("entry");
    expect(calls).toBe(2);
    expect(chat.calls[1]!.at(-1)!.content).toContain("total != paid + pending");

    const bad = new FakeChat({ [DECK]: entryJson("Gupta ji", 350, 200, 100) });
    expect((await new EntryExtractor(bad).extract(DECK)).kind).toBe("unclear");
  });

  it("flags needsReview when the LLM's number was never said", async () => {
    const chat = new FakeChat({ [DECK]: entryJson("Gupta ji", 355, 200, 155) });
    const result = await new EntryExtractor(chat).extract(DECK);
    expect(result).toMatchObject({ kind: "entry", needsReview: true });
  });

  it("returns not_entry for small talk", async () => {
    expect((await new EntryExtractor(new FakeChat()).extract("aaj mausam accha hai")).kind).toBe("not_entry");
  });
});

describe("read-back lines", () => {
  it("reads back exactly the saved amounts", () => {
    const line = lines.entryReadback({ customerName: "Gupta ji", totalRupees: 350, paidRupees: 200, pendingRupees: 150 }, false);
    expect(line.text).toBe("Gupta ji, total ₹350, ₹200 mile, ₹150 baaki. Save karoon?");
    expect(line.speech).toContain("150 बाकी");
  });

  it("uses Indian digit grouping so TTS reads big numbers right", () => {
    expect(formatRupees(150000)).toBe("1,50,000");
  });
});
