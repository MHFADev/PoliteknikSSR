// ============================================================
// SupabaseUserRepository — Implementasi IUserRepository
// ============================================================
// Mengelola operasi CRUD user, autentikasi, dan statistik
// presensi dengan Supabase sebagai backend database.
//
// POLA IMPLEMENTASI:
// - getClient()       → createClient()       (anon key, session cookie)
// - getAdminClient()  → createAdminClient()  (service role, bypass RLS)
// - Mapping snake_case (db) → camelCase (domain) lewat mapToUser()
// - Join study_programs untuk mendapatkan studyProgramName
// - Email dari auth.users (tersedia di getCurrentUser via session)
// ============================================================

import type {
  User,
  UserRole,
  CreateUserInput,
  PendingUser,
  AttendanceStatsQuery,
  AttendanceStats,
} from "../types";
import type { IUserRepository } from "../interfaces/IUserRepository";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generatePermanentStudentToken } from "@/lib/qr-token";

export class SupabaseUserRepository implements IUserRepository {
  /**
   * getClient — Buat Supabase client untuk operasi umum (anon key + session)
   * Setiap method harus membuat instance baru karena dependency cookies().
   */
  private getClient() {
    return createClient();
  }

  /**
   * getAdminClient — Buat Supabase client dengan service role (bypass RLS)
   * Digunakan untuk operasi administratif: buat user, approve, reject, dll.
   */
  private getAdminClient() {
    return createAdminClient();
  }

  /**
   * mapToUser — Mapping row database (snake_case) ke domain type User (camelCase)
   * @param profile - Row dari tabel profiles (bisa termasuk join study_programs)
   * @param email   - Email dari auth.users (opsional, default "")
   * @returns User domain object
   */
  private mapToUser(profile: any, email?: string): User {
    return {
      id: profile.id,
      email: email || "",
      fullName: profile.full_name || "",
      role: profile.role || "siswa",
      identityNumber: profile.identity_number || null,
      instansi: profile.instansi || null,
      kelas: profile.kelas || null,
      jurusanId: profile.jurusan_id || null,
      studyProgramName: profile.study_programs?.nama || null,
      avatarUrl: profile.avatar_url || null,
      approved: profile.approved ?? false,
      createdAt: profile.created_at || new Date().toISOString(),
    };
  }

  /**
   * getCurrentUser — Ambil data user yang sedang login berdasarkan session
   *
   * Alur:
   * 1. Dapatkan user dari sesi auth via getUser()
   * 2. Jika tidak ada sesi, kembalikan null
   * 3. Query profil dari tabel profiles dengan join study_programs
   * 4. Mapping ke domain User (email dari authUser.email)
   *
   * @returns User yang sedang login, atau null jika belum login
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = this.getClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        identity_number,
        instansi,
        kelas,
        jurusan_id,
        avatar_url,
        approved,
        created_at,
        study_programs ( nama )
      `)
      .eq("id", authUser.id)
      .single();

    if (profile) return this.mapToUser(profile, authUser.email);

    // Profile tidak ditemukan — buat dari metadata auth (fallback)
    // Ini mencegah "Sesi login tidak ditemukan" untuk akun yang profile-nya
    // tidak terbuat otomatis oleh trigger on_auth_user_created.
    console.warn("[getCurrentUser] Profile not found for user", authUser.id, "- creating from auth metadata");
    const meta = authUser.user_metadata || {};
    const adminClient = this.getAdminClient();
    const { error: insertError } = await adminClient.from("profiles").upsert({
      id: authUser.id,
      full_name: meta.full_name || authUser.email?.split("@")[0] || "Pengguna",
      role: meta.role || "siswa",
      approved: true,
      created_at: authUser.created_at || new Date().toISOString(),
    }).eq("id", authUser.id);

    if (insertError) {
      console.error("[getCurrentUser] Gagal membuat profile:", insertError.message);
      return null;
    }

    // Ambil ulang setelah insert
    const { data: freshProfile } = await adminClient
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        identity_number,
        instansi,
        kelas,
        jurusan_id,
        avatar_url,
        approved,
        created_at,
        study_programs ( nama )
      `)
      .eq("id", authUser.id)
      .single();

    if (!freshProfile) return null;
    return this.mapToUser(freshProfile, authUser.email);
  }

  /**
   * getUserById — Cari user berdasarkan UUID
   *
   * Alur:
   * 1. Query profil dari tabel profiles dengan join study_programs
   * 2. Filter berdasarkan id
   * 3. Mapping ke domain User (tanpa email karena tidak join auth.users)
   *
   * @param id - UUID user yang dicari
   * @returns User atau null jika tidak ditemukan
   */
  async getUserById(id: string): Promise<User | null> {
    const supabase = this.getClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        identity_number,
        instansi,
        kelas,
        jurusan_id,
        avatar_url,
        approved,
        created_at,
        study_programs ( nama )
      `)
      .eq("id", id)
      .single();

    if (!profile) return null;
    return this.mapToUser(profile);
  }

  /**
   * getUsersByRole — Ambil semua user dengan role tertentu, diurutkan berdasarkan nama
   *
   * @param role - Filter role: "siswa" | "pembimbing" | "admin"
   * @returns Array User dengan role tersebut
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const supabase = this.getClient();

    const { data: profiles } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        identity_number,
        instansi,
        kelas,
        jurusan_id,
        avatar_url,
        approved,
        created_at,
        study_programs ( nama )
      `)
      .eq("role", role)
      .order("full_name", { ascending: true });

    return (profiles || []).map((p: any) => this.mapToUser(p));
  }

  /**
   * signIn — Login user dengan email & password
   *
   * Alur:
   * 1. Panggil supabase.auth.signInWithPassword
   * 2. Jika error → return pesan error generik (cegah user enumeration)
   * 3. Jika user_metadata.approved === false → logout & tolak dengan pesan spesifik
   * 4. Ambil data user via getCurrentUser
   *
   * @param email    - Email user
   * @param password - Password user
   * @returns Object berisi user yang login, atau pesan error
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
    const supabase = this.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("[signIn] Supabase auth error:", error.message, error.status);
      if (error.message?.includes("Email not confirmed") || error.message?.includes("email_not_confirmed")) {
        return { user: null, error: "Email belum dikonfirmasi. Cek inbox email kamu untuk tautan konfirmasi, atau hubungi admin." };
      }
      if (error.message?.includes("Invalid login credentials")) {
        return { user: null, error: "Email atau kata sandi salah. Pastikan email dan password benar." };
      }
      return { user: null, error: "Gagal login: " + error.message };
    }

    // Cek status approved — bedakan antara "diblokir" dan "belum disetujui"
    const authMeta = data.user?.user_metadata || {};
    if (authMeta.approved !== true) {
      await supabase.auth.signOut();
      if (authMeta.blocked === true) {
        return { user: null, error: "AKUN_DIBLOKIR" };
      }
      return { user: null, error: "AKUN_BELUM_DISETUJUI" };
    }

    // Cari profil di DB — jika tidak ada, buat dari data auth user
    const authUser = data.user;
    const adminClient = this.getAdminClient();
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, full_name, role, identity_number, instansi, kelas, jurusan_id, avatar_url, approved, created_at, study_programs(nama)")
      .eq("id", authUser.id)
      .single();

    if (existingProfile) {
      return { user: this.mapToUser(existingProfile, authUser.email) };
    }

    // Profile tidak ditemukan — buat dari metadata auth
    const meta = authUser.user_metadata || {};
    const { error: insertError } = await adminClient.from("profiles").upsert({
      id: authUser.id,
      full_name: meta.full_name || authUser.email?.split("@")[0] || "User",
      role: meta.role || "siswa",
      approved: true,
      created_at: authUser.created_at || new Date().toISOString(),
    }).eq("id", authUser.id);

    if (insertError) {
      console.error("[signIn] Gagal membuat profile:", insertError.message);
      return { user: null, error: "Gagal memuat profil pengguna." };
    }

    // Ambil ulang setelah insert (supaya dapat field lain seperti study_programs)
    const { data: freshProfile } = await adminClient
      .from("profiles")
      .select("id, full_name, role, identity_number, instansi, kelas, jurusan_id, avatar_url, approved, created_at, study_programs(nama)")
      .eq("id", authUser.id)
      .single();

    return { user: freshProfile ? this.mapToUser(freshProfile, authUser.email) : null };
  }

  /**
   * signUp — Registrasi user baru dari halaman pendaftaran
   *
   * Alur:
   * 1. Panggil supabase.auth.signUp dengan metadata (full_name, role)
   * 2. User akan terdaftar dengan status default (approved: false, di-handle trigger)
   * 3. Admin perlu menyetujui user sebelum bisa login
   *
   * @param input - Data registrasi (email, password, fullName, role)
   * @returns userId jika berhasil, atau pesan error
   */
  async signUp(input: CreateUserInput): Promise<{ userId?: string; error?: string }> {
    const { email, password, fullName, role, kelas, identityNumber, instansi, jurusanId } = input;
    const supabase = this.getAdminClient();

    const metadata: Record<string, any> = {
      full_name: fullName,
      role,
      approved: false,
    };
    if (kelas) metadata.kelas = kelas;
    if (jurusanId) metadata.jurusan_id = jurusanId;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: "Gagal membuat akun." };

    // Trigger handle_new_user sudah membuat baris profil (full_name, role, kelas).
    // Lengkapi dengan field tambahan via admin client (bypass RLS).
    const admin = this.getAdminClient();
    const updateData: any = {};
    if (identityNumber) updateData.identity_number = identityNumber;
    if (instansi) updateData.instansi = instansi;
    if (jurusanId) updateData.jurusan_id = jurusanId;
    updateData.approved = false;

    if (Object.keys(updateData).length > 0) {
      const { error: profileError } = await admin
        .from("profiles")
        .update(updateData)
        .eq("id", data.user.id);

      if (profileError) {
        console.error("signUp: gagal menyimpan data profil tambahan:", profileError.message);
      }
    }

    return { userId: data.user.id };
  }

  /**
   * signOut — Hapus session user yang sedang login
   */
  async signOut(): Promise<void> {
    const supabase = this.getClient();
    await supabase.auth.signOut();
  }

  /**
   * createUser — Admin membuat user baru (bypass approval, langsung aktif)
   *
   * Alur:
   * 1. Buat user via Supabase Admin API (email_confirm: true)
   * 2. Update profil dengan data tambahan (identityNumber, instansi, kelas, jurusanId)
   * 3. Generate QR token permanen untuk presensi siswa
   *
   * @param input - Data user lengkap
   * @returns userId jika berhasil, atau pesan error
   */
  async createUser(input: CreateUserInput): Promise<{ userId: string; error?: string }> {
    const supabase = this.getAdminClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: input.role,
        approved: true,
      },
    });

    if (authError || !authUser) {
      return { userId: "", error: "Gagal membuat akun: " + (authError?.message || "") };
    }

    // Update profil dengan data tambahan
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        identity_number: input.identityNumber || null,
        instansi: input.instansi || null,
        kelas: input.kelas || null,
        jurusan_id: input.jurusanId || null,
      })
      .eq("id", authUser.id);

    if (profileError) {
      return { userId: authUser.id, error: "Gagal menyimpan data: " + profileError.message };
    }

    // Generate QR token permanen — tidak kritis jika gagal
    try {
      await generatePermanentStudentToken(authUser.id, process.env.QR_SIGNING_SECRET!);
    } catch {
      // non-critical, user bisa generate QR ulang nanti
    }

    return { userId: authUser.id };
  }

  /**
   * updateProfile — Update data profil user
   *
   * Mapping field camelCase (domain) ke snake_case (database).
   * Hanya field yang disertakan dalam partial data yang akan diupdate.
   *
   * @param id   - UUID user yang akan diupdate
   * @param data - Partial data berisi field yang akan diubah
   * @returns Error message jika gagal, atau object kosong jika sukses
   */
  async updateProfile(id: string, data: Partial<User>): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    const updateData: Record<string, any> = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.identityNumber !== undefined) updateData.identity_number = data.identityNumber;
    if (data.instansi !== undefined) updateData.instansi = data.instansi;
    if (data.kelas !== undefined) updateData.kelas = data.kelas;
    if (data.jurusanId !== undefined) updateData.jurusan_id = data.jurusanId;
    if (data.role !== undefined) updateData.role = data.role;
    if ((data as any).avatarUrl !== undefined) updateData.avatar_url = (data as any).avatarUrl;

    if (Object.keys(updateData).length === 0) return {};

    const { error } = await supabase.from("profiles").update(updateData as any).eq("id", id);
    if (error) return { error: error.message };
    return {};
  }

  /**
   * getPendingUsers — Ambil daftar user yang belum disetujui admin
   *
   * Alur:
   * 1. Ambil semua user dari Auth API via admin.listUsers()
   * 2. Filter user dengan metadata approved !== true
   * 3. Ambil profil dari tabel profiles untuk user yang belum disetujui
   * 4. Gabungkan data auth + profil, return array terformat
   *
   * @returns Array PendingUser berisi user yang menunggu persetujuan
   */
  async getPendingUsers(): Promise<PendingUser[]> {
    const supabase = this.getAdminClient();

    const { data, error } = await supabase.auth.admin.listUsers();
    if (error || !data?.users) return [];

    // Filter user yang belum disetujui (approved !== true), kecuali owner, root & blocked
    const pendingIds = data.users
      .filter((u) => u.user_metadata?.approved !== true
        && !["owner", "root"].includes(u.user_metadata?.role)
        && u.user_metadata?.blocked !== true)
      .map((u) => u.id);

    if (pendingIds.length === 0) return [];

    // Ambil profil untuk user yang belum disetujui
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .in("id", pendingIds)
      .neq("role", "owner")
      .neq("role", "root");

    // Gabungkan data auth dengan profil
    return pendingIds.map((id) => {
      const authUser = data.users.find((u) => u.id === id);
      const profile = (profiles || []).find((p) => p.id === id);
      return {
        id,
        email: authUser?.email || "",
        fullName: profile?.full_name || authUser?.user_metadata?.full_name || "—",
        role: profile?.role || authUser?.user_metadata?.role || "siswa",
        createdAt: profile?.created_at || authUser?.created_at || new Date().toISOString(),
      };
    });
  }

  /**
   * approveUser — Setujui akun user
   * Update auth metadata + profiles.approved
   */
  async approveUser(userId: string): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { approved: true },
    });
    if (error) return { error: "Gagal menyetujui user: " + error.message };

    // Sync ke profiles table juga
    await supabase.from("profiles").update({ approved: true }).eq("id", userId);
    return {};
  }

  /**
   * rejectUser — Tolak akun user (hapus dari Auth + profiles)
   */
  async rejectUser(userId: string): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    // Cek apakah user adalah root — root tidak bisa ditolak
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role === "root" || profile?.role === "owner") {
      return { error: "Tidak dapat menolak akun root/owner." };
    }

    // Hapus dari profiles dulu (agar foreign key tidak bermasalah)
    await supabase.from("profiles").delete().eq("id", userId);

    const { error } = await supabase.auth.admin.deleteUser(userId, true);
    if (error) return { error: "Gagal menolak user: " + error.message };
    return {};
  }

  /**
   * deleteUser — Hapus akun user (auth + profiles)
   */
  async deleteUser(userId: string): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    // Cek apakah user adalah root — root tidak bisa dihapus
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role === "root" || profile?.role === "owner") {
      return { error: "Tidak dapat menghapus akun root/owner." };
    }

    // Hapus dari profiles dulu
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
    if (profileError) {
      console.error("[deleteUser] Gagal hapus profile:", profileError.message);
    }

    // Hapus dari auth.users
    const { error } = await supabase.auth.admin.deleteUser(userId, true);
    if (error) return { error: "Gagal menghapus user: " + error.message };
    return {};
  }

  /**
   * blockUser — Blokir user (set approved = false di metadata + profiles)
   */
  async blockUser(userId: string): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    // Cek apakah user adalah root — root tidak bisa diblokir
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role === "root" || profile?.role === "owner") {
      return { error: "Tidak dapat memblokir akun root/owner." };
    }

    const { data: existing } = await supabase.auth.admin.getUserById(userId);
    const meta = { ...(existing?.user?.user_metadata || {}), approved: false, blocked: true };
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: meta,
    });
    if (error) return { error: "Gagal memblokir user: " + error.message };

    // Sync ke profiles
    await supabase.from("profiles").update({ approved: false }).eq("id", userId);

    // Paksa logout semua sesi user yang sedang aktif
    await supabase.auth.admin.signOut(userId);

    return {};
  }

  /**
   * unblockUser — Buka blokir user (set approved = true di metadata + profiles)
   */
  async unblockUser(userId: string): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    // Ambil metadata existing dulu, jangan timpa semua
    const { data: existing } = await supabase.auth.admin.getUserById(userId);
    if (!existing?.user) return { error: "User tidak ditemukan" };

    const meta: Record<string, any> = { ...existing.user.user_metadata, approved: true };
    delete meta.blocked;
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: meta,
    });
    if (error) return { error: "Gagal membuka blokir: " + error.message };

    // Sync ke profiles
    await supabase.from("profiles").update({ approved: true }).eq("id", userId);
    return {};
  }

  /**
   * updateUserRole — Ganti role user
   */
  async updateUserRole(userId: string, role: UserRole): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    // Cek apakah user adalah root — root tidak bisa diubah role-nya
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role === "root" || profile?.role === "owner") {
      return { error: "Tidak dapat mengubah role akun root/owner." };
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });
    if (error) return { error: "Gagal mengubah role: " + error.message };
    // Update juga di profiles table
    await supabase.from("profiles").update({ role }).eq("id", userId);
    return {};
  }

  /**
   * getAttendanceStats — Hitung statistik presensi untuk semua/siswa tertentu
   *
   * Alur:
   * 1. Hitung tanggal awal berdasarkan parameter days (default 30)
   * 2. Query semua profil siswa dengan filter opsional (studentId, name, kelas)
   * 3. Ambil data presensi + izin dalam rentang waktu (paralel)
   * 4. Filter jurusan secara client-side (karena dari relasi)
   * 5. Hitung hadir, telat, izin, sakit, alfa per siswa
   *
   * @param query - Filter: days, studentId, name, jurusan, kelas
   * @returns Array AttendanceStats berisi rekap per siswa
   */
  async getAttendanceStats(query: AttendanceStatsQuery): Promise<AttendanceStats[]> {
    const supabase = this.getAdminClient();

    const days = query.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const start = startDate.toISOString().slice(0, 10);

    // Query siswa dengan filter opsional
    let studentsQuery = supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        kelas,
        jurusan_id,
        avatar_url,
        approved,
        created_at,
        study_programs ( nama )
      `)
      .eq("role", "siswa");

    if (query.studentId) studentsQuery = studentsQuery.eq("id", query.studentId);
    if (query.name) studentsQuery = studentsQuery.ilike("full_name", `%${query.name}%`);
    if (query.kelas) studentsQuery = studentsQuery.ilike("kelas", `%${query.kelas}%`);

    const { data: students } = await studentsQuery;
    if (!students) return [];

    // Ambil data presensi & izin dalam rentang waktu (paralel)
    const [{ data: records }, { data: leaves }] = await Promise.all([
      supabase
        .from("attendance_records")
        .select("student_id, status, scanned_at")
        .gte("scanned_at", `${start}T00:00:00`),
      supabase
        .from("leave_requests")
        .select("student_id, type, start_date, end_date")
        .gte("end_date", start),
    ]);

    // Hitung statistik untuk setiap siswa
    return (students as any[])
      .filter((student: any) => {
        // Filter jurusan dilakukan client-side karena berasal dari relasi
        if (query.jurusan) {
          const studentJurusan = student.study_programs?.nama;
          if (!studentJurusan?.toLowerCase().includes(query.jurusan.toLowerCase())) return false;
        }
        return true;
      })
      .map((student: any) => {
        // Hitung hadir & telat dari attendance_records
        const studentRecords = (records as any[])?.filter(r => r.student_id === student.id) || [];
        const hadir = studentRecords.filter(r => r.status === "hadir").length;
        const telat = studentRecords.filter(r => r.status === "telat").length;

        // Hitung izin & sakit dari leave_requests (hitung jumlah hari)
        const studentLeaves = (leaves as any[])?.filter(l => l.student_id === student.id) || [];
        let izin = 0;
        let sakit = 0;

        studentLeaves.forEach((leave: any) => {
          const s = new Date(leave.start_date);
          const e = new Date(leave.end_date);
          let dayCount = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          // Batasi agar tidak melebihi rentang awal
          const limitStart = new Date(start);
          if (s < limitStart) {
            dayCount = Math.ceil((e.getTime() - limitStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          }
          if (leave.type === "izin") izin += dayCount;
          if (leave.type === "sakit") sakit += dayCount;
        });

        // Gunakan created_at siswa sebagai batas awal alpha terbaru
        const studentCreated = student.created_at ? new Date(student.created_at) : new Date(start);
        const effectiveStart = studentCreated > new Date(start) ? studentCreated : new Date(start);

        // Hitung alfa: sisa hari tanpa presensi dan tanpa izin
        const hasAnyRecords = (hadir + telat + izin + sakit) > 0;
        const endDate = new Date();
        let totalDays = Math.ceil((endDate.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
        totalDays = Math.max(totalDays, 1);
        const alfa = hasAnyRecords ? Math.max(0, totalDays - (hadir + telat + izin + sakit)) : 0;

        return {
          studentId: student.id,
          fullName: student.full_name,
          kelas: student.kelas,
          jurusan: student.study_programs?.nama || null,
          avatarUrl: student.avatar_url || null,
          hadir,
          telat,
          izin,
          sakit,
          alfa,
          total: totalDays,
        };
      });
  }

  /**
   * getAllStudents — Ambil semua user dengan role siswa, lengkap dengan jurusan
   *
   * @returns Array User dengan role "siswa", diurutkan berdasarkan nama
   */
  async getAllStudents(): Promise<User[]> {
    const supabase = this.getClient();

    const { data: profiles } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        identity_number,
        instansi,
        kelas,
        jurusan_id,
        approved,
        created_at,
        study_programs ( nama )
      `)
      .eq("role", "siswa")
      .order("full_name", { ascending: true });

    return (profiles || []).map((p: any) => this.mapToUser(p));
  }
}
