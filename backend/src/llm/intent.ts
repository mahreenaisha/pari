export type YesNo = "yes" | "no" | "unknown";

const NO = [
  "nahi", "nahin", "nai", "nahi ji", "na", "naa", "mat", "no", "nope", "cancel", "galat", "rehne do", "rahne do",
  "chhodo", "chodo", "mat bhejo", "abhi nahi",
  "नहीं", "नही", "ना", "मत", "गलत", "ग़लत", "रहने दो", "छोड़ो", "कैंसिल",
];
const YES = [
  "haan", "haa", "han", "ha", "haanji", "hanji", "haan ji", "ji haan", "ji bilkul", "theek hai", "thik hai", "theek",
  "thik", "sahi hai", "sahi", "ok", "okay", "yes", "yeah", "yep", "bilkul", "kar do", "kardo", "karo", "save karo",
  "save kar do", "bhejo", "bhej do", "bhejdo", "sure", "done", "chalega", "zaroor", "jarur",
  "हाँ", "हां", "हा", "जी हाँ", "जी हां", "हाँ जी", "हां जी", "ठीक", "ठीक है", "सही", "सही है", "बिल्कुल", "भेजो", "भेज दो", "कर दो", "करो",
  "ओके", "चलेगा", "ज़रूर", "जरूर",
];

function normalize(text: string): string {
  return ` ${text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

const hasPhrase = (haystack: string, phrases: string[]) => phrases.some((p) => haystack.includes(` ${p} `));

/** Negation wins: "theek nahi hai" is a no. */
export function detectYesNo(text: string): YesNo {
  const t = normalize(text);
  if (hasPhrase(t, NO)) return "no";
  if (hasPhrase(t, YES)) return "yes";
  return "unknown";
}
