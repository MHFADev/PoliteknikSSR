// ============================================================
// Repository Layer — Barrel & Registry
// ============================================================
// Database Abstraction Layer untuk Politeknik SSR.
//
// Filosofi:
// - Semua akses database HARUS melalui repository layer ini
// - Components tidak pernah mengimpor Supabase langsung
// - Switching database cukup dengan mengganti implementasi
//   di RepositoryRegistry (misal: dari Supabase ke Prisma)
//
// Cara pakai:
//   import { Repositories } from "@/lib/repositories";
//   const users = await Repositories.users().getAllStudents();
// ============================================================

// Re-export semua tipe domain
export type {
  User,
  UserRole,
  StudyProgram,
  StudentMentor,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  LogbookEntry,
  CalendarEvent,
  EventType,
  AllowedLocation,
  Announcement,
  AttendanceStatsQuery,
  AttendanceStats,
  MonthlyAttendance,
  CreateUserInput,
  CreateEventInput,
  CreateLeaveInput,
  CreateAnnouncementInput,
  CreateLocationInput,
  PendingUser,
} from "./types";

// Re-export semua interface repository
export type { IUserRepository } from "./interfaces/IUserRepository";
export type { IAttendanceRepository } from "./interfaces/IAttendanceRepository";
export type { ICalendarRepository } from "./interfaces/ICalendarRepository";
export type { ILeaveRepository } from "./interfaces/ILeaveRepository";
export type { ILogbookRepository } from "./interfaces/ILogbookRepository";
export type { IAnnouncementRepository } from "./interfaces/IAnnouncementRepository";
export type { ILocationRepository } from "./interfaces/ILocationRepository";
export type { IStudyProgramRepository } from "./interfaces/IStudyProgramRepository";

// -----------------------------------------------------------
// RepositoryRegistry — Factory pattern
// -----------------------------------------------------------
// Registry ini memungkinkan kita mengganti implementasi database
// kapan saja tanpa mengubah kode yang memanggil.
//
// Contoh jika ingin ganti ke Prisma:
//   - Buat PrismaUserRepository implements IUserRepository
//   - Ubah baris di bawah: new PrismaUserRepository()
//
// Untuk testing, bisa inject mock:
//   RepositoryRegistry.setUserRepository(mockRepo)
// -----------------------------------------------------------

import type { IUserRepository } from "./interfaces/IUserRepository";
import type { IAttendanceRepository } from "./interfaces/IAttendanceRepository";
import type { ICalendarRepository } from "./interfaces/ICalendarRepository";
import type { ILeaveRepository } from "./interfaces/ILeaveRepository";
import type { ILogbookRepository } from "./interfaces/ILogbookRepository";
import type { IAnnouncementRepository } from "./interfaces/IAnnouncementRepository";
import type { ILocationRepository } from "./interfaces/ILocationRepository";
import type { IStudyProgramRepository } from "./interfaces/IStudyProgramRepository";

import {
  SupabaseUserRepository,
  SupabaseAttendanceRepository,
  SupabaseCalendarRepository,
  SupabaseLeaveRepository,
  SupabaseLogbookRepository,
  SupabaseAnnouncementRepository,
  SupabaseLocationRepository,
  SupabaseStudyProgramRepository,
} from "./supabase";

/**
 * RepositoryRegistry — Menyimpan instance repository secara global (singleton).
 * Bisa di-set dari luar untuk keperluan testing (dependency injection).
 */
class RepositoryRegistry {
  private static _user: IUserRepository | null = null;
  private static _attendance: IAttendanceRepository | null = null;
  private static _calendar: ICalendarRepository | null = null;
  private static _leave: ILeaveRepository | null = null;
  private static _logbook: ILogbookRepository | null = null;
  private static _announcement: IAnnouncementRepository | null = null;
  private static _location: ILocationRepository | null = null;
  private static _studyProgram: IStudyProgramRepository | null = null;

  /** Daftarkan implementasi repository khusus (untuk testing / mocking) */
  static setUserRepository(repo: IUserRepository): void {
    this._user = repo;
  }
  static setAttendanceRepository(repo: IAttendanceRepository): void {
    this._attendance = repo;
  }
  static setCalendarRepository(repo: ICalendarRepository): void {
    this._calendar = repo;
  }
  static setLeaveRepository(repo: ILeaveRepository): void {
    this._leave = repo;
  }
  static setLogbookRepository(repo: ILogbookRepository): void {
    this._logbook = repo;
  }
  static setAnnouncementRepository(repo: IAnnouncementRepository): void {
    this._announcement = repo;
  }
  static setLocationRepository(repo: ILocationRepository): void {
    this._location = repo;
  }
  static setStudyProgramRepository(repo: IStudyProgramRepository): void {
    this._studyProgram = repo;
  }

  static getUserRepository(): IUserRepository {
    if (!this._user) this._user = new SupabaseUserRepository();
    return this._user;
  }
  static getAttendanceRepository(): IAttendanceRepository {
    if (!this._attendance) this._attendance = new SupabaseAttendanceRepository();
    return this._attendance;
  }
  static getCalendarRepository(): ICalendarRepository {
    if (!this._calendar) this._calendar = new SupabaseCalendarRepository();
    return this._calendar;
  }
  static getLeaveRepository(): ILeaveRepository {
    if (!this._leave) this._leave = new SupabaseLeaveRepository();
    return this._leave;
  }
  static getLogbookRepository(): ILogbookRepository {
    if (!this._logbook) this._logbook = new SupabaseLogbookRepository();
    return this._logbook;
  }
  static getAnnouncementRepository(): IAnnouncementRepository {
    if (!this._announcement) this._announcement = new SupabaseAnnouncementRepository();
    return this._announcement;
  }
  static getLocationRepository(): ILocationRepository {
    if (!this._location) this._location = new SupabaseLocationRepository();
    return this._location;
  }
  static getStudyProgramRepository(): IStudyProgramRepository {
    if (!this._studyProgram) this._studyProgram = new SupabaseStudyProgramRepository();
    return this._studyProgram;
  }
}

/**
 * Repositories — API publik untuk mengakses semua repository.
 * Contoh: Repositories.users().getAllStudents()
 */
export const Repositories = {
  users: () => RepositoryRegistry.getUserRepository(),
  attendance: () => RepositoryRegistry.getAttendanceRepository(),
  calendar: () => RepositoryRegistry.getCalendarRepository(),
  leave: () => RepositoryRegistry.getLeaveRepository(),
  logbook: () => RepositoryRegistry.getLogbookRepository(),
  announcement: () => RepositoryRegistry.getAnnouncementRepository(),
  location: () => RepositoryRegistry.getLocationRepository(),
  studyProgram: () => RepositoryRegistry.getStudyProgramRepository(),
};
