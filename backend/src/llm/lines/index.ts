import { LANGUAGES, type Language, type Line } from "../../contracts/index.js";
import type { LineBook } from "./book.js";
import { bn } from "./bn.js";
import { en } from "./en.js";
import { gu } from "./gu.js";
import { hi } from "./hi.js";
import { kn } from "./kn.js";
import { ml } from "./ml.js";
import { mr } from "./mr.js";
import { od } from "./od.js";
import { pa } from "./pa.js";
import { ta } from "./ta.js";
import { te } from "./te.js";

export type { EntryAmounts, RepaymentAmounts } from "./book.js";

const BOOKS: Record<Language, LineBook> = {
  "hi-IN": hi,
  "en-IN": en,
  "bn-IN": bn,
  "ta-IN": ta,
  "te-IN": te,
  "kn-IN": kn,
  "ml-IN": ml,
  "mr-IN": mr,
  "gu-IN": gu,
  "pa-IN": pa,
  "od-IN": od,
};

/** One language's lines, each stamped with that language and its own name as `key`. */
export type Lines = { [K in keyof LineBook]: (...args: Parameters<LineBook[K]>) => Line };

function stamp(language: Language, book: LineBook): Lines {
  return Object.fromEntries(
    Object.entries(book).map(([key, say]) => [key, (...args: unknown[]) => ({ ...say(...args), language, key })]),
  ) as Lines;
}

const LINES = Object.fromEntries(LANGUAGES.map((language) => [language, stamp(language, BOOKS[language])])) as Record<
  Language,
  Lines
>;

/** Everything Pari says, in the merchant's language. */
export function linesFor(language: Language): Lines {
  return LINES[language];
}

/** Lines said one after another. The result keeps the last line's key, since that's the one awaiting an answer. */
export function joinLines(first: Line, ...rest: Line[]): Line {
  const parts = [first, ...rest];
  return {
    text: parts.map((p) => p.text).join(" "),
    speech: parts.map((p) => p.speech).join(" "),
    language: first.language,
    key: parts[parts.length - 1]!.key,
  };
}
