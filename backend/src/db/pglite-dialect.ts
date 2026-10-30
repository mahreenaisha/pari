import type { PGlite } from "@electric-sql/pglite";
import {
  CompiledQuery,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type DatabaseConnection,
  type DatabaseIntrospector,
  type Dialect,
  type DialectAdapter,
  type Driver,
  type Kysely,
  type QueryCompiler,
  type QueryResult,
} from "kysely";

class PGliteConnection implements DatabaseConnection {
  constructor(private readonly client: PGlite) {}

  async executeQuery<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
    const result = await this.client.query<R>(compiled.sql, [...compiled.parameters]);
    return {
      rows: result.rows,
      ...(result.affectedRows !== undefined ? { numAffectedRows: BigInt(result.affectedRows) } : {}),
    };
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("Streaming is not supported by the PGlite dialect");
  }
}

/**
 * PGlite is a single connection, so the driver hands it out to one
 * caller at a time; otherwise concurrent transactions would interleave.
 */
class PGliteDriver implements Driver {
  private readonly connection: PGliteConnection;
  private queue: Promise<void> = Promise.resolve();
  private release: (() => void) | null = null;

  constructor(private readonly client: PGlite) {
    this.connection = new PGliteConnection(client);
  }

  async init(): Promise<void> {
    await this.client.waitReady;
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => (release = resolve));
    await previous;
    this.release = release;
    return this.connection;
  }

  async beginTransaction(conn: DatabaseConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(conn: DatabaseConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(conn: DatabaseConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw("rollback"));
  }

  async releaseConnection(): Promise<void> {
    const release = this.release;
    this.release = null;
    release?.();
  }

  async destroy(): Promise<void> {
    await this.client.close();
  }
}

export class PGliteDialect implements Dialect {
  constructor(private readonly client: PGlite) {}

  createAdapter(): DialectAdapter {
    return new PostgresAdapter();
  }

  createDriver(): Driver {
    return new PGliteDriver(this.client);
  }

  createQueryCompiler(): QueryCompiler {
    return new PostgresQueryCompiler();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new PostgresIntrospector(db);
  }
}
