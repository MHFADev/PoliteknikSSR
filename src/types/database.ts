export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      allowed_locations: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          nama: string
          radius_meters: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          nama: string
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          nama?: string
          radius_meters?: number
          updated_at?: string
        }
        Relationships: []
      }
      announcement_recipients: {
        Row: {
          announcement_id: string
          id: string
          study_program_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          study_program_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          study_program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_recipients_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_recipients_study_program_id_fkey"
            columns: ["study_program_id"]
            isOneToOne: false
            referencedRelation: "study_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          broadcast_to_all: boolean
          content: string
          created_at: string
          created_by: string
          id: string
          title: string
        }
        Insert: {
          broadcast_to_all?: boolean
          content: string
          created_at?: string
          created_by: string
          id?: string
          title: string
        }
        Update: {
          broadcast_to_all?: boolean
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          entry_time: string
          id: number
          late_time: string
          qr_expiry_hours: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          entry_time?: string
          id?: number
          late_time?: string
          qr_expiry_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          entry_time?: string
          id?: number
          late_time?: string
          qr_expiry_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          device_info: string | null
          id: string
          scanned_at: string
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          device_info?: string | null
          id?: string
          scanned_at?: string
          session_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          device_info?: string | null
          id?: string
          scanned_at?: string
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          session_date: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          session_date?: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          session_date?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          student_id: string | null
          tipe: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          student_id?: string | null
          tipe?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          student_id?: string | null
          tipe?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          nama: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          proof_path: string | null
          proof_url: string | null
          reason: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          student_id: string
          type: Database["public"]["Enums"]["leave_type"]
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          proof_path?: string | null
          proof_url?: string | null
          reason: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          student_id: string
          type: Database["public"]["Enums"]["leave_type"]
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          proof_path?: string | null
          proof_url?: string | null
          reason?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          student_id?: string
          type?: Database["public"]["Enums"]["leave_type"]
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      logbook_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          feedback: string | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          photo_url: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          photo_url?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          photo_url?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logbook_entries_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_settings: {
        Row: {
          entry_time: string
          late_time: string
          mentor_id: string
          updated_at: string
        }
        Insert: {
          entry_time?: string
          late_time?: string
          mentor_id: string
          updated_at?: string
        }
        Update: {
          entry_time?: string
          late_time?: string
          mentor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_settings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          identity_number: string | null
          instansi: string | null
          jurusan_id: string | null
          kelas: string | null
          periode: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          identity_number?: string | null
          instansi?: string | null
          jurusan_id?: string | null
          kelas?: string | null
          periode?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          identity_number?: string | null
          instansi?: string | null
          jurusan_id?: string | null
          kelas?: string | null
          periode?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_jurusan_id_fkey"
            columns: ["jurusan_id"]
            isOneToOne: false
            referencedRelation: "study_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          file_name: string | null
          file_url: string | null
          grade_data: Json | null
          id: string
          is_kept: boolean
          is_read: boolean
          student_id: string
          type: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string
          file_name?: string | null
          file_url?: string | null
          grade_data?: Json | null
          id?: string
          is_kept?: boolean
          is_read?: boolean
          student_id: string
          type: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          file_name?: string | null
          file_url?: string | null
          grade_data?: Json | null
          id?: string
          is_kept?: boolean
          is_read?: boolean
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_mentors: {
        Row: {
          assigned_at: string
          mentor_id: string
          student_id: string
        }
        Insert: {
          assigned_at?: string
          mentor_id: string
          student_id: string
        }
        Update: {
          assigned_at?: string
          mentor_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_mentors_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_mentors_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_programs: {
        Row: {
          created_at: string
          id: string
          kode: string
          nama: string
        }
        Insert: {
          created_at?: string
          id?: string
          kode: string
          nama: string
        }
        Update: {
          created_at?: string
          id?: string
          kode?: string
          nama?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      delete_user_sessions: { Args: { p_user_id: string }; Returns: undefined }
      is_mentor_of: { Args: { target_student_id: string }; Returns: boolean }
      redeem_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      roll_multi_with_cooldown: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      roll_with_cooldown: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      attendance_status: "hadir" | "telat"
      leave_status: "pending" | "disetujui" | "ditolak"
      leave_type: "izin" | "sakit" | "cuti"
      user_role: "siswa" | "pembimbing" | "admin" | "owner" | "root"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["hadir", "telat"],
      leave_status: ["pending", "disetujui", "ditolak"],
      leave_type: ["izin", "sakit", "cuti"],
      user_role: ["siswa", "pembimbing", "admin", "owner", "root"],
    },
  },
} as const