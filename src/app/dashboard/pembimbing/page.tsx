import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { AttendanceChart, type AttendanceTrendPoint } from "@/components/charts/AttendanceChart";
import { Users, CalendarCheck, FileClock, AlertCircle } from "lucide-react";
import styles from "@/styles/pages/dashboard/pembimbing/Overview.module.css";

export default async function PembimbingOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [
    { count: studentCount },
    { data: todayRecords },
    { count: izinPendingCount },
    { data: weekRecords },
    { data: weekLeaves },
  ] = await Promise.all([
    supabase.from("student_mentors").select("*", { count: "exact", head: true }).eq("mentor_id", user!.id),
    supabase.from("attendance_records").select("status, scanned_at, student_id").gte("scanned_at", `${today}T00:00:00`),
    supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("attendance_records")
      .select("status, scanned_at, student_id")
      .gte("scanned_at", sevenDaysAgo.toISOString()),
    // Izin 7 hari terakhir
    supabase
      .from("leave_requests")
      .select("type, start_date, end_date, status")
      .gte("start_date", sevenDaysAgoStr)
      .lte("start_date", today),
  ]);

  // Ambil ID siswa bimbingan untuk filter presensi
  const { data: mentorStudents } = await supabase
    .from("student_mentors")
    .select("student_id")
    .eq("mentor_id", user!.id);
  const mentorStudentIds = new Set(mentorStudents?.map((s) => s.student_id) ?? []);

  // Filter records hanya untuk siswa bimbingan
  const myTodayRecords = todayRecords?.filter((r) => mentorStudentIds.has(r.student_id)) ?? [];
  const myWeekRecords = weekRecords?.filter((r) => mentorStudentIds.has(r.student_id)) ?? [];

  const hadirToday = myTodayRecords.filter((r) => r.status === "hadir").length;
  const telatToday = myTodayRecords.filter((r) => r.status === "telat").length;
  const alfaToday = Math.max(0, (studentCount ?? 0) - hadirToday - telatToday);

  // Agregasi 7 hari terakhir untuk chart tren kehadiran
  const trendMap = new Map<string, AttendanceTrendPoint>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(d);
    trendMap.set(d.toISOString().slice(0, 10), { date: label, hadir: 0, telat: 0, izin: 0, alfa: 0 });
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

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Ringkasan Bimbingan</h1>
        <p>Pantau kehadiran & progres siswa bimbinganmu.</p>
      </div>

      <div className={styles.statGrid}>
        <StatCard label="Siswa Bimbingan" value={studentCount ?? 0} icon={<Users className="h-5 w-5" />} accent="teal" />
        <StatCard label="Hadir Hari Ini" value={hadirToday} icon={<CalendarCheck className="h-5 w-5" />} accent="leaf" />
        <StatCard label="Izin Menunggu Review" value={izinPendingCount ?? 0} icon={<FileClock className="h-5 w-5" />} accent="sun" />
        <StatCard label="Alfa Hari Ini" value={alfaToday} icon={<AlertCircle className="h-5 w-5" />} accent="ungu" />
      </div>

      <Card className={styles.chartCard}>
        <CardHeader title="Tren Kehadiran 7 Hari Terakhir" subtitle="Hadir · Telat · Izin · Alfa" />
        <AttendanceChart data={Array.from(trendMap.values())} />
      </Card>
    </div>
  );
}
