/*
 * database.ts — Tipe TypeScript untuk Schema Database
 * ==========================================
 * Mendefinisikan tipe untuk seluruh tabel di database Supabase.
 * File ini merefleksikan schema.sql secara manual.
 *
 * CATATAN TEKNIS:
 * - Insert/Update sengaja ditulis eksplisit per field (bukan `Partial<Row>`)
 *   karena Partial<T> membuat TypeScript gagal meresolusi generic query builder
 *   Supabase (hasil query jadi `never`).
 * - Jika ada auto-generate dari Supabase CLI (`supabase gen types typescript`),
 *   file ini bisa digantikan dengan hasil generate tsb.
 *
 * TABEL:
 * - profiles → Data user (siswa, pembimbing, admin)
 * - student_mentors → Relasi pembimbing-siswa
 * - attendance_sessions → Sesi QR presensi harian
 * - attendance_records → Record presensi per siswa per sesi
 * - leave_requests → Pengajuan izin/cuti/sakit siswa
 * - logbook_entries → Catatan kegiatan harian siswa
 * - study_programs → Program studi / jurusan
 * - calendar_events → Event kalender akademik
 * - announcements & announcement_recipients → Pengumuman
 * - allowed_locations → Geofence lokasi presensi
 */

/** Role user dalam sistem */
export type UserRole = "siswa" | "pembimbing" | "admin" | "owner" | "root";
/** Status presensi — hanya "hadir" atau "telat" */
export type AttendanceStatus = "hadir" | "telat";
/** Jenis izin yang bisa diajukan siswa */
export type LeaveType = "izin" | "sakit" | "cuti";
/** Status pengajuan izin */
export type LeaveStatus = "pending" | "disetujui" | "ditolak";

/** Profil user — data inti untuk semua role (siswa, pembimbing, admin) */
export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  identity_number: string | null;
  instansi: string | null;
  kelas: string | null;
  jurusan_id: string | null;
  avatar_url: string | null;
  approved: boolean;
  created_at: string;
  updated_at: string;
};

/** Sesi presensi QR — dibuat oleh admin per hari, berlaku 12 jam */
export type AttendanceSession = {
  id: string;
  session_date: string;
  token: string;
  expires_at: string;
  created_by: string;
  created_at: string;
};

/** Record presensi — 1 record per siswa per sesi (unique: student_id + session_date) */
export type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  scanned_at: string;
  device_info: string | null;
};

/** Pengajuan izin/cuti/sakit — diajukan siswa, direview pembimbing/admin */
export type LeaveRequest = {
  id: string;
  student_id: string;
  type: LeaveType;
  reason: string;
  start_date: string;
  end_date: string;
  proof_path: string | null;
  proof_url: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
};

/** Entri logbook — catatan kegiatan harian siswa, bisa dinilai pembimbing */
export type LogbookEntry = {
  id: string;
  student_id: string;
  entry_date: string;
  content: string;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Program studi / jurusan */
export type StudyProgram = {
  id: string;
  nama: string;
  kode: string;
  created_at: string;
};

/** Event kalender — bisa event umum atau spesifik per siswa */
export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  tipe: "libur" | "event";
  student_id: string | null;
  created_by: string;
  created_at: string;
};

/** Pengumuman — bisa dikirim ke semua siswa atau per program studi */
export type Announcement = {
  id: string;
  title: string;
  content: string;
  broadcast_to_all: boolean;
  created_by: string;
  created_at: string;
};

/** Penerima pengumuman (jika broadcast_to_all = false) */
export type AnnouncementRecipient = {
  id: string;
  announcement_id: string;
  study_program_id: string;
};

/** Lokasi yang diizinkan untuk presensi (geofence) */
export type AllowedLocation = {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
  updated_at: string;
};

/**
 * Database — Tipe utama untuk SupabaseClient<Database>
 * Berisi semua tabel, view, fungsi, enum, dan composite types.
 */
export type Database = {
  public: {
    Tables: {
      /** Data profil user (siswa, pembimbing, admin) */
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          identity_number?: string | null;
          instansi?: string | null;
          kelas?: string | null;
          jurusan_id?: string | null;
          avatar_url?: string | null;
          approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          identity_number?: string | null;
          instansi?: string | null;
          kelas?: string | null;
          jurusan_id?: string | null;
          avatar_url?: string | null;
          approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /** Relasi pembimbing ↔ siswa (many-to-many) */
      student_mentors: {
        Row: { student_id: string; mentor_id: string; assigned_at: string };
        Insert: { student_id: string; mentor_id: string; assigned_at?: string };
        Update: { student_id?: string; mentor_id?: string; assigned_at?: string };
        Relationships: [];
      };
      /** Sesi QR presensi harian (1 per hari, upsert) */
      attendance_sessions: {
        Row: AttendanceSession;
        Insert: {
          id?: string;
          session_date?: string;
          token: string;
          expires_at: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_date?: string;
          token?: string;
          expires_at?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      /** Record presensi — 1 entry per siswa per sesi */
      attendance_records: {
        Row: AttendanceRecord;
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          status?: AttendanceStatus;
          scanned_at?: string;
          device_info?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          status?: AttendanceStatus;
          scanned_at?: string;
          device_info?: string | null;
        };
        Relationships: [];
      };
      /** Pengajuan izin/cuti/sakit siswa */
      leave_requests: {
        Row: LeaveRequest;
        Insert: {
          id?: string;
          student_id: string;
          type: LeaveType;
          reason: string;
          start_date: string;
          end_date: string;
          proof_path?: string | null;
          proof_url?: string | null;
          status?: LeaveStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          type?: LeaveType;
          reason?: string;
          start_date?: string;
          end_date?: string;
          proof_path?: string | null;
          proof_url?: string | null;
          status?: LeaveStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      /** Catatan kegiatan harian siswa (1 per hari per siswa, upsert) */
      logbook_entries: {
        Row: LogbookEntry;
        Insert: {
          id?: string;
          student_id: string;
          entry_date?: string;
          content: string;
          grade?: number | null;
          feedback?: string | null;
          graded_by?: string | null;
          graded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          entry_date?: string;
          content?: string;
          grade?: number | null;
          feedback?: string | null;
          graded_by?: string | null;
          graded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /** Program studi / jurusan */
      study_programs: {
        Row: StudyProgram;
        Insert: { id?: string; nama: string; kode: string; created_at?: string };
        Update: { id?: string; nama?: string; kode?: string; created_at?: string };
        Relationships: [];
      };
      /** Event kalender akademik (libur/event) */
      calendar_events: {
        Row: CalendarEvent;
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          end_date?: string | null;
          tipe?: "libur" | "event";
          student_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          end_date?: string | null;
          tipe?: "libur" | "event";
          student_id?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      /** Pengumuman (broadcast) */
      announcements: {
        Row: Announcement;
        Insert: {
          id?: string;
          title: string;
          content: string;
          broadcast_to_all?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          broadcast_to_all?: boolean;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      /** Penerima pengumuman spesifik per program studi */
      announcement_recipients: {
        Row: AnnouncementRecipient;
        Insert: {
          id?: string;
          announcement_id: string;
          study_program_id: string;
        };
        Update: {
          id?: string;
          announcement_id?: string;
          study_program_id?: string;
        };
        Relationships: [];
      };
      student_documents: {
        Row: {
          id: string;
          student_id: string;
          admin_id: string;
          type: string;
          file_url: string | null;
          file_name: string | null;
          grade_data: unknown;
          is_kept: boolean;
          is_read: boolean;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          admin_id: string;
          type: string;
          file_url?: string | null;
          file_name?: string | null;
          grade_data?: unknown;
          is_kept?: boolean;
          is_read?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          admin_id?: string;
          type?: string;
          file_url?: string | null;
          file_name?: string | null;
          grade_data?: unknown;
          is_kept?: boolean;
          is_read?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_documents_admin_id_fkey";
            columns: ["admin_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      /** Lokasi geofence yang diizinkan untuk presensi */
      allowed_locations: {
        Row: AllowedLocation;
        Insert: {
          id?: string;
          nama: string;
          latitude: number;
          longitude: number;
          radius_meters?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          latitude?: number;
          longitude?: number;
          radius_meters?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      attendance_status: AttendanceStatus;
      leave_type: LeaveType;
      leave_status: LeaveStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
