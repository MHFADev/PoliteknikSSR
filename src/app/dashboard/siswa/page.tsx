// ============================================================
// SiswaOverviewPage — Dashboard utama untuk role Siswa
// ============================================================
// Layout:
// 1. Reminder banner (jika belum isi kegiatan hari ini)
// 2. Stat ringkas — 3 metrik dalam 1 baris
// 3. Pengumuman terbaru (jika ada)
// 4. Aktivitas — Event + Riwayat Kegiatan dalam 1 card
// 5. Kalender bulanan
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import StudentCalendar from "@/components/StudentCalendar";
import { MentorSelector } from "@/components/siswa/MentorSelector";
import { formatDate, todayISODate } from "@/lib/utils";
import {
  CalendarCheck,
  FileClock,
  NotebookPen,
  Megaphone,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { getAnnouncementsForStudent } from "@/actions/broadcast";
import styles from "@/styles/pages/dashboard/siswa/Overview.module.css";

export default async function SiswaOverviewPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, jurusan_id")
    .eq("id", user!.id)
    .single();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const today = new Date().toISOString().slice(0, 10);

  // ─── Parallel Queries ──────────────────────────────────────────────
  const [
    { count: hadirCount },
    { count: izinPendingCount },
    { data: recentLogbook },
    { data: upcomingEvents },
    { data: allEvents },
    { data: attendanceRecords },
    { data: leaves },
    announcements,
    { data: todayRecord },
  ] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user!.id)
      .eq("status", "hadir")
      .gte("scanned_at", startOfMonth.toISOString()),
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user!.id)
      .eq("status", "pending"),
    supabase
      .from("logbook_entries")
      .select("entry_date, content, grade")
      .eq("student_id", user!.id)
      .order("entry_date", { ascending: false })
      .limit(5),
    supabase
      .from("calendar_events")
      .select("id, title, event_date, tipe")
      .or(`student_id.eq.${user!.id},student_id.is.null`)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(4),
    supabase
      .from("calendar_events")
      .select("id, title, event_date, tipe")
      .or(`student_id.eq.${user!.id},student_id.is.null`)
      .order("event_date", { ascending: true }),
    supabase
      .from("attendance_records")
      .select("status, scanned_at")
      .eq("student_id", user!.id),
    supabase
      .from("leave_requests")
      .select("type, start_date, end_date")
      .eq("student_id", user!.id),
    getAnnouncementsForStudent(user!.id, profile?.jurusan_id ?? null),
    supabase
      .from("attendance_records")
      .select("status, scanned_at")
      .eq("student_id", user!.id)
      .gte("scanned_at", `${today}T00:00:00`)
      .lte("scanned_at", `${today}T23:59:59`)
      .maybeSingle(),
  ]);

  const todayEntry = recentLogbook?.find(
    (e) => e.entry_date === todayISODate(),
  );

  // Gabungkan event + logbook jadi satu list chronologis
  const activityItems = [
    ...(upcomingEvents ?? []).map((ev: any) => ({
      type: "event" as const,
      date: ev.event_date,
      title: ev.title,
      tipe: ev.tipe,
    })),
    ...(recentLogbook ?? []).map((e) => ({
      type: "logbook" as const,
      date: e.entry_date,
      title: e.content,
      grade: e.grade,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className={styles.pageContainer}>
      {/* ─── Reminder Banner ─────────────────────────────────── */}
      {!todayEntry && (
        <div className={styles.reminderBanner}>
          <NotebookPen className="h-5 w-5 text-sky shrink-0" />
          <div className="min-w-0 flex-1">
            <h3>Jangan Lupa Isi Kegiatan Hari Ini!</h3>
            <p>Catat kegiatan PKL kamu sebelum batas waktu.</p>
          </div>
          <Link
            href="/dashboard/siswa/kegiatan-harian"
            className={styles.reminderCta}
          >
            Isi Sekarang
          </Link>
        </div>
      )}

      {/* ─── Stat Ringkas — 3 kartu compact ──────────────────── */}
      <div className={styles.statRow}>
        <StatCard
          label="Hadir Bulan Ini"
          value={hadirCount ?? 0}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="ocean"
        />
        <StatCard
          label="Izin Pending"
          value={izinPendingCount ?? 0}
          icon={<FileClock className="h-5 w-5" />}
          accent="gold"
        />
        <StatCard
          label="Kegiatan Hari Ini"
          value={todayEntry ? "Sudah" : "Belum"}
          icon={<NotebookPen className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      {/* ─── Status Presensi Hari Ini ─────────────────────────── */}
      {todayRecord && (
        <div className={styles.reminderBanner} style={{
          background: todayRecord.status === "hadir"
            ? "linear-gradient(135deg, #DCFCE7, #F0FDF4)"
            : "linear-gradient(135deg, #FEF3C7, #FFFBEB)",
          border: todayRecord.status === "hadir"
            ? "1px solid #86EFAC"
            : "1px solid #FCD34D",
        }}>
          <CalendarCheck className="h-5 w-5 shrink-0" style={{
            color: todayRecord.status === "hadir" ? "#16A34A" : "#D97706",
          }} />
          <div className="min-w-0 flex-1">
            <h3 style={{
              color: todayRecord.status === "hadir" ? "#16A34A" : "#D97706",
            }}>
              {todayRecord.status === "hadir" ? "Hadir Hari Ini" : "Telat Hari Ini"}
            </h3>
            <p style={{ color: "#475569" }}>
              Scan pukul{" "}
              {new Date(todayRecord.scanned_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
              })}
            </p>
          </div>
        </div>
      )}

      {/* ─── Pilih Pembimbing ─────────────────────────────── */}
      <MentorSelector studentJurusanId={profile?.jurusan_id} />

      {/* ─── Pengumuman ──────────────────────────────────────── */}
      {announcements && announcements.length > 0 && (
        <Card className={styles.announcementCard}>
          <CardHeader
            title="Pengumuman"
            icon={<Megaphone className="h-4 w-4" />}
            action={
              <Link
                href="/dashboard/siswa/pengumuman"
                className={styles.linkAll}
              >
                Lihat Semua
              </Link>
            }
          />
          <div className={styles.announcementList}>
            {announcements.map((a: any) => (
              <div key={a.id} className={styles.announcementItem}>
                <div>
                  <h3>{a.title}</h3>
                  <p>{a.content}</p>
                </div>
                <span className={styles.announcementDate}>
                  {formatDate(a.created_at)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Aktivitas — Event + Logbook dalam 1 card ────────── */}
      <Card className={styles.flipCard}>
        <CardHeader
          title="Aktivitas Terbaru"
          subtitle="Event mendatang & riwayat kegiatan"
          action={
            <Link href="/dashboard/siswa/kalender" className={styles.linkAll}>
              Kalender
            </Link>
          }
        />
        <div className="divide-y divide-outline">
          {activityItems.length > 0 ? (
            activityItems.map((item, idx) => (
              <div
                key={`${item.type}-${item.date}-${idx}`}
                className={styles.activityRow}
              >
                <div className={styles.activityIcon}>
                  {item.type === "event" ? (
                    <CalendarDays className="h-4 w-4" />
                  ) : (
                    <NotebookPen className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={styles.activityTitle}>{item.title}</p>
                  <p className={styles.activityDate}>{formatDate(item.date)}</p>
                </div>
                {item.type === "event" ? (
                  <Badge
                    tone={item.tipe === "libur" ? "coral" : "teal"}
                    size="sm"
                  >
                    {item.tipe === "libur" ? "Libur" : "Event"}
                  </Badge>
                ) : item.grade !== null ? (
                  <Badge tone="leaf" size="sm">
                    Nilai {item.grade}
                  </Badge>
                ) : (
                  <Badge tone="neutral" size="sm">
                    Draft
                  </Badge>
                )}
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-ink-subtle">
              Belum ada aktivitas.
            </p>
          )}
        </div>
      </Card>

      {/* ─── Kalender ────────────────────────────────────────── */}
      <Card className={styles.flipCard}>
        <StudentCalendar
          events={allEvents || []}
          records={attendanceRecords || []}
          leaves={leaves || []}
        />
      </Card>
    </div>
  );
}
