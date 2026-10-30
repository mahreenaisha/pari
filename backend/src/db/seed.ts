import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import type { Kysely } from "kysely";
import { normalizeName } from "../ledger/names.js";
import type { DB, Merchant } from "./types.js";

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");

const DEMO_CUSTOMERS = ["Gupta ji", "Verma ji", "Ramesh bhai", "Sunita didi"];

/** Idempotent: makes sure the merchant for this API key exists. */
export async function ensureMerchant(db: Kysely<DB>, apiKey: string, name = "Sharma General Store"): Promise<Merchant> {
  const hash = hashApiKey(apiKey);
  const existing = await db.selectFrom("merchants").selectAll().where("api_key_hash", "=", hash).executeTakeFirst();
  if (existing) return existing;
  return db.insertInto("merchants").values({ name, api_key_hash: hash }).returningAll().executeTakeFirstOrThrow();
}

export async function seedDemo(db: Kysely<DB>, apiKey: string): Promise<Merchant> {
  const merchant = await ensureMerchant(db, apiKey);
  for (const name of DEMO_CUSTOMERS) {
    await db
      .insertInto("customers")
      .values({ merchant_id: merchant.id, name, name_normalized: normalizeName(name), phone: null })
      .onConflict((oc) => oc.columns(["merchant_id", "name_normalized"]).doNothing())
      .execute();
  }
  return merchant;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { loadEnv } = await import("../config/env.js");
  const { openDatabase } = await import("./client.js");
  const { migrate } = await import("./migrate.js");
  const env = loadEnv();
  const database = await openDatabase({ url: env.DATABASE_URL, pgliteDir: env.PARI_PGLITE_DIR });
  await migrate(database);
  const merchant = await seedDemo(database.db, env.PARI_API_KEY);
  console.log(`Seeded merchant "${merchant.name}" with customers: ${DEMO_CUSTOMERS.join(", ")}`);
  await database.close();
}
