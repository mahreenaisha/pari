import type { LedgerEntry } from '@/types/ledger';
import type { Profile } from '@/types/profile';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const profile: Profile = {
  id: 'usr_aarav',
  name: 'Aarav Mehta',
  paymentAddress: 'aarav@pari',
  qrPayload: 'pyaripari://pay/aarav',
};

const ledger: LedgerEntry[] = [
  { id: 'le_11', party: 'Ramesh Kumar', note: 'Rent share', amount: 50_000, direction: 'in', source: 'voice', createdAt: ago(26 * MINUTE) },
  { id: 'le_10', party: 'Anil Kirana Store', note: 'Groceries', amount: 64_000, direction: 'out', source: 'qr', createdAt: ago(2 * HOUR + 10 * MINUTE) },
  { id: 'le_09', party: 'Priya Sharma', note: 'Tuition fee', amount: 120_000, direction: 'in', source: 'qr', createdAt: ago(5 * HOUR) },
  { id: 'le_08', party: 'Chai Point', amount: 8_000, direction: 'out', source: 'qr', createdAt: ago(DAY + 2 * HOUR) },
  { id: 'le_07', party: 'Vikram Singh', note: 'Cycle repair', amount: 200_000, direction: 'in', source: 'voice', createdAt: ago(DAY + 4 * HOUR) },
  { id: 'le_06', party: 'Sunita Devi', note: 'Advance', amount: 150_000, direction: 'out', source: 'manual', createdAt: ago(DAY + 7 * HOUR) },
  { id: 'le_05', party: 'Meera Joshi', note: 'Stitching', amount: 35_000, direction: 'in', source: 'voice', createdAt: ago(2 * DAY + 3 * HOUR) },
  { id: 'le_04', party: 'Electricity Board', note: 'October bill', amount: 184_000, direction: 'out', source: 'qr', createdAt: ago(3 * DAY + HOUR) },
  { id: 'le_03', party: 'Rahul Verma', note: 'Old dues', amount: 75_000, direction: 'in', source: 'voice', createdAt: ago(3 * DAY + 6 * HOUR) },
  { id: 'le_02', party: 'Gupta Medical', note: 'Medicines', amount: 42_000, direction: 'out', source: 'qr', createdAt: ago(4 * DAY + 2 * HOUR) },
  { id: 'le_01', party: 'Kavita Rao', note: 'Monthly order', amount: 900_000, direction: 'in', source: 'manual', createdAt: ago(5 * DAY + 5 * HOUR) },
];

/** In-memory stand-in for the backend, so mock writes survive refetches during a session. */
export const mockDb = { profile, ledger };

export function mockLatency<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
