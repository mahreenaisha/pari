import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  applyPayment,
  confirmEntry,
  createUnconfirmedEntry,
  customerBalancePaise,
  findOrCreateCustomer,
  getEntry,
  inTx,
  rejectEntry,
  updateUnconfirmedEntry,
} from "../src/ledger/repository.js";
import { canTransition } from "../src/ledger/state.js";
import { createTestContext, type TestContext } from "./helpers.js";

let t: TestContext;
beforeAll(async () => {
  t = await createTestContext();
});
afterAll(() => t.close());

async function newEntry(total: number, paid: number, name = "Gupta ji") {
  const { customer } = await findOrCreateCustomer(t.ctx.db, t.merchantId, name);
  return createUnconfirmedEntry(t.ctx.db, {
    merchantId: t.merchantId,
    customerId: customer.id,
    totalPaise: total * 100,
    paidPaise: paid * 100,
    pendingPaise: (total - paid) * 100,
    transcript: "test",
    language: null,
    needsReview: false,
  });
}

describe("state machine", () => {
  it("only allows the documented transitions", () => {
    expect(canTransition("UNCONFIRMED", "OPEN")).toBe(true);
    expect(canTransition("UNCONFIRMED", "REJECTED")).toBe(true);
    expect(canTransition("OPEN", "CLOSED")).toBe(true);
    expect(canTransition("CLOSED", "OPEN")).toBe(false);
    expect(canTransition("REJECTED", "OPEN")).toBe(false);
    expect(canTransition("OPEN", "REJECTED")).toBe(false);
  });
});

describe("customers", () => {
  it("matches honorific and spelling variants to the seeded customer", async () => {
    const a = await findOrCreateCustomer(t.ctx.db, t.merchantId, "gupta JI");
    const b = await findOrCreateCustomer(t.ctx.db, t.merchantId, "Mr. Guptaa");
    expect(a.match).toBe("exact");
    expect(b.match).toBe("fuzzy");
    expect(b.customer.id).toBe(a.customer.id);
  });

  it("creates a new customer for an unknown name", async () => {
    const c = await findOrCreateCustomer(t.ctx.db, t.merchantId, "Mehta bhai");
    expect(c.match).toBe("new");
    expect(c.customer.name).toBe("Mehta bhai");
  });
});

describe("entries", () => {
  it("rejects amounts that do not balance", async () => {
    const { customer } = await findOrCreateCustomer(t.ctx.db, t.merchantId, "Gupta ji");
    await expect(
      createUnconfirmedEntry(t.ctx.db, {
        merchantId: t.merchantId,
        customerId: customer.id,
        totalPaise: 35000,
        paidPaise: 20000,
        pendingPaise: 15500,
        transcript: null,
        language: null,
        needsReview: false,
      }),
    ).rejects.toMatchObject({ code: "AMOUNT_MISMATCH" });
  });

  it("UNCONFIRMED -> OPEN on confirm, then part and full payments close it", async () => {
    const entry = await newEntry(350, 200);
    expect(entry.status).toBe("UNCONFIRMED");
    const open = await confirmEntry(t.ctx.db, t.merchantId, entry.id.slice(0, 8));
    expect(open.status).toBe("OPEN");

    const part = await inTx(t.ctx.db, (trx) => applyPayment(trx, t.merchantId, entry.id, 10000, "paytm", {}));
    expect(part).toMatchObject({ appliedPaise: 10000, pendingPaise: 5000, closed: false });

    const rest = await inTx(t.ctx.db, (trx) => applyPayment(trx, t.merchantId, entry.id, 8000, "paytm", {}));
    expect(rest).toMatchObject({ appliedPaise: 5000, excessPaise: 3000, closed: true });

    const closed = await getEntry(t.ctx.db, t.merchantId, entry.id);
    expect(closed).toMatchObject({ status: "CLOSED", paid_paise: 35000, pending_paise: 0 });
    await expect(confirmEntry(t.ctx.db, t.merchantId, entry.id)).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("closes straight away when nothing is pending", async () => {
    const entry = await newEntry(500, 500, "Verma ji");
    expect((await confirmEntry(t.ctx.db, t.merchantId, entry.id)).status).toBe("CLOSED");
  });

  it("edits only while UNCONFIRMED, and reject is final", async () => {
    const entry = await newEntry(300, 0, "Sunita didi");
    const edited = await updateUnconfirmedEntry(t.ctx.db, t.merchantId, entry.id, {
      totalPaise: 25000,
      paidPaise: 0,
      pendingPaise: 25000,
    });
    expect(edited.total_paise).toBe(25000);
    await rejectEntry(t.ctx.db, t.merchantId, entry.id);
    await expect(updateUnconfirmedEntry(t.ctx.db, t.merchantId, entry.id, { totalPaise: 1 })).rejects.toMatchObject({
      code: "ENTRY_LOCKED",
    });
  });

  it("balance sums pending of OPEN entries only", async () => {
    const { customer } = await findOrCreateCustomer(t.ctx.db, t.merchantId, "Ramesh bhai");
    const a = await newEntry(100, 0, "Ramesh bhai");
    await newEntry(999, 0, "Ramesh bhai");
    await confirmEntry(t.ctx.db, t.merchantId, a.id);
    expect(await customerBalancePaise(t.ctx.db, t.merchantId, customer.id)).toBe(10000);
  });

  it("writes an audit row for every transition", async () => {
    const entry = await newEntry(120, 20);
    await confirmEntry(t.ctx.db, t.merchantId, entry.id);
    const rows = await t.ctx.db.selectFrom("audit_log").selectAll().where("entry_id", "=", entry.id).orderBy("id").execute();
    expect(rows.map((r) => `${r.from_status ?? "-"}>${r.to_status}`)).toEqual(["->UNCONFIRMED", "UNCONFIRMED>OPEN"]);
  });
});
