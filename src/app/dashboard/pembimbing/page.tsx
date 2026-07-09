import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { AttendanceChart, type AttendanceTrendPoint } from "@/components/charts/AttendanceChart";
import { Users, CalendarCheck, FileClock } from "lucide-react";

export default async function PembimbingOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [{ count: studentCount }, { data: todayRecords }, { count: izinPendingCount }, { data: weekRecords }] =
    await Promise.all([
      supabase.from("student_mentors").select("*", { count: "exact", head: true }).eq("mentor_id", user!.id),
      supabase.from("attendance_records").select("status, scanned_at").gte("scanned_at", `${today}T00:00:00`),
      supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("attendance_records")
        .select("status, scanned_at")
        .gte("scanned_at", sevenDaysAgo.toISOString()),
    ]);

  const hadirToday = todayRecords?.filter((r) => r.status === "hadir").length ?? 0;

  // Agregasi 7 hari terakhir untuk chart tren kehadiran
  const trendMap = new Map<string, AttendanceTrendPoint>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(d);
    trendMap.set(d.toISOString().slice(0, 10), { date: label, hadir: 0, telat: 0 });
  }
  weekRecords?.forEach((r) => {
    const key = r.scanned_at.slice(0, 10);
    const point = trendMap.get(key);
    if (point) point[r.status as "hadir" | "telat"] += 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Ringkasan Bimbingan</h1>
        <p className="text-sm text-mist-dim">Pantau kehadiran & progres siswa bimbinganmu.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Siswa Bimbingan" value={studentCount ?? 0} icon={<Users className="h-5 w-5" />} accent="blue" />
        <StatCard label="Hadir Hari Ini" value={hadirToday} icon={<CalendarCheck className="h-5 w-5" />} accent="ocean" />
        <StatCard label="Izin Menunggu Review" value={izinPendingCount ?? 0} icon={<FileClock className="h-5 w-5" />} accent="steel" />
      </div>

      <Card>
        <CardHeader title="Tren Kehadiran 7 Hari Terakhir" />
        <AttendanceChart data={Array.from(trendMap.values())} />
      </Card>
    </div>
  );
}
