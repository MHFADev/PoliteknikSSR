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
        approved,
        created_at,
        study_programs ( nama )
      `)
      .eq("id", authUser.id)
      .single();

    if (!profile) return null;
    return this.mapToUser(profile, authUser.email);
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
      return { user: null, error: "Email atau kata sandi salah." };
    }

    // Cek status approved — blokir jika admin belum menyetujui
    if (data.user?.user_metadata?.approved === false) {
      await supabase.auth.signOut();
      return { user: null, error: "Akun Anda belum disetujui oleh admin. Silakan tunggu persetujuan." };
    }

    const user = await this.getCurrentUser();
    return { user };
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
    const supabase = this.getClient();

    const metadata: Record<string, any> = {
      full_name: fullName,
      role,
    };
    if (kelas) metadata.kelas = kelas;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: "Gagal membuat akun." };

    // Trigger handle_new_user sudah membuat baris profil (full_name, role, kelas).
    // Lengkapi dengan field tambahan via admin client (bypass RLS).
    if (identityNumber || instansi || jurusanId) {
      const admin = this.getAdminClient();
      const { error: profileError } = await admin
        .from("profiles")
        .update({
          identity_number: identityNumber || null,
          instansi: instansi || null,
          jurusan_id: jurusanId || null,
        })
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

    // Filter user yang belum disetujui (approved !== true)
    const pendingIds = data.users
      .filter((u) => u.user_metadata?.approved !== true)
      .map((u) => u.id);

    if (pendingIds.length === 0) return [];

    // Ambil profil untuk user yang belum disetujui
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .in("id", pendingIds);

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
   * approveUser — Setujui akun user (ubah metadata jadi approved: true)
   *
   * @param userId - UUID user yang akan disetujui
   * @returns Error message jika gagal, atau object kosong jika sukses
   */
  async approveUser(userId: string): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { approved: true },
    });

    if (error) return { error: "Gagal menyetujui user: " + error.message };
    return {};
  }

  /**
   * rejectUser — Tolak akun user (hapus dari Auth)
   *
   * @param userId - UUID user yang akan ditolak
   * @returns Error message jika gagal, atau object kosong jika sukses
   */
  async rejectUser(userId: string): Promise<{ error?: string }> {
    const supabase = this.getAdminClient();

    const { error } = await supabase.auth.admin.deleteUser(userId, true);

    if (error) return { error: "Gagal menolak user: " + error.message };
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

        // Hitung alfa: sisa hari tanpa presensi dan tanpa izin
        const hasAnyRecords = (hadir + telat + izin + sakit) > 0;
        const endDate = new Date();
        let totalDays = Math.ceil((endDate.getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
        totalDays = Math.max(totalDays, 1);
        const alfa = hasAnyRecords ? Math.max(0, totalDays - (hadir + telat + izin + sakit)) : 0;

        return {
          studentId: student.id,
          fullName: student.full_name,
          kelas: student.kelas,
          jurusan: student.study_programs?.nama || null,
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
