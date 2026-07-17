/**
 * Script bantuan untuk membuat akun (admin, pembimbing, atau siswa) karena
 * registrasi publik sengaja dimatikan di aplikasi ini.
 *
 * Cara pakai:
 *   1. Pastikan .env.local sudah berisi NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
 *   2. Jalankan: node scripts/create-user.mjs "Nama Lengkap" email@contoh.com password123 admin
 *
 *      Argumen ke-4 (role) opsional, salah satu: siswa | pembimbing | admin (default: siswa)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import ws from "ws";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env.local") });

const [, , fullName, email, password, role = "siswa"] = process.argv;

if (!fullName || !email || !password) {
  console.error("Pemakaian: node scripts/create-user.mjs \"Nama Lengkap\" email@contoh.com password123 [role]");
  process.exit(1);
}

if (!["siswa", "pembimbing", "admin", "owner", "root"].includes(role)) {
  console.error("Role tidak valid. Gunakan salah satu: siswa | pembimbing | admin | owner | root");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } }
);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, role },
});

if (error) {
  console.error("Gagal membuat user:", error.message);
  process.exit(1);
}

// Trigger handle_new_user() di schema.sql sudah otomatis mengisi tabel profiles,
// tapi kita pastikan lagi role-nya benar (mis. jika trigger belum sempat jalan).
await supabase.from("profiles").update({ role, full_name: fullName }).eq("id", data.user.id);

console.log(`Berhasil membuat akun ${role}: ${email} (id: ${data.user.id})`);
