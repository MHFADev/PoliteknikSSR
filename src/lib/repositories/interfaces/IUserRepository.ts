// ============================================================
// IUserRepository — Interface Repository untuk Manajemen User
// ============================================================
// Menangani operasi CRUD user, autentikasi, manajemen role,
// persetujuan akun, dan statistik presensi.
//
// Semua method mengembalikan Promise (async).
// Input/output menggunakan tipe domain (types.ts), BUKAN tipe database.
// ============================================================

import type {
  User,
  UserRole,
  CreateUserInput,
  PendingUser,
  AttendanceStatsQuery,
  AttendanceStats,
} from "../types";

export interface IUserRepository {
  /**
   * getCurrentUser — Ambil user yang sedang login dari session
   * @returns User yang sedang login, atau null jika belum login
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * getUserById — Cari user berdasarkan ID
   * @param id — UUID user
   * @returns User atau null jika tidak ditemukan
   */
  getUserById(id: string): Promise<User | null>;

  /**
   * getUsersByRole — Ambil semua user dengan role tertentu
   * @param role — filter role (siswa, pembimbing, admin)
   * @returns Array user dengan role tsb
   */
  getUsersByRole(role: UserRole): Promise<User[]>;

  /**
   * signIn — Login dengan email & password
   * @param email — Email user
   * @param password — Password user
   * @returns User yang login, atau error jika gagal
   */
  signIn(email: string, password: string): Promise<{ user: User | null; error?: string }>;

  /**
   * signUp — Registrasi user baru (dari halaman daftar)
   * @param input — Data registrasi (CreateUserInput)
   * @returns userId jika berhasil, atau error
   */
  signUp(input: CreateUserInput): Promise<{ userId?: string; error?: string }>;

  /**
   * signOut — Logout, hapus session
   */
  signOut(): Promise<void>;

  /**
   * createUser — Admin membuat user baru (bypass approval)
   * @param input — Data user (CreateUserInput)
   * @returns userId jika berhasil, atau error
   */
  createUser(input: CreateUserInput): Promise<{ userId: string; error?: string }>;

  /**
   * updateProfile — Update data profil user
   * @param id — UUID user
   * @param data — Partial field yang akan diupdate
   */
  updateProfile(id: string, data: Partial<User>): Promise<{ error?: string }>;

  /**
   * getPendingUsers — Ambil daftar user yang menunggu persetujuan
   * @returns Array user pending
   */
  getPendingUsers(): Promise<PendingUser[]>;

  /**
   * approveUser — Setujui akun user (ubah status jadi approved)
   * @param userId — UUID user
   */
  approveUser(userId: string): Promise<{ error?: string }>;

  /**
   * rejectUser — Tolak akun user (hapus dari sistem)
   * @param userId — UUID user
   */
  rejectUser(userId: string): Promise<{ error?: string }>;

  /**
   * getAttendanceStats — Hitung statistik presensi untuk seluruh siswa
   * @param query — Filter statistik (rentang hari, jurusan, kelas, dll)
   * @returns Array statistik per siswa
   */
  getAttendanceStats(query: AttendanceStatsQuery): Promise<AttendanceStats[]>;

  /**
   * getAllStudents — Ambil semua siswa dengan info program studi
   * @returns Array user dengan role siswa, lengkap dengan nama jurusan
   */
  getAllStudents(): Promise<User[]>;
}
