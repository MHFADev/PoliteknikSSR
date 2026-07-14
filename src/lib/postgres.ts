// ============================================================
// PostgreSQL Client — Wrapper untuk node-postgres (pg)
// ============================================================
// Menyediakan connection pool yang bisa dipakai oleh semua
// PostgreSQL repository implementations.
// ============================================================

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getDatabaseConfig } from "@/lib/database";

let globalPool: Pool | null = null;

/**
 * getPool — Lazy-init connection pool (singleton)
 */
export function getPool(): Pool {
  if (!globalPool) {
    const config = getDatabaseConfig();
    if (!config.databaseUrl) {
      throw new Error(
        "[PostgreSQL] DATABASE_URL belum di-set. " +
        "Set DATABASE_URL di .env.local (format: postgresql://user:pass@host:5432/dbname)"
      );
    }

    globalPool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    globalPool.on("error", (err) => {
      console.error("[PostgreSQL] Pool error:", err.message);
    });
  }

  return globalPool;
}

/**
 * query — Convenience function untuk execute SQL query
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

/**
 * getClient — Ambil client dari pool untuk transaksi
 * Penting: client harus di-release setelah selesai!
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * transaction — Execute callback dalam transaksi
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * closePool — Tutup connection pool (untuk graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (globalPool) {
    await globalPool.end();
    globalPool = null;
  }
}
