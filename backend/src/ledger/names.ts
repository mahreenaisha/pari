const NEUTRAL = ["ji", "jee", "garu", "जी"];
const MALE = [
  "bhai", "bhaiya", "bhaiyya", "bhaisahab", "sahab", "saab", "saheb", "uncle", "sir", "mr", "shri", "seth", "sethji",
  "babu", "anna", "da", "dada", "bhau", "kaka", "mama", "chettan", "paaji",
  "भाई", "भैया", "साहब", "अंकल", "सेठ",
];
const FEMALE = [
  "didi", "behen", "behenji", "aunty", "auntie", "madam", "mrs", "ms", "shrimati", "akka", "amma", "di", "tai", "chechi", "ben",
  "दीदी", "बहन", "आंटी",
];
const HONORIFICS = new Set([...NEUTRAL, ...MALE, ...FEMALE]);
const GENDER = new Map<string, "m" | "f">([...MALE.map((w) => [w, "m"] as const), ...FEMALE.map((w) => [w, "f"] as const)]);

function words(name: string): string[] {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** "Gupta ji", "gupta-JI", "Mr. Gupta" all normalize to "gupta". */
export function normalizeName(name: string): string {
  const all = words(name);
  const core = all.filter((w) => !HONORIFICS.has(w));
  return (core.length ? core : all).join(" ");
}

/** "m" for "Gupta bhaiya", "f" for "Gupta didi". Ji, garu or no honorific say neither. */
export function honorificGender(name: string): "m" | "f" | null {
  const said = new Set(words(name).flatMap((w) => GENDER.get(w) ?? []));
  return said.size === 1 ? [...said][0]! : null;
}

/** What a customer is stored and kept unique under: the normalized name, plus "m" or "f" when the honorific says so. */
export function customerKey(name: string): string {
  const gender = honorificGender(name);
  return gender ? `${normalizeName(name)} ~${gender}` : normalizeName(name);
}

export type NameMatch = "exact" | "fuzzy" | "maybe";

/**
 * How a spoken name fits a customer's. "maybe" is the same name where only one of the two says man or woman
 * ("Gupta didi" for "Gupta ji"), which is worth asking about. A man's and a woman's honorific never match.
 */
export function matchName(spoken: string, known: string): NameMatch | null {
  const a = honorificGender(spoken);
  const b = honorificGender(known);
  if (a && b && a !== b) return null;
  const x = normalizeName(spoken);
  const y = normalizeName(known);
  const fit = x === y ? "exact" : isCloseName(x, y) ? "fuzzy" : null;
  if (!fit) return null;
  return a === b ? fit : "maybe";
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
