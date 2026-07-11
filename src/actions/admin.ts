/*
 * admin.ts — Fungsi Admin (Server Actions)
 * ==========================================
 * Berisi operasi CRUD yang hanya bisa dilakukan oleh role Admin:
 * - Statistik presensi 30 hari
 * - Manajemen akun siswa (tambah siswa baru)
 * - Manajemen program studi
 *
 * Alur:
 * - Seluruh fungsi menggunakan `createAdminClient()` (service role) karena
 *   butuh bypass RLS untuk operasi administratif.
 * - `get30DayAttendanceStats` mengambil data presensi + izin 30 hari terakhir
 *   lalu menghitung statistik per siswa.
 * - `addStudent` membuat akun via Admin API, kemudian update profil, lalu
 *   generate QR token permanen siswa.
 * - `ensureStudyProgram` mencari/membuat program studi baru.
 */

"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generatePermanentStudentToken } from "@/lib/qr-token";

/**
 * AttendanceStats — Tipe data untuk statistik presensi 30 hari per siswa
 */
export interface AttendanceStats {
  studentId: string;
  fullName: string;
  kelas: string | null;
  jurusan: string | null;
  hadir: number;
  telat: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
}

/**
 * get30DayAttendanceStats — Ambil statistik presensi 30 hari terakhir
 * @param filters.studentId - Filter spesifik per ID siswa
 * @param filters.name - Filter berdasarkan nama (ilike)
 * @param filters.jurusan - Filter berdasarkan jurusan
 * @param filters.kelas - Filter berdasarkan kelas
 * @returns Array AttendanceStats[] berisi rekap per siswa
 *
 * Alur:
 * 1. Hitung tanggal 30 hari lalu sebagai batas awal
 * 2. Query semua profil siswa (dengan filter opsional)
 * 3. Ambil record presensi + pengajuan izin dalam rentang waktu
 * 4. Hitung hadir, telat, izin, sakit, alfa per siswa
 */
export async function get30DayAttendanceStats(
  filters?: { studentId?: string; name?: string; jurusan?: string; kelas?: string }
): Promise<AttendanceStats[]> {
  const supabase = createAdminClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
  
  // --- Ambil semua siswa (dengan filter opsional) ---
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
    
  if (filters?.studentId) {
    studentsQuery = studentsQuery.eq("id", filters.studentId);
  }
  if (filters?.name) {
    studentsQuery = studentsQuery.ilike("full_name", `%${filters.name}%`);
  }
  if (filters?.kelas) {
    studentsQuery = studentsQuery.ilike("kelas", `%${filters.kelas}%`);
  }
  
  const { data: students, error: studentsError } = await studentsQuery;
  
  if (studentsError || !students) return [];
  
  // --- Ambil semua data presensi & izin 30 hari terakhir (paralel) ---
  const [{ data: records }, { data: leaves }] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("student_id, status, scanned_at")
      .gte("scanned_at", `${startDate}T00:00:00`),
    supabase
      .from("leave_requests")
      .select("student_id, type, start_date, end_date")
      .gte("end_date", startDate)
  ]);
  
  // --- Hitung statistik untuk setiap siswa ---
  const stats: AttendanceStats[] = (students as any[])
    .filter((student: any) => {
      // Filter jurusan dilakukan client-side karena relasi
      if (filters?.jurusan) {
        const studentJurusan = student.study_programs?.nama;
        if (!studentJurusan?.toLowerCase().includes(filters.jurusan.toLowerCase())) {
          return false;
        }
      }
      return true;
    })
    .map((student: any) => {
    // --- Hitung hadir & telat dari attendance_records ---
    const studentRecords = (records as any[])?.filter(r => r.student_id === student.id) || [];
    const hadir = studentRecords.filter(r => r.status === "hadir").length;
    const telat = studentRecords.filter(r => r.status === "telat").length;
    
    // --- Hitung izin & sakit dari leave_requests (hitung jumlah hari) ---
    const studentLeaves = (leaves as any[])?.filter(l => l.student_id === student.id) || [];
    let izin = 0;
    let sakit = 0;
    
    studentLeaves.forEach(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      // Batasi agar tidak melebihi 30 hari
      const startLimit = new Date(startDate);
      if (start < startLimit) {
        days = Math.ceil((end.getTime() - startLimit.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      if (leave.type === "izin") izin += days;
      if (leave.type === "sakit") sakit += days;
    });
    
    // --- Hitung alfa: sisa hari yang tidak tercatat ---
    // Alfa hanya dihitung jika ada record (untuk menghindari false positive)
    const hasAnyRecords = (hadir + telat + izin + sakit) > 0;
    const endDate = new Date();
    let totalDays = Math.ceil((endDate.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
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
      total: totalDays
    };
  });
  
  return stats;
}

interface AddStudentArgs {
  fullName: string;
  email: string;
  password: string;
  identityNumber?: string;
  instansi?: string;
  kelas?: string;
  jurusanId?: string;
}

/**
 * addStudent — Buat akun siswa baru (hanya Admin)
 * @param fullName - Nama lengkap siswa
 * @param email - Email untuk login
 * @param password - Password akun
 * @param identityNumber - NIS/NIM (opsional)
 * @param instansi - Instansi (opsional)
 * @param kelas - Kelas (opsional)
 * @param jurusanId - ID program studi (opsional)
 * @returns Object sukses dengan studentId + permanentToken, atau pesan error
 *
 * Alur:
 * 1. Buat user via Supabase Admin API (email_confirm: true)
 * 2. Update profil siswa dengan data tambahan
 * 3. Generate QR token permanen untuk presensi QR
 * 4. Revalidate path pengguna admin
 */
export async function addStudent({
  fullName,
  email,
  password,
  identityNumber,
  instansi,
  kelas,
  jurusanId,
}: AddStudentArgs): Promise<{ success: true; studentId: string; permanentToken: string } | { success: false; message: string }> {
  const supabase = createAdminClient();

  const { data: { user: authUser }, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "siswa",
    },
  });

  if (authError) {
    return { success: false, message: "Gagal membuat akun: " + authError.message };
  }

  const studentId = authUser!.id;

  // --- Update profil dengan data tambahan (mengisi field yang mungkin terlewat oleh handle_new_user) ---
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      identity_number: identityNumber || null,
      instansi: instansi || null,
      kelas: kelas || null,
      jurusan_id: jurusanId || null,
    })
    .eq("id", studentId);

  if (profileError) {
    return { success: false, message: "Gagal menyimpan data siswa: " + profileError.message };
  }

  // --- Generate token QR permanen untuk presensi ---
  const permanentToken = await generatePermanentStudentToken(studentId, process.env.QR_SIGNING_SECRET!);

  revalidatePath("/dashboard/admin/pengguna");

  return { success: true, studentId, permanentToken };
}

/**
 * ensureStudyProgram — Cari atau buat program studi baru
 * @param nama - Nama program studi
 * @returns ID program studi (baru atau existing), atau null + error message
 *
 * Alur:
 * 1. Cek apakah program studi sudah ada (case-insensitive)
 * 2. Jika sudah ada, kembalikan ID-nya
 * 3. Jika belum, buat baru dengan kode otomatis dari nama
 */
export async function ensureStudyProgram(
  nama: string
): Promise<{ id: string | null; error?: string }> {
  const supabase = createAdminClient();
  const trimmed = nama.trim();
  if (!trimmed) return { id: null };

  // --- Cari program studi yang sudah ada ---
  const { data: existing } = await supabase
    .from("study_programs")
    .select("id")
    .ilike("nama", trimmed)
    .maybeSingle();

  if (existing) return { id: existing.id };

  // --- Generate kode otomatis dari nama (uppercase, tanpa karakter spesial) ---
  const kode = trimmed
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 10);

  // --- Buat program studi baru ---
  const { data, error } = await supabase
    .from("study_programs")
    .insert({ nama: trimmed, kode })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id };
}
