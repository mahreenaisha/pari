import { describe, expect, it } from "vitest";
import { LANGUAGES, type Language, type Line } from "../src/contracts/index.js";
import { linesFor, type Lines } from "../src/llm/lines/index.js";

/** Each language's Unicode block; English has none. */
const SCRIPT: Record<Language, [number, number] | null> = {
  "hi-IN": [0x0900, 0x097f],
  "en-IN": null,
  "bn-IN": [0x0980, 0x09ff],
  "ta-IN": [0x0b80, 0x0bff],
  "te-IN": [0x0c00, 0x0c7f],
  "kn-IN": [0x0c80, 0x0cff],
  "ml-IN": [0x0d00, 0x0d7f],
  "mr-IN": [0x0900, 0x097f],
  "gu-IN": [0x0a80, 0x0aff],
  "pa-IN": [0x0a00, 0x0a7f],
  "od-IN": [0x0b00, 0x0b7f],
};

/** Indic letters in `s`, leaving out the danda, which Bengali, Punjabi and Odia borrow from Devanagari. */
function indicLetters(s: string): number[] {
  return [...s].map((ch) => ch.codePointAt(0)!).filter((cp) => cp >= 0x0900 && cp <= 0x0dff && cp !== 0x0964 && cp !== 0x0965);
}

// No amount is a substring of another, so a dropped amount can't hide inside a longer one.
const split = { customerName: "Gupta ji", totalRupees: 1350, paidRupees: 275, pendingRupees: 1075 };
const repaid = { customerName: "Gupta ji", amountRupees: 1350, owedRupees: 2275, leftRupees: 925, changeRupees: 0 };
const repaidAll = { ...repaid, amountRupees: 2275, leftRupees: 0 };
// ₹2,600 paid against ₹2,275 owed.
const overpaid = { ...repaidAll, changeRupees: 325 };

const cases: { key: keyof Lines; note: string; say: (lines: Lines) => Line; keeps: string[] }[] = [
  { key: "entryReadback", note: "", say: (l) => l.entryReadback(split, true), keeps: ["Gupta ji", "1,350", "275", "1,075"] },
  {
    key: "entryReadback",
    note: "(all paid)",
    say: (l) => l.entryReadback({ ...split, paidRupees: 1350, pendingRupees: 0 }, false),
    keeps: ["Gupta ji", "1,350"],
  },
  {
    key: "entryReadback",
    note: "(all on credit)",
    say: (l) => l.entryReadback({ ...split, paidRupees: 0, pendingRupees: 1350 }, false),
    keeps: ["Gupta ji", "1,350"],
  },
  { key: "entryCorrected", note: "", say: (l) => l.entryCorrected(split, false), keeps: ["Gupta ji", "1,350", "275", "1,075"] },
  { key: "savedAskCollect", note: "", say: (l) => l.savedAskCollect(1075), keeps: ["1,075"] },
  { key: "savedClosed", note: "", say: (l) => l.savedClosed(), keeps: [] },
  { key: "entryRejected", note: "", say: (l) => l.entryRejected(), keeps: [] },
  { key: "askPhone", note: "", say: (l) => l.askPhone("Verma ji"), keeps: ["Verma ji"] },
  { key: "phoneReadback", note: "", say: (l) => l.phoneReadback("9876543210"), keeps: [] },
  { key: "phoneInvalid", note: "", say: (l) => l.phoneInvalid(), keeps: [] },
  { key: "phoneRetry", note: "", say: (l) => l.phoneRetry(), keeps: [] },
  { key: "linkSent", note: "", say: (l) => l.linkSent("Verma ji", 1075), keeps: ["Verma ji", "1,075"] },
  { key: "collectDeclined", note: "", say: (l) => l.collectDeclined(), keeps: [] },
  { key: "linkPaid", note: "(closed)", say: (l) => l.linkPaid("Sunita didi", 1200, 0), keeps: ["Sunita didi", "1,200"] },
  { key: "linkPaid", note: "(part)", say: (l) => l.linkPaid("Sunita didi", 700, 450), keeps: ["Sunita didi", "700", "450"] },
  { key: "qrAsk", note: "", say: (l) => l.qrAsk(250, "Ramesh bhai", 300), keeps: ["250", "Ramesh bhai"] },
  { key: "qrAsk", note: "(more than pending)", say: (l) => l.qrAsk(400, "Ramesh bhai", 150), keeps: ["400", "Ramesh bhai", "150"] },
  { key: "qrNoCandidate", note: "", say: (l) => l.qrNoCandidate(999), keeps: ["999"] },
  { key: "qrMatched", note: "(closed)", say: (l) => l.qrMatched("Ramesh bhai", 0), keeps: ["Ramesh bhai"] },
  { key: "qrMatched", note: "(part)", say: (l) => l.qrMatched("Ramesh bhai", 325), keeps: ["Ramesh bhai", "325"] },
  { key: "paymentUnmatched", note: "", say: (l) => l.paymentUnmatched(450), keeps: ["450"] },
  { key: "linkFailed", note: "", say: (l) => l.linkFailed(), keeps: [] },
  { key: "qrLeftUnmatched", note: "", say: (l) => l.qrLeftUnmatched(), keeps: [] },
  { key: "notUnderstoodYesNo", note: "", say: (l) => l.notUnderstoodYesNo(), keeps: [] },
  { key: "notAnEntry", note: "", say: (l) => l.notAnEntry(), keeps: [] },
  { key: "amountsUnclear", note: "", say: (l) => l.amountsUnclear(), keeps: [] },
  { key: "newCustomer", note: "", say: (l) => l.newCustomer(), keeps: [] },
  { key: "sameCustomer", note: "", say: (l) => l.sameCustomer("Gupta didi", "Gupta ji"), keeps: ["Gupta didi", "Gupta ji"] },
  { key: "pendingFirst", note: "", say: (l) => l.pendingFirst("Verma ji"), keeps: ["Verma ji"] },
  { key: "nextEntry", note: "", say: (l) => l.nextEntry(), keeps: [] },
  { key: "unsaved", note: "", say: (l) => l.unsaved("Gupta ji, Verma ji"), keeps: ["Gupta ji, Verma ji"] },
  { key: "changeUnclear", note: "", say: (l) => l.changeUnclear(), keeps: [] },
  { key: "askName", note: "", say: (l) => l.askName(), keeps: [] },
  { key: "askAmount", note: "", say: (l) => l.askAmount("Verma ji"), keeps: ["Verma ji"] },
  { key: "repaymentReadback", note: "(part)", say: (l) => l.repaymentReadback(repaid, true), keeps: ["Gupta ji", "1,350", "2,275", "925"] },
  { key: "repaymentReadback", note: "(all)", say: (l) => l.repaymentReadback(repaidAll, false), keeps: ["Gupta ji", "2,275"] },
  {
    key: "repaymentReadback",
    note: "(more than owed)",
    say: (l) => l.repaymentReadback(overpaid, false),
    keeps: ["Gupta ji", "2,600", "2,275", "325"],
  },
  { key: "repaymentCorrected", note: "", say: (l) => l.repaymentCorrected(repaid, false), keeps: ["Gupta ji", "1,350", "2,275", "925"] },
  { key: "repaymentSaved", note: "(part)", say: (l) => l.repaymentSaved("Gupta ji", 925, 0), keeps: ["Gupta ji", "925"] },
  { key: "repaymentSaved", note: "(closed, change)", say: (l) => l.repaymentSaved("Gupta ji", 0, 325), keeps: ["Gupta ji", "325"] },
  { key: "linkStillOut", note: "", say: (l) => l.linkStillOut("Sunita didi"), keeps: ["Sunita didi"] },
  { key: "qrSameMoney", note: "", say: (l) => l.qrSameMoney("Ramesh bhai", 250), keeps: ["Ramesh bhai", "250"] },
  { key: "noSuchCustomer", note: "", say: (l) => l.noSuchCustomer("Mehta ji"), keeps: ["Mehta ji"] },
  { key: "nothingOwed", note: "", say: (l) => l.nothingOwed("Verma ji"), keeps: ["Verma ji"] },
  { key: "customerOwes", note: "", say: (l) => l.customerOwes("Gupta ji", 1075), keeps: ["Gupta ji", "1,075"] },
  { key: "shopOwed", note: "", say: (l) => l.shopOwed(12450, 7), keeps: ["12,450", "7"] },
  { key: "shopOwed", note: "(one customer)", say: (l) => l.shopOwed(1075, 1), keeps: ["1,075"] },
  { key: "nobodyOwes", note: "", say: (l) => l.nobodyOwes(), keeps: [] },
];

it("tests every line", () => {
  expect(new Set(cases.map((c) => c.key))).toEqual(new Set(Object.keys(linesFor("hi-IN"))));
});

describe.each(LANGUAGES)("%s lines", (language) => {
  const lines = linesFor(language);
  const block = SCRIPT[language];

  it.each(cases)("$key $note", ({ key, say, keeps }) => {
    const line = say(lines);
    expect(line).toMatchObject({ language, key });
    for (const side of [line.text, line.speech]) {
      expect(side.trim()).not.toBe("");
      for (const kept of keeps) expect(side).toContain(kept);
      const foreign = indicLetters(side).filter((cp) => !block || cp < block[0] || cp > block[1]);
      expect(foreign.map((cp) => String.fromCodePoint(cp))).toEqual([]);
    }
    if (block) expect(indicLetters(line.speech).length).toBeGreaterThan(0);
  });

  it("reads a phone number back digit by digit", () => {
    const line = lines.phoneReadback("9876543210");
    expect(line.text).toContain("98765 43210");
    expect(line.speech).toContain("9 8 7 6 5, 4 3 2 1 0");
  });
});
