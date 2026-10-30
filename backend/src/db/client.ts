import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { PGliteDialect } from "./pglite-dialect.js";
import type { DB } from "./types.js";

export interface Database {
  kind: "postgres" | "pglite";
  db: Kysely<DB>;
  /** Runs a multi-statement SQL script (migrations). */
  exec(script: string): Promise<void>;
  close(): Promise<void>;
}

export interface DatabaseOptions {
  url?: string | undefined;
  /** Directory for the embedded database, or "memory" for an in-memory one. */
  pgliteDir?: string;
}

export async function openDatabase(opts: DatabaseOptions): Promise<Database> {
  if (opts.url) {
    const pool = new pg.Pool({ connectionString: opts.url, max: 10 });
    const db = new Kysely<DB>({ dialect: new PostgresDialect({ pool }) });
    return {
      kind: "postgres",
      db,
      exec: async (script) => {
        await pool.query(script);
      },
      close: () => db.destroy(),
    };
  }

  const dir = opts.pgliteDir ?? "memory";
  if (dir !== "memory") mkdirSync(dir, { recursive: true });
  const client = dir === "memory" ? new PGlite() : new PGlite(dir);
  await client.waitReady;
  const db = new Kysely<DB>({ dialect: new PGliteDialect(client) });
  return {
    kind: "pglite",
    db,
    exec: async (script) => {
      await client.exec(script);
    },
    close: () => db.destroy(),
  };
}

export async function ping(db: Kysely<DB>): Promise<boolean> {
  try {
    await sql`select 1`.execute(db);
    return true;
  } catch {
    return false;
  }
}
