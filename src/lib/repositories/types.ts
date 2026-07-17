// ============================================================
// Tipe Domain Entities — Database-agnostic
// ============================================================
// Type ini PURE domain, tidak bergantung pada Supabase atau ORM apapun.
// Setiap repository akan mapping dari database ke tipe ini.
//
// PEMBARUAN: Jika kolom baru ditambahkan ke schema.sql, tambahkan juga
// field yang sesuai di sini. Interface ini adalah "source of truth"
// untuk model data yang dipakai di seluruh aplikasi.
// ============================================================

export type UserRole = "siswa" | "pembimbing" | "admin" | "owner" | "root";
export type AttendanceStatus = "hadir" | "telat";
export type LeaveType = "izin" | "sakit" | "cuti";
export type LeaveStatus = "pending" | "disetujui" | "ditolak";
export type EventType = "libur" | "event";

// -----------------------------------------------------------
// User / Profile
// -----------------------------------------------------------
// `email` berasal dari auth.users (join).
// `studyProgramName` berasal dari join dengan study_programs.
// `approved` menandakan akun sudah diverifikasi admin.
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  identityNumber: string | null;
  instansi: string | null;
  kelas: string | null;
  jurusanId: string | null;
  studyProgramName: string | null;
  avatarUrl: string | null;
  approved: boolean;
  createdAt: string;
}

// -----------------------------------------------------------
// Study Program / Jurusan
// -----------------------------------------------------------
export interface StudyProgram {
  id: string;
  nama: string;
  kode: string;
}

// -----------------------------------------------------------
// Student <-> Mentor relationship
// -----------------------------------------------------------
export interface StudentMentor {
  studentId: string;
  mentorId: string;
}

// -----------------------------------------------------------
// Sesi Presensi (QR Code)
// -----------------------------------------------------------
export interface AttendanceSession {
  id: string;
  sessionDate: string;
  token: string;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
}

// -----------------------------------------------------------
// Record Presensi (hasil scan QR oleh siswa)
// -----------------------------------------------------------
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  scannedAt: string;
  status: AttendanceStatus;
}

// -----------------------------------------------------------
// Pengajuan Izin / Sakit / Cuti
// -----------------------------------------------------------
export interface LeaveRequest {
  id: string;
  studentId: string;
  type: LeaveType;
  reason: string;
  proofUrl: string | null;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

// -----------------------------------------------------------
// Logbook / Catatan Kegiatan Harian
// -----------------------------------------------------------
export interface LogbookEntry {
  id: string;
  studentId: string;
  entryDate: string;
  activity: string;
  photoUrl: string | null;
  grade: number | null;
  feedback: string | null;
  gradedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------
// Event Kalender (libur / event)
// -----------------------------------------------------------
// `creatorName` dan `studentName` berasal dari join dengan tabel profiles.
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  tipe: EventType;
  studentId: string | null;
  createdBy: string;
  creatorName: string | null;
  studentName: string | null;
}

// -----------------------------------------------------------
// Lokasi yang Diizinkan (Geofence)
// -----------------------------------------------------------
export interface AllowedLocation {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// -----------------------------------------------------------
// Pengumuman (Broadcast)
// -----------------------------------------------------------
// `recipients` adalah daftar ID program studi yang menerima
// pengumuman (kosong jika broadcastToAll = true).
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  broadcastToAll: boolean;
  recipients: string[];
}

// ============================================================
// Tipe untuk Filter & Query
// ============================================================

// Parameter untuk query statistik presensi.
// `days` membatasi rentang tanggal (default 30 hari ke belakang).
export interface AttendanceStatsQuery {
  days?: number;
  studentId?: string;
  name?: string;
  jurusan?: string;
  kelas?: string;
}

// Statistik presensi per siswa — dihitung dari attendance_records & leave_requests.
// `alfa` = hari tanpa presensi dan tanpa izin (berdasarkan total hari kerja).
export interface AttendanceStats {
  studentId: string;
  fullName: string;
  kelas: string | null;
  jurusan: string | null;
  avatarUrl: string | null;
  hadir: number;
  telat: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
}

// Data presensi & izin bulanan untuk satu siswa.
// Dipakai di halaman kalender untuk menampilkan ringkasan.
// studentSince — tanggal pendaftaran siswa (dari profiles.created_at),
// berguna untuk mengetahui kapan siswa mulai aktif dan wajib presensi.
export interface MonthlyAttendance {
  records: { scannedAt: string; status: string }[];
  leaves: { startDate: string; endDate: string; type: string; status: string }[];
  studentSince: string | null;
}

// -----------------------------------------------------------
// Input DTOs — Data Transfer Objects untuk operasi Create
// -----------------------------------------------------------

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  identityNumber?: string;
  instansi?: string;
  kelas?: string;
  jurusanId?: string;
  periode?: string;
}

export interface CreateEventInput {
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  tipe: EventType;
  studentId: string | null;
  createdBy: string;
}

export interface CreateLeaveInput {
  studentId: string;
  type: LeaveType;
  reason: string;
  proofUrl?: string;
  startDate: string;
  endDate: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  createdBy: string;
  broadcastToAll: boolean;
  studyProgramIds: string[];
}

export interface CreateLocationInput {
  nama: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// User yang menunggu persetujuan admin (baru daftar).
export interface PendingUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}
