import type { Customer, LedgerEntry, Payment, PaymentMethod } from '@/types/ledger';
import type { MatchSuggestion, QrPayment } from '@/types/payments';
import type { Profile } from '@/types/profile';

import { emitMockEvent } from './events';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** How long the simulated customer takes to pay a payment link. */
const LINK_PAID_AFTER = 9_000;
/** When the merchant skips the link, the simulated customer pays on the shop's QR after this long. */
const QR_PAID_AFTER = 6_000;

const now = () => new Date().toISOString();
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}`;

const profile: Profile = {
  id: 'mer_sharma',
  businessName: 'Sharma Kirana Store',
  paymentAddress: 'sharmakirana@pari',
  qrPayload: 'pyaripari://pay/sharmakirana',
};

const ramesh: Customer = { id: 'cus_ramesh', name: 'Ramesh Kumar', phone: '9876501234' };
const priya: Customer = { id: 'cus_priya', name: 'Priya Sharma', phone: '9123456780' };
const vikram: Customer = { id: 'cus_vikram', name: 'Vikram Singh' };
const meera: Customer = { id: 'cus_meera', name: 'Meera Joshi', phone: '9988776655' };
const anil: Customer = { id: 'cus_anil', name: 'Anil Verma' };
const kavita: Customer = { id: 'cus_kavita', name: 'Kavita Rao', phone: '9090901234' };
const rahul: Customer = { id: 'cus_rahul', name: 'Rahul' };
const sunita: Customer = { id: 'cus_sunita', name: 'Sunita Devi', phone: '9812345670' };

const customers: Customer[] = [ramesh, priya, vikram, meera, anil, kavita, rahul, sunita];

function applyPayment(entry: LedgerEntry, payment: Payment) {
  entry.payments.push(payment);
  entry.paid += payment.amount;
  entry.pending = Math.max(0, entry.total - entry.paid);
  if (entry.status === 'open' && entry.pending === 0) {
    entry.status = 'closed';
    entry.closedAt = payment.at;
  }
}

function seed(
  id: string,
  customer: Customer,
  total: number,
  createdAt: string,
  payments: Payment[] = [],
  link?: LedgerEntry['link'],
): LedgerEntry {
  const entry: LedgerEntry = {
    id,
    customer,
    total,
    paid: 0,
    pending: total,
    status: 'open',
    payments: [],
    link,
    createdAt,
  };
  payments.forEach((payment) => applyPayment(entry, payment));
  return entry;
}

const ledger: LedgerEntry[] = [
  seed('le_ramesh', ramesh, 90_000, ago(2 * HOUR), [{ amount: 50_000, method: 'cash', at: ago(2 * HOUR) }]),
  seed('le_priya', priya, 180_000, ago(5 * HOUR), [{ amount: 60_000, method: 'upi', at: ago(5 * HOUR) }], {
    orderId: 'ord_priya',
    amount: 120_000,
    status: 'sent',
    sentAt: ago(4 * HOUR),
  }),
  seed('le_vikram', vikram, 200_000, ago(DAY + 3 * HOUR)),
  seed(
    'le_meera',
    meera,
    65_000,
    ago(DAY + 6 * HOUR),
    [{ amount: 65_000, method: 'link', at: ago(DAY + 2 * HOUR) }],
    { orderId: 'ord_meera', amount: 65_000, status: 'paid', sentAt: ago(DAY + 6 * HOUR) },
  ),
  seed('le_anil', anil, 42_000, ago(2 * DAY + 4 * HOUR), [{ amount: 42_000, method: 'qr', at: ago(2 * DAY + HOUR) }]),
  seed('le_kavita', kavita, 350_000, ago(3 * DAY + 2 * HOUR), [
    { amount: 150_000, method: 'cash', at: ago(3 * DAY + 2 * HOUR) },
  ]),
  seed('le_rahul', rahul, 8_000, ago(3 * DAY + 5 * HOUR), [{ amount: 8_000, method: 'cash', at: ago(3 * DAY + 5 * HOUR) }]),
];

type StoredQrPayment = Omit<QrPayment, 'suggestions'> & { likelyEntryId?: string };

const qrPayments: StoredQrPayment[] = [
  { id: 'qr_ramesh', amount: 40_000, receivedAt: ago(6 * MINUTE), likelyEntryId: 'le_ramesh' },
];

const drafts = new Map<string, LedgerEntry>();

function findEntry(id: string) {
  const entry = ledger.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`No ledger entry ${id}`);
  return entry;
}

/** Ranks open entries for a QR payment: the likely customer, then exact amounts, then recency. */
function suggestMatches(payment: StoredQrPayment): MatchSuggestion[] {
  const score = (entry: LedgerEntry) =>
    (entry.id === payment.likelyEntryId ? 4 : 0) +
    (entry.pending === payment.amount ? 2 : 0) +
    (entry.pending > payment.amount ? 1 : 0);

  return ledger
    .filter((entry) => entry.status === 'open')
    .sort((a, b) => score(b) - score(a) || Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3)
    .map((entry) => ({ entryId: entry.id, customerName: entry.customer.name, pending: entry.pending }));
}

function simulateQrPayment(entry: LedgerEntry) {
  setTimeout(() => {
    if (entry.status !== 'open' || entry.link) return;
    const payment = { id: newId('qr'), amount: entry.pending, receivedAt: now(), likelyEntryId: entry.id };
    qrPayments.unshift(payment);
    emitMockEvent({ type: 'qr-payment', paymentId: payment.id });
  }, QR_PAID_AFTER);
}

function simulateLinkPayment(entry: LedgerEntry) {
  setTimeout(() => {
    const link = entry.link;
    if (entry.status !== 'open' || link?.status !== 'sent') return;
    link.status = 'paid';
    applyPayment(entry, { amount: link.amount, method: 'link', at: now() });
    emitMockEvent({ type: 'link-paid', entryId: entry.id });
  }, LINK_PAID_AFTER);
}

type DraftInput = {
  customerName: string;
  total: number;
  paid: number;
  method: PaymentMethod;
};

/** In-memory stand-in for the backend, so mock writes survive refetches during a session. */
export const mockDb = {
  profile: () => copy(profile),

  entries: () => copy(ledger),

  /** What extraction returns: an entry that stays unconfirmed until the merchant says yes. */
  createDraft({ customerName, total, paid, method }: DraftInput) {
    let customer = customers.find((candidate) => candidate.name === customerName);
    if (!customer) {
      customer = { id: newId('cus'), name: customerName };
      customers.push(customer);
    }
    const createdAt = now();
    const draft = seed(newId('le'), customer, total, createdAt, paid > 0 ? [{ amount: paid, method, at: createdAt }] : []);
    draft.status = 'unconfirmed';
    drafts.set(draft.id, draft);
    return copy(draft);
  },

  confirmEntry(id: string) {
    const draft = drafts.get(id);
    if (!draft) throw new Error(`No draft ${id}`);
    drafts.delete(id);
    draft.status = draft.pending > 0 ? 'open' : 'closed';
    if (draft.status === 'closed') draft.closedAt = now();
    ledger.unshift(draft);
    return copy(draft);
  },

  discardEntry(id: string) {
    drafts.delete(id);
  },

  sendPaymentLink(id: string, phone?: string) {
    const entry = findEntry(id);
    if (phone) entry.customer.phone = phone;
    if (!entry.customer.phone) throw new Error(`${entry.customer.name} has no phone number`);
    entry.link = { orderId: newId('ord'), amount: entry.pending, status: 'sent', sentAt: now() };
    simulateLinkPayment(entry);
    return copy(entry);
  },

  skipPaymentLink(id: string) {
    simulateQrPayment(findEntry(id));
  },

  qrPayments: (): QrPayment[] =>
    qrPayments.map(({ likelyEntryId, ...payment }) => ({
      ...payment,
      suggestions: suggestMatches({ ...payment, likelyEntryId }),
    })),

  matchQrPayment(paymentId: string, entryId: string) {
    const index = qrPayments.findIndex((payment) => payment.id === paymentId);
    if (index === -1) throw new Error(`No QR payment ${paymentId}`);
    const [payment] = qrPayments.splice(index, 1);
    const entry = findEntry(entryId);
    applyPayment(entry, { amount: payment.amount, method: 'qr', at: payment.receivedAt });
    return copy(entry);
  },

  dismissQrPayment(paymentId: string) {
    const index = qrPayments.findIndex((payment) => payment.id === paymentId);
    if (index !== -1) qrPayments.splice(index, 1);
  },
};

export function mockLatency<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
