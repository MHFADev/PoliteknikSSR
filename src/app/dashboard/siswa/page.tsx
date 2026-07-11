import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import StudentCalendar from "@/components/StudentCalendar";
import { formatDate, todayISODate } from "@/lib/utils";
import { CalendarCheck, FileClock, NotebookPen, CalendarDays, Megaphone } from "lucide-react";
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

  const [
    { count: hadirCount },
    { count: izinPendingCount },
    { data: recentLogbook },
    { data: upcomingEvents },
    { data: allEvents },
    { data: attendanceRecords },
    { data: leaves },
    announcements,
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
      .limit(3),
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
  ]);

  const todayEntry = recentLogbook?.find((e) => e.entry_date === todayISODate());

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>HI, {profile?.full_name || "Pengguna"} 👋👋</h1>
        <p>Pantau progres PKL kamu bulan ini.</p>
      </div>

      {!todayEntry && (
        <div className={styles.reminderBanner}>
          <NotebookPen className="h-6 w-6 text-gold-dark" />
          <div>
            <h3>Jangan Lupa Isi Kegiatan Harini!</h3>
            <p>Catat kegiatan PKL kamu hari ini sebelum batas waktu.</p>
          </div>
          <Link href="/dashboard/siswa/kegiatan-harian" className="ml-auto">
            <span className={styles.reminderCta}>Isi Sekarang</span>
          </Link>
        </div>
      )}

      <div className={styles.statGrid}>
        <StatCard label="Hadir Bulan Ini" value={hadirCount ?? 0} icon={<CalendarCheck className="h-5 w-5" />} accent="teal" />
        <StatCard label="Izin Menunggu Review" value={izinPendingCount ?? 0} icon={<FileClock className="h-5 w-5" />} accent="gold" />
        <StatCard
          label="Kegiatan Hari Ini"
          value={todayEntry ? "Sudah diisi" : "Belum diisi"}
          icon={<NotebookPen className="h-5 w-5" />}
          accent={todayEntry ? "leaf" : "sun"}
        />
      </div>

      {announcements && announcements.length > 0 && (
        <Card>
          <CardHeader 
            title="Pengumuman Terbaru" 
            icon={<Megaphone className="h-5 w-5" />} 
            action={
              <Link href="/dashboard/siswa/pengumuman" className="text-sm text-teal hover:underline">Lihat Semua</Link>
            }
          />
          <div className={styles.announcementList}>
            {announcements.map((a: any) => (
              <div key={a.id} className={styles.announcementItem}>
                <h3>{a.title}</h3>
                <p>{a.content}</p>
                <p className={styles.announcementDate}>{formatDate(a.created_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className={styles.twoColumnGrid}>
        <Card>
          <CardHeader title="Event Mendatang" action={
            <Link href="/dashboard/siswa/kalender" className="text-sm text-teal hover:underline">Lihat Kalender</Link>
          } />
          <div className="divide-y divide-outline">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={ev.tipe === "libur" ? styles.eventDotLibur : styles.eventDotEvent} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{ev.title}</p>
                    <p className="text-xs text-ink-subtle">{formatDate(ev.event_date)}</p>
                  </div>
                  <Badge tone={ev.tipe === "libur" ? "coral" : "teal"}>{ev.tipe === "libur" ? "Libur" : "Event"}</Badge>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-ink-subtle">Tidak ada event mendatang.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Riwayat Kegiatan Terbaru" />
          <div className="divide-y divide-outline">
            {recentLogbook && recentLogbook.length > 0 ? (
              recentLogbook.map((entry) => (
                <div key={entry.entry_date} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-subtle">{formatDate(entry.entry_date)}</p>
                    <p className="text-sm text-ink truncate max-w-md">{entry.content}</p>
                  </div>
                  {entry.grade !== null ? (
                    <Badge tone="leaf">Nilai {entry.grade}</Badge>
                  ) : (
                    <Badge tone="neutral">Belum dinilai</Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-ink-subtle">Belum ada entri kegiatan.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <StudentCalendar 
          events={allEvents || []} 
          records={attendanceRecords || []} 
          leaves={leaves || []}
        />
      </div>
    </div>
  );
}
