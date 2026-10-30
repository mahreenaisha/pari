import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Database } from "./client.js";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "../../src/db/migrations");

export async function migrate(database: Database): Promise<string[]> {
  await database.exec(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set(
    (await database.db.selectFrom("_migrations").select("name").execute()).map((r) => r.name),
  );
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const script = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    await database.exec(`begin;\n${script}\ninsert into _migrations (name) values ('${file}');\ncommit;`);
    ran.push(file);
  }
  return ran;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { loadEnv } = await import("../config/env.js");
  const { openDatabase } = await import("./client.js");
  const env = loadEnv();
  const database = await openDatabase({ url: env.DATABASE_URL, pgliteDir: env.PARI_PGLITE_DIR });
  const ran = await migrate(database);
  console.log(ran.length ? `Applied: ${ran.join(", ")}` : "Database is up to date.");
  await database.close();
}
