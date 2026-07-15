// ============================================================
// AdminOverviewPage — Dashboard utama untuk role Admin
// ============================================================
// Layout:
// 1. Header sapaan
// 2. Stat ringkas — 6 metrik dalam 1 baris (responsive)
// 3. Breakdown kehadiran hari ini — horizontal bar + legenda
// 4. 2 kolom: Event mendatang + Chart tren 7 hari
// 5. Kalender bulanan
// ============================================================
// ============================================================

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
  AlertCircle,
  Clock,
  Heart,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import styles from "@/styles/pages/dashboard/admin/Overview.module.css";

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user!.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  // ─── Parallel Queries ──────────────────────────────────────────────
  const [
    { count: siswaCount },
    { count: pembimbingCount },
    { data: todayRecords },
    { count: izinPendingCount },
    { data: weekRecords },
    { data: upcomingEvents },
    { data: allEvents },
    { count: totalEvents },
    { data: weekLeaves },
    { data: todayLeaves },
    { data: allStudents },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "siswa"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "pembimbing"),
    supabase
      .from("attendance_records")
      .select("status, student_id")
      .gte("scanned_at", `${today}T00:00:00`),
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("attendance_records")
      .select("status, scanned_at, student_id")
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
      .select("id", { count: "exact", head: true }),
    supabase
      .from("leave_requests")
      .select("type, start_date, end_date, status, student_id")
      .gte("start_date", sevenDaysAgoStr)
      .lte("start_date", today),
    supabase
      .from("leave_requests")
      .select("student_id, type, status")
      .lte("start_date", today)
      .gte("end_date", today)
      .in("status", ["disetujui", "pending"]),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, kelas")
      .eq("role", "siswa")
      .order("full_name"),
  ]);

  // ─── Hitung Statistik Hari Ini ─────────────────────────────────────
  const hadirToday =
    todayRecords?.filter((r) => r.status === "hadir").length ?? 0;
  const telatToday =
    todayRecords?.filter((r) => r.status === "telat").length ?? 0;
  const izinToday =
    todayLeaves?.filter((l) => l.type === "izin" && l.status === "disetujui")
      .length ?? 0;
  const sakitToday =
    todayLeaves?.filter((l) => l.type === "sakit" && l.status === "disetujui")
      .length ?? 0;
  const cutiToday =
    todayLeaves?.filter((l) => l.type === "cuti" && l.status === "disetujui")
      .length ?? 0;
  const alfaToday = Math.max(
    0,
    (siswaCount ?? 0) -
      hadirToday -
      telatToday -
      izinToday -
      sakitToday -
      cutiToday,
  );
  const totalHariIni =
    hadirToday + telatToday + izinToday + sakitToday + cutiToday + alfaToday;

  // ─── Student Breakdown ─────────────────────────────────────────────
  const studentsWithAttendance = new Set(
    todayRecords?.map((r) => r.student_id) ?? [],
  );
  const studentsWithLeave = new Set(
    todayLeaves
      ?.filter((l) => l.status === "disetujui")
      .map((l) => l.student_id) ?? [],
  );

  const studentBreakdown = (allStudents ?? []).map((s: any) => {
    const hasAttendance = studentsWithAttendance.has(s.id);
    const hasLeave = studentsWithLeave.has(s.id);
    let status = "alfa";
    if (hasAttendance) {
      status =
        todayRecords?.find((r) => r.student_id === s.id)?.status === "hadir"
          ? "hadir"
          : "telat";
    } else if (hasLeave) {
      const leave = todayLeaves?.find(
        (l) => l.student_id === s.id && l.status === "disetujui",
      );
      status =
        leave?.type === "sakit"
          ? "sakit"
          : leave?.type === "cuti"
            ? "cuti"
            : "izin";
    }
    return {
      id: s.id,
      full_name: s.full_name,
      avatar_url: s.avatar_url,
      kelas: s.kelas,
      status,
    };
  });

  const breakdownGroups = {
    hadir: studentBreakdown.filter((s) => s.status === "hadir"),
    telat: studentBreakdown.filter((s) => s.status === "telat"),
    izin: studentBreakdown.filter((s) => s.status === "izin"),
    sakit: studentBreakdown.filter((s) => s.status === "sakit"),
    alfa: studentBreakdown.filter((s) => s.status === "alfa"),
  };

  // ─── Trend Map (7 hari) ────────────────────────────────────────────
  const trendMap = new Map<string, AttendanceTrendPoint>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(d);
    trendMap.set(dateKey, {
      date: label,
      hadir: 0,
      telat: 0,
      izin: 0,
      alfa: 0,
    });
  }

  weekRecords?.forEach((r) => {
    const key = r.scanned_at.slice(0, 10);
    const point = trendMap.get(key);
    if (point) {
      if (r.status === "hadir") point.hadir += 1;
      else if (r.status === "telat") point.telat += 1;
    }
  });

  weekLeaves?.forEach((leave) => {
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const point = trendMap.get(key);
      if (point) point.izin += 1;
    }
  });

  trendMap.forEach((point) => {
    const accounted = point.hadir + point.telat + point.izin;
    const raw = (siswaCount ?? 0) - accounted;
    point.alfa = raw > 0 ? raw : 0;
  });

  // ─── Preset Breakdown Colors ───────────────────────────────────────
  const breakdownMeta = [
    { key: "hadir", label: "Hadir", color: "#16A34A", bg: "#DCFCE7" },
    { key: "telat", label: "Telat", color: "#6B7280", bg: "#F3F4F6" },
    { key: "izin", label: "Izin", color: "#F59E0B", bg: "#FEF3C7" },
    { key: "sakit", label: "Sakit", color: "#EC4899", bg: "#FCE7F3" },
    { key: "alfa", label: "Alfa", color: "#EF4444", bg: "#FEE2E2" },
  ] as const;

  return (
    <div className={styles.pageContainer}>
      {/* ─── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className={styles.headerTitle}>
          Halo, {profile?.full_name || "Admin"}
        </h1>
        <p className={styles.headerSub}>
          Gambaran umum seluruh peserta PKL Politeknik SSR
        </p>
      </div>

      {/* ─── Stat Ringkas — 1 baris, responsive ──────────────── */}
      <div className={styles.statRow}>
        <StatCard
          label="Siswa"
          value={siswaCount ?? 0}
          icon={<GraduationCap className="h-5 w-5" />}
          accent="biru1"
        />
        <StatCard
          label="Pembimbing"
          value={pembimbingCount ?? 0}
          icon={<Users className="h-5 w-5" />}
          accent="teal"
        />
        <StatCard
          label="Hadir"
          value={hadirToday}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="hijau"
        />
        <StatCard
          label="Telat"
          value={telatToday}
          icon={<Clock className="h-5 w-5" />}
          accent="steel"
        />
        <StatCard
          label="Izin Pending"
          value={izinPendingCount ?? 0}
          icon={<FileClock className="h-5 w-5" />}
          accent="kuning"
        />
        <StatCard
          label="Alfa"
          value={alfaToday}
          icon={<AlertCircle className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      {/* ─── Breakdown Kehadiran — Horizontal Bar + Legenda ──── */}
      <Card className={styles.breakdownCard}>
        <CardHeader
          title="Rekap Kehadiran Hari Ini"
          subtitle={`${totalHariIni} dari ${siswaCount ?? 0} siswa tercatat`}
        />
        {/* Progress bar horizontal */}
        <div className={styles.progressBar}>
          {breakdownMeta.map(({ key, color }) => {
            const count = breakdownGroups[key].length;
            const pct = totalHariIni > 0 ? (count / totalHariIni) * 100 : 0;
            return pct > 0 ? (
              <div
                key={key}
                className={styles.progressSegment}
                style={{ width: `${pct}%`, backgroundColor: color }}
                title={`${key}: ${count}`}
              />
            ) : null;
          })}
        </div>
        {/* Legenda + daftar nama */}
        <div className={styles.breakdownGrid}>
          {breakdownMeta.map(({ key, label, color, bg }) => {
            const students = breakdownGroups[key];
            return (
              <div key={key} className={styles.breakdownItem}>
                <div className={styles.breakdownHeader}>
                  <span
                    className={styles.breakdownDot}
                    style={{ backgroundColor: color }}
                  />
                  <span className={styles.breakdownLabel}>{label}</span>
                  <span className={styles.breakdownCount} style={{ color }}>
                    {students.length}
                  </span>
                </div>
                <div className={styles.breakdownStudents}>
                  {students.length > 0 ? (
                    students.map((s) => (
                      <div key={s.id} className={styles.studentRow}>
                        <div
                          className={styles.studentAvatar}
                          style={{
                            background: s.avatar_url ? "transparent" : bg,
                            color,
                          }}
                        >
                          {s.avatar_url ? (
                            <img
                              src={s.avatar_url}
                              alt=""
                              className={styles.studentAvatarImg}
                            />
                          ) : (
                            s.full_name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className={styles.studentName}>
                          {s.full_name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noStudents}>—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── 2 Kolom: Event + Chart ──────────────────────────── */}
      <div className={styles.twoCol}>
        <Card className={styles.flipCard}>
          <CardHeader
            title="Event Mendatang"
            subtitle={`${totalEvents ?? 0} total`}
            action={
              <Link href="/dashboard/admin/kalender" className={styles.linkAll}>
                Lihat Semua
              </Link>
            }
          />
          <div className="divide-y divide-outline">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev: any) => (
                <div key={ev.id} className={styles.eventRow}>
                  <div
                    className={
                      ev.tipe === "libur" ? styles.dotLibur : styles.dotEvent
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {formatDate(ev.event_date)}
                    </p>
                  </div>
                  <Badge tone={ev.tipe === "libur" ? "coral" : "teal"}>
                    {ev.tipe === "libur" ? "Libur" : "Event"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-ink-subtle">
                Tidak ada event mendatang.
              </p>
            )}
          </div>
        </Card>

        <Card className={styles.flipCard}>
          <CardHeader
            title="Tren 7 Hari"
            subtitle="Hadir · Telat · Izin · Alfa"
          />
          <AttendanceChart data={Array.from(trendMap.values())} />
        </Card>
      </div>

      {/* ─── Kalender ────────────────────────────────────────── */}
      <Card className={styles.flipCard}>
        <Calendar events={allEvents || []} />
      </Card>
    </div>
  );
}
