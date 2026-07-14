// ============================================================
// Database Provider Configuration
// ============================================================
// Central config yang menentukan database backend apa yang dipakai.
// Set DATABASE_PROVIDER di .env.local:
//   - "supabase" → pakai Supabase (default)
//   - "postgresql" → pakai PostgreSQL langsung (via pg driver)
//
// DATABASE_URL wajib diisi untuk kedua provider:
//   - Supabase: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
//   - PostgreSQL: postgresql://user:password@localhost:5432/dbname
// ============================================================

export type DatabaseProvider = "supabase" | "postgresql";

export interface DatabaseConfig {
  provider: DatabaseProvider;
  databaseUrl: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
}

/**
 * getDatabaseConfig — Ambil konfigurasi database dari environment variables
 * Tidak dieksekusi di client side (hanya server).
 */
export function getDatabaseConfig(): DatabaseConfig {
  const provider = (process.env.DATABASE_PROVIDER || "supabase") as DatabaseProvider;
  const databaseUrl = process.env.DATABASE_URL || "";

  if (!databaseUrl) {
    console.warn(
      "[DatabaseConfig] DATABASE_URL belum di-set. Menggunakan Supabase sebagai default."
    );
  }

  return {
    provider,
    databaseUrl,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * isSupabase — Cek apakah provider yang aktif adalah Supabase
 */
export function isSupabase(): boolean {
  return getDatabaseConfig().provider === "supabase";
}

/**
 * isPostgreSQL — Cek apakah provider yang aktif adalah PostgreSQL langsung
 */
export function isPostgreSQL(): boolean {
  return getDatabaseConfig().provider === "postgresql";
}
