import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  AttendanceChart,
  type AttendanceTrendPoint,
} from "@/components/charts/AttendanceChart";
import { Calendar } from "@/components/Calendar";
import {
  Users,
  CalendarCheck,
  FileClock,
  GraduationCap,
  CalendarDays,
  Megaphone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import styles from "@/styles/pages/dashboard/admin/Overview.module.css";

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    { count: siswaCount },
    { count: pembimbingCount },
    { data: todayRecords },
    { count: izinPendingCount },
    { data: weekRecords },
    { data: upcomingEvents },
    { data: allEvents },
    { count: totalEvents },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }) // Hanya id untuk count
      .eq("role", "siswa"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }) // Hanya id untuk count
      .eq("role", "pembimbing"),
    supabase
      .from("attendance_records")
      .select("status")
      .gte("scanned_at", `${today}T00:00:00`),
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true }) // Hanya id untuk count
      .eq("status", "pending"),
    supabase
      .from("attendance_records")
      .select("status, scanned_at")
      .gte("scanned_at", sevenDaysAgo.toISOString()),
    supabase
      .from("calendar_events")
      .select("id, title, event_date, tipe")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(5),
    supabase
      .from("calendar_events")
      .select("id, title, event_date, tipe")
      .order("event_date", { ascending: true }),
    supabase
      .from("calendar_events")
      .select("id", { count: "exact", head: true }), // Hanya id untuk count
  ]);

  const hadirToday =
    todayRecords?.filter((r) => r.status === "hadir").length ?? 0;

  const trendMap = new Map<string, AttendanceTrendPoint>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(d);
    trendMap.set(d.toISOString().slice(0, 10), {
      date: label,
      hadir: 0,
      telat: 0,
    });
  }
  weekRecords?.forEach((r) => {
    const key = r.scanned_at.slice(0, 10);
    const point = trendMap.get(key);
    if (point) point[r.status as "hadir" | "telat"] += 1;
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>HI, {profile?.full_name || "Admin"} 👋👋</h1>
        <p>Gambaran umum seluruh peserta PKL Politeknik SSR.</p>
      </div>

      <div className={styles.statGrid}>
        <StatCard label="Total Siswa" value={siswaCount ?? 0} icon={<GraduationCap className="h-5 w-5" />} accent="teal" />
        <StatCard label="Total Pembimbing" value={pembimbingCount ?? 0} icon={<Users className="h-5 w-5" />} accent="gold" />
        <StatCard label="Hadir Hari Ini" value={hadirToday} icon={<CalendarCheck className="h-5 w-5" />} accent="leaf" />
        <StatCard label="Izin Menunggu" value={izinPendingCount ?? 0} icon={<FileClock className="h-5 w-5" />} accent="sun" />
      </div>

      <div className={styles.twoColumnGrid}>
        <Card>
          <CardHeader
            title="Event Mendatang"
            subtitle={`${totalEvents ?? 0} total event`}
            action={
              <Link href="/dashboard/admin/kalender" className="text-sm text-teal hover:underline">Lihat Semua</Link>
            }
          />
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
          <CardHeader title="Tren Kehadiran 7 Hari Terakhir" subtitle="Seluruh siswa" />
          <AttendanceChart data={Array.from(trendMap.values())} />
        </Card>
      </div>

      <div className={styles.calendarSection}>
        <Calendar events={allEvents || []} />
      </div>
    </div>
  );
}
