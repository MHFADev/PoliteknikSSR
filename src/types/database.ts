// Tipe ini merefleksikan schema.sql. Jika kamu generate tipe otomatis dari Supabase CLI
// (supabase gen types typescript), file ini bisa digantikan hasil generate tsb.
//
// CATATAN PENTING: Insert/Update sengaja ditulis eksplisit per field (bukan `Partial<Row>`).
// Memakai `Partial<T>` di sini membuat TypeScript gagal meresolusi generic query builder
// Supabase (hasil query jadi `never`) karena mapped type generic tidak dievaluasi secara
// "eager" saat dipakai sebagai default parameter generic di dalam SupabaseClient.

export type UserRole = "siswa" | "pembimbing" | "admin";
export type AttendanceStatus = "hadir" | "telat";
export type LeaveType = "izin" | "sakit" | "cuti";
export type LeaveStatus = "pending" | "disetujui" | "ditolak";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  identity_number: string | null;
  instansi: string | null;
  kelas: string | null;
<<<<<<< HEAD
=======
  jurusan_id: string | null;
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceSession = {
  id: string;
  session_date: string;
  token: string;
  expires_at: string;
  created_by: string;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  scanned_at: string;
  device_info: string | null;
};

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

<<<<<<< HEAD
=======
export type StudyProgram = {
  id: string;
  nama: string;
  kode: string;
  created_at: string;
};

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

export type Announcement = {
  id: string;
  title: string;
  content: string;
  broadcast_to_all: boolean;
  created_by: string;
  created_at: string;
};

export type AnnouncementRecipient = {
  id: string;
  announcement_id: string;
  study_program_id: string;
};

>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
export type AllowedLocation = {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          identity_number?: string | null;
          instansi?: string | null;
          kelas?: string | null;
<<<<<<< HEAD
=======
          jurusan_id?: string | null;
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
          avatar_url?: string | null;
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
<<<<<<< HEAD
=======
          jurusan_id?: string | null;
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_mentors: {
        Row: { student_id: string; mentor_id: string; assigned_at: string };
        Insert: { student_id: string; mentor_id: string; assigned_at?: string };
        Update: { student_id?: string; mentor_id?: string; assigned_at?: string };
        Relationships: [];
      };
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
<<<<<<< HEAD
=======
      study_programs: {
        Row: StudyProgram;
        Insert: { id?: string; nama: string; kode: string; created_at?: string };
        Update: { id?: string; nama?: string; kode?: string; created_at?: string };
        Relationships: [];
      };
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
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
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
