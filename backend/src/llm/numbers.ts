/**
 * Deterministic number handling. The LLM proposes amounts; these helpers
 * verify them against what was actually said, and parse phone numbers.
 */

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

export function toAsciiDigits(text: string): string {
  return text.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
}

// Word -> value. Romanized Hindi, Devanagari Hindi and English. Words that double as
// common Hindi verbs or English words ("do" = give, "no", "so") are left out on purpose.
const UNITS: Record<string, number> = {
  zero: 0, shunya: 0, sifar: 0, "शून्य": 0,
  one: 1, ek: 1, "एक": 1,
  two: 2, "दो": 2,
  three: 3, teen: 3, "तीन": 3,
  four: 4, char: 4, chaar: 4, "चार": 4,
  five: 5, paanch: 5, panch: 5, "पांच": 5, "पाँच": 5,
  six: 6, chhe: 6, chhah: 6, "छह": 6, "छः": 6,
  seven: 7, saat: 7, "सात": 7,
  eight: 8, aath: 8, "आठ": 8,
  nine: 9, nau: 9, "नौ": 9,
  ten: 10, das: 10, dus: 10, "दस": 10,
  eleven: 11, gyarah: 11, gyaarah: 11, "ग्यारह": 11,
  twelve: 12, barah: 12, baarah: 12, "बारह": 12,
  thirteen: 13, terah: 13, "तेरह": 13,
  fourteen: 14, chaudah: 14, "चौदह": 14,
  fifteen: 15, pandrah: 15, "पंद्रह": 15,
  sixteen: 16, solah: 16, "सोलह": 16,
  seventeen: 17, satrah: 17, "सत्रह": 17,
  eighteen: 18, atharah: 18, "अठारह": 18,
  nineteen: 19, unnis: 19, "उन्नीस": 19,
  twenty: 20, bees: 20, bis: 20, "बीस": 20,
  pachchees: 25, pachees: 25, "पच्चीस": 25,
  thirty: 30, tees: 30, tis: 30, "तीस": 30,
  forty: 40, chalis: 40, chaalis: 40, "चालीस": 40,
  fifty: 50, pachas: 50, pachaas: 50, "पचास": 50,
  sixty: 60, saath: 60, "साठ": 60,
  seventy: 70, sattar: 70, "सत्तर": 70,
  eighty: 80, assi: 80, "अस्सी": 80,
  ninety: 90, nabbe: 90, "नब्बे": 90,
};
const MULTIPLIERS: Record<string, number> = {
  hundred: 100, sau: 100, "सौ": 100,
  thousand: 1000, hazaar: 1000, hazar: 1000, "हज़ार": 1000, "हजार": 1000,
  lakh: 100_000, lac: 100_000, "लाख": 100_000,
};
// "saade teen sau" = 350, "dedh sau" = 150, "dhai sau" = 250, "sava sau" = 125, "paune do sau" = 175
const FRACTION_PREFIX: Record<string, number> = { saade: 0.5, sade: 0.5, "साढ़े": 0.5, "साढे": 0.5, sava: 0.25, sawa: 0.25, "सवा": 0.25, paune: -0.25, "पौने": -0.25 };
const FRACTION_WORD: Record<string, number> = { dedh: 1.5, dhedh: 1.5, "डेढ़": 1.5, "डेढ": 1.5, dhai: 2.5, dhaai: 2.5, "ढाई": 2.5 };

function tokenize(text: string): string[] {
  return toAsciiDigits(text)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/(\d),(?=\d)/g, "$1")
    .replace(/[₹]/g, " ")
    .replace(/[^\p{L}\p{M}\p{N}.\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Every amount mentioned in a transcript, as rupees. Digits and number words both count. */
export function extractNumbers(text: string): number[] {
  const tokens = tokenize(text);
  const out: number[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i]!;
    const digit = /^\d+(?:\.\d+)?$/.test(t) ? Number(t) : null;
    if (digit !== null) {
      const mult = MULTIPLIERS[tokens[i + 1] ?? ""];
      if (mult && mult >= 1000) {
        out.push(digit * mult);
        i += 2;
      } else {
        out.push(digit);
        i += 1;
      }
      continue;
    }

    // word number: [fraction-prefix] (unit | fraction-word) [multiplier] ...
    let j = i;
    let prefix = 0;
    if (FRACTION_PREFIX[tokens[j]!] !== undefined) {
      prefix = FRACTION_PREFIX[tokens[j]!]!;
      j++;
    }
    let value: number | null = null;
    let total = 0;
    while (j < tokens.length) {
      const w = tokens[j]!;
      if (w === "do" && MULTIPLIERS[tokens[j + 1] ?? ""] !== undefined) {
        value = (value ?? 0) + 2;
        j++;
      } else if (UNITS[w] !== undefined) {
        value = (value ?? 0) + UNITS[w]!;
        j++;
      } else if (FRACTION_WORD[w] !== undefined) {
        value = (value ?? 0) + FRACTION_WORD[w]!;
        j++;
      } else if (MULTIPLIERS[w] !== undefined && value !== null) {
        const base = prefix ? value + prefix : value;
        prefix = 0;
        total += base * MULTIPLIERS[w]!;
        value = null;
        j++;
      } else {
        break;
      }
    }
    if (j > i && (value !== null || total > 0)) {
      out.push(total + (value ?? 0));
      i = j;
    } else {
      i += 1;
    }
  }
  return out.filter((n) => Number.isFinite(n));
}

export function mentionsNumber(text: string): boolean {
  return extractNumbers(text).length > 0;
}

export interface AmountCheck {
  verified: boolean;
  unverifiedFields: Array<"total" | "paid" | "pending">;
}

/**
 * Each non-zero amount must be spoken, or follow from two spoken amounts
 * (e.g. pending = total - paid when only total and paid were said).
 */
export function checkAmountsAgainstTranscript(
  amounts: { total: number; paid: number; pending: number },
  transcript: string,
): AmountCheck {
  const spoken = new Set(extractNumbers(transcript));
  const has = (n: number) => n === 0 || spoken.has(n);
  const derivable = {
    total: has(amounts.paid) && has(amounts.pending) && spoken.size > 0,
    paid: has(amounts.total) && has(amounts.pending),
    pending: has(amounts.total) && has(amounts.paid),
  };
  const unverifiedFields = (["total", "paid", "pending"] as const).filter(
    (f) => !has(amounts[f]) && !derivable[f],
  );
  return { verified: unverifiedFields.length === 0, unverifiedFields };
}

// ------------------------------------------------------------------- phones

const DIGIT_WORDS: Record<string, string> = {
  zero: "0", oh: "0", o: "0", shunya: "0", sifar: "0", "शून्य": "0", "ज़ीरो": "0", "जीरो": "0",
  one: "1", ek: "1", "एक": "1", "वन": "1",
  two: "2", do: "2", "दो": "2", "टू": "2",
  three: "3", teen: "3", tin: "3", "तीन": "3", "थ्री": "3",
  four: "4", char: "4", chaar: "4", "चार": "4", "फोर": "4",
  five: "5", paanch: "5", panch: "5", "पांच": "5", "पाँच": "5", "फाइव": "5",
  six: "6", chhe: "6", chhah: "6", che: "6", chah: "6", "छह": "6", "छः": "6", "छे": "6", "सिक्स": "6",
  seven: "7", saat: "7", sat: "7", "सात": "7", "सेवन": "7",
  eight: "8", aath: "8", ath: "8", "आठ": "8", "एट": "8",
  nine: "9", nau: "9", "नौ": "9", "नाइन": "9",
};
const REPEAT: Record<string, number> = { double: 2, "डबल": 2, triple: 3, "ट्रिपल": 3 };

/** Turns "98765 43210", "nau aath saat...", "double five ..." into a 10-digit Indian mobile, or null. */
export function parseIndianMobile(text: string): string | null {
  const tokens = toAsciiDigits(text)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  let digits = "";
  let repeat = 1;
  for (const t of tokens) {
    if (REPEAT[t]) {
      repeat = REPEAT[t]!;
      continue;
    }
    const d = /^\d+$/.test(t) ? t : DIGIT_WORDS[t];
    if (d !== undefined) {
      digits += d.length === 1 ? d.repeat(repeat) : d;
    }
    repeat = 1;
  }
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** "9876543210" -> "9 8 7 6 5, 4 3 2 1 0" so TTS reads digit by digit. */
export function phoneForSpeech(phone: string): string {
  return `${phone.slice(0, 5).split("").join(" ")}, ${phone.slice(5).split("").join(" ")}`;
}

export function phoneForDisplay(phone: string): string {
  return `${phone.slice(0, 5)} ${phone.slice(5)}`;
}

/** Indian digit grouping; TTS needs commas for numbers above 4 digits. */
export function formatRupees(rupees: number): string {
  return rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
