import type { EntryDto, Line, LinkDto } from "../contracts/index.js";

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code: string) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
export const c = {
  bold: wrap("1"),
  dim: wrap("2"),
  red: wrap("31"),
  green: wrap("32"),
  yellow: wrap("33"),
  blue: wrap("34"),
  magenta: wrap("35"),
  cyan: wrap("36"),
};

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_COLOR: Record<string, (s: string) => string> = {
  UNCONFIRMED: c.yellow,
  OPEN: c.blue,
  CLOSED: c.green,
  REJECTED: c.dim,
};

export function printPari(line: Line): void {
  console.log(`${c.magenta(c.bold("Pari:"))} ${line.text}`);
}

export function printYou(text: string): void {
  console.log(`${c.cyan(c.bold(" You:"))} ${text}`);
}

export function printInfo(text: string): void {
  console.log(c.dim(`      ${text}`));
}

export function printError(err: unknown): void {
  const e = err as { code?: string; message?: string };
  console.error(c.red(`Error${e.code ? ` [${e.code}]` : ""}: ${e.message ?? String(err)}`));
}

export function printEntry(entry: EntryDto): void {
  const status = (STATUS_COLOR[entry.status] ?? ((s: string) => s))(entry.status);
  console.log(c.dim("      ┌ ") + `${c.bold(entry.customer.name)}  ${c.dim(entry.shortId)}  ${status}`);
  console.log(
    c.dim("      └ ") +
      `total ${rupees(entry.totalRupees)}   paid ${rupees(entry.paidRupees)}   pending ${c.bold(rupees(entry.pendingRupees))}` +
      (entry.needsReview ? c.yellow("   (amounts need a careful listen)") : ""),
  );
}

export function printLink(link: LinkDto): void {
  console.log(c.dim("      link ") + `${rupees(link.amountRupees)} -> ${link.phone}  ${c.dim(link.shortUrl ?? "")}  order ${c.dim(link.orderId)}`);
}

export function printEntriesTable(entries: EntryDto[]): void {
  if (!entries.length) {
    console.log(c.dim("No entries."));
    return;
  }
  const rows = entries.map((e) => [
    e.shortId,
    e.customer.name,
    rupees(e.totalRupees),
    rupees(e.paidRupees),
    rupees(e.pendingRupees),
    e.status,
    new Date(e.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
  ]);
  const head = ["ID", "Customer", "Total", "Paid", "Pending", "Status", "Created"];
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const fmt = (r: string[]) => r.map((cell, i) => cell.padEnd(widths[i]!)).join("  ");
  console.log(c.bold(fmt(head)));
  for (const r of rows) console.log((STATUS_COLOR[r[5]!] ?? ((s: string) => s))(fmt(r)));
}