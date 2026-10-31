const HONORIFICS = new Set([
  "ji", "jee", "bhai", "bhaiya", "bhaiyya", "bhaisahab", "sahab", "saab", "saheb", "didi", "behen", "behenji",
  "aunty", "auntie", "uncle", "sir", "madam", "mr", "mrs", "ms", "shri", "shrimati", "seth", "sethji", "babu",
  "anna", "akka", "amma", "garu", "da", "di", "dada", "tai", "bhau", "kaka", "mama", "chechi", "chettan", "paaji", "ben",
  "जी", "भाई", "भैया", "साहब", "दीदी", "बहन", "आंटी", "अंकल", "सेठ",
]);

/** "Gupta ji", "gupta-JI", "Mr. Gupta" all normalize to "gupta". */
export function normalizeName(name: string): string {
  const words = name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const core = words.filter((w) => !HONORIFICS.has(w));
  return (core.length ? core : words).join(" ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length]!;
}

/** 0..1, where 1 is identical after normalization. */
export function nameSimilarity(a: string, b: string): number {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.split(" ").some((w) => y.split(" ").includes(w))) return 0.8;
  const distance = levenshtein(x, y);
  return Math.max(0, 1 - distance / Math.max(x.length, y.length));
}

/** Small spelling slips only: "gupta" ~ "guptha", but not "gupta" ~ "mehta". */
export function isCloseName(a: string, b: string): boolean {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (x === y) return true;
  const allowed = Math.min(x.length, y.length) >= 5 ? 1 : 0;
  return levenshtein(x, y) <= allowed;
}
