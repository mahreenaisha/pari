import { AppError } from "../helpers/errors.js";
import type { EntryStatus } from "../db/types.js";

const ALLOWED: Record<EntryStatus, readonly EntryStatus[]> = {
  UNCONFIRMED: ["OPEN", "CLOSED", "REJECTED"],
  OPEN: ["OPEN", "CLOSED"],
  CLOSED: [],
  REJECTED: [],
};

export function canTransition(from: EntryStatus, to: EntryStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: EntryStatus, to: EntryStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(409, "INVALID_TRANSITION", `Entry cannot move from ${from} to ${to}`);
  }
}

export const toPaise = (rupees: number) => Math.round(rupees * 100);
export const toRupees = (paise: number) => paise / 100;
