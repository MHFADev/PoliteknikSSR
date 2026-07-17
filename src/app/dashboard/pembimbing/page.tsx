// ============================================================
// PembimbingOverviewPage — Dashboard utama untuk role Pembimbing
// ============================================================
// Layout:
// 1. Header sapaan
// 2. Stat ringkas — 4 metrik dalam 1 baris
// 3. 2 kolom: Chart tren 7 hari + Daftar siswa bimbingan
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  AttendanceChart,
  type AttendanceTrendPoint,
} from "@/components/charts/AttendanceChart";
import { Users, CalendarCheck, FileClock, AlertCircle } from "lucide-react";
import styles from "@/styles/pages/dashboard/pembimbing/Overview.module.css";

export default async function PembimbingOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  // ─── Parallel Queries ──────────────────────────────────────────────
  const [
    { count: studentCount },
    { data: todayRecords },
    { count: izinPendingCount },
    { data: weekRecords },
    { data: weekLeaves },
    { data: mentorStudents },
    { data: studentProfiles },
  ] = await Promise.all([
    supabase
      .from("student_mentors")
      .select("*", { count: "exact", head: true })
      .eq("mentor_id", user!.id),
    supabase
      .from("attendance_records")
      .select("status, scanned_at, student_id")
      .gte("scanned_at", `${today}T00:00:00`),
    supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("attendance_records")
      .select("status, scanned_at, student_id")
      .gte("scanned_at", sevenDaysAgo.toISOString()),
    supabase
      .from("leave_requests")
      .select("type, start_date, end_date, status")
      .gte("start_date", sevenDaysAgoStr)
      .lte("start_date", today),
    supabase
      .from("student_mentors")
      .select("student_id")
      .eq("mentor_id", user!.id),
    supabase
      .from("student_mentors")
      .select(
        "student:profiles!student_mentors_student_id_fkey(id, full_name, avatar_url, kelas)",
      )
      .eq("mentor_id", user!.id),
  ]);

  const mentorStudentIds = new Set(
    mentorStudents?.map((s) => s.student_id) ?? [],
  );
  const myTodayRecords =
    todayRecords?.filter((r) => mentorStudentIds.has(r.student_id)) ?? [];
  const myWeekRecords =
    weekRecords?.filter((r) => mentorStudentIds.has(r.student_id)) ?? [];

  const hadirToday = myTodayRecords.filter((r) => r.status === "hadir").length;
  const telatToday = myTodayRecords.filter((r) => r.status === "telat").length;
  const alfaToday = Math.max(0, (studentCount ?? 0) - hadirToday - telatToday);

  // ─── Trend Map (7 hari) ────────────────────────────────────────────
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
      izin: 0,
      alfa: 0,
    });
  }

  myWeekRecords?.forEach((r) => {
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
    const raw = (studentCount ?? 0) - point.hadir - point.telat - point.izin;
    point.alfa = raw > 0 ? raw : 0;
  });

  // ─── Daftar Siswa + Status ─────────────────────────────────────────
  const studentsWithStatus = (studentProfiles ?? []).map((s: any) => {
    const studentData = s.student;
    const record = todayRecords?.find((r) => r.student_id === studentData?.id);
    let status = "alfa";
    if (record) {
      status = record.status === "hadir" ? "hadir" : "telat";
    }
    return {
      id: studentData?.id,
      name: studentData?.full_name || "—",
      avatar_url: studentData?.avatar_url,
      kelas: studentData?.kelas,
      status,
    };
  });

  const hadirCount = studentsWithStatus.filter(
    (s) => s.status === "hadir",
  ).length;
  const telatCount = studentsWithStatus.filter(
    (s) => s.status === "telat",
  ).length;
  const alfaCount = studentsWithStatus.filter(
    (s) => s.status === "alfa",
  ).length;

  return (
    <div className={styles.pageContainer}>
      {/* ─── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className={styles.headerTitle}>Ringkasan Bimbingan</h1>
        <p className={styles.headerSub}>
          Pantau kehadiran & progres siswa bimbinganmu.
        </p>
      </div>

      {/* ─── Stat Ringkas — 4 kartu compact ──────────────────── */}
      <div className={styles.statRow}>
        <StatCard
          label="Siswa Bimbingan"
          value={studentCount ?? 0}
          icon={<Users className="h-5 w-5" />}
          accent="ocean"
        />
        <StatCard
          label="Hadir Hari Ini"
          value={hadirToday}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="leaf"
        />
        <StatCard
          label="Izin Pending"
          value={izinPendingCount ?? 0}
          icon={<FileClock className="h-5 w-5" />}
          accent="sun"
        />
        <StatCard
          label="Alfa Hari Ini"
          value={alfaToday}
          icon={<AlertCircle className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      {/* ─── 2 Kolom: Chart + Daftar Siswa ───────────────────── */}
      <div className={styles.twoCol}>
        {/* Chart tren kehadiran */}
        <Card className={styles.flipCard}>
          <CardHeader
            title="Tren 7 Hari"
            subtitle="Hadir · Telat · Izin · Alfa"
          />
          <AttendanceChart data={Array.from(trendMap.values())} />
        </Card>

        {/* Daftar siswa bimbingan */}
        <Card className={styles.flipCard}>
          <CardHeader
            title="Siswa Bimbingan"
            subtitle={`${studentsWithStatus.length} siswa — hari ini`}
          />
          {/* Ringkasan singkat */}
          <div className={styles.summaryBar}>
            <span className={styles.summaryItem}>
              <span
                className={styles.summaryDot}
                style={{ background: "#16A34A" }}
              />
              Hadir {hadirCount}
            </span>
            <span className={styles.summaryItem}>
              <span
                className={styles.summaryDot}
                style={{ background: "#6B7280" }}
              />
              Telat {telatCount}
            </span>
            <span className={styles.summaryItem}>
              <span
                className={styles.summaryDot}
                style={{ background: "#EF4444" }}
              />
              Alfa {alfaCount}
            </span>
          </div>
          <div className={styles.studentList}>
            {studentsWithStatus.length > 0 ? (
              studentsWithStatus.map((s) => (
                <div key={s.id} className={styles.studentRow}>
                  <div
                    className={styles.studentAvatar}
                    style={{
                      background: s.avatar_url ? "transparent" : "#DBEAFE",
                      color: "#1D4ED8",
                    }}
                  >
                    {s.avatar_url ? (
                      <img
                        src={s.avatar_url}
                        alt=""
                        className={styles.studentAvatarImg}
                      />
                    ) : (
                      s.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={styles.studentName}>{s.name}</p>
                    <p className={styles.studentKelas}>{s.kelas || "—"}</p>
                  </div>
                  <Badge
                    tone={
                      s.status === "hadir"
                        ? "success"
                        : s.status === "telat"
                          ? "warning"
                          : "danger"
                    }
                    size="sm"
                  >
                    {s.status === "hadir"
                      ? "Hadir"
                      : s.status === "telat"
                        ? "Telat"
                        : "Alfa"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-ink-subtle">
                Belum ada siswa bimbingan.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
