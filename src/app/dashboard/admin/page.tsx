import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  AttendanceChart,
  type AttendanceTrendPoint,
} from "@/components/charts/AttendanceChart";
import { Users, CalendarCheck, FileClock, GraduationCap } from "lucide-react";

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    { count: siswaCount },
    { count: pembimbingCount },
    { data: todayRecords },
    { count: izinPendingCount },
    { data: weekRecords },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "siswa"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "pembimbing"),
    supabase
      .from("attendance_records")
      .select("status")
      .gte("scanned_at", `${today}T00:00:00`),
    supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("attendance_records")
      .select("status, scanned_at")
      .gte("scanned_at", sevenDaysAgo.toISOString()),
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">
          Ringkasan Data
        </h1>
        <p className="text-sm text-mist-dim">
          Gambaran umum peserta PKL Politeknik SSR.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Siswa"
          value={siswaCount ?? 0}
          icon={<GraduationCap className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Total Pembimbing"
          value={pembimbingCount ?? 0}
          icon={<Users className="h-5 w-5" />}
          accent="ocean"
        />
        <StatCard
          label="Hadir Hari Ini"
          value={hadirToday}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Izin Menunggu"
          value={izinPendingCount ?? 0}
          icon={<FileClock className="h-5 w-5" />}
          accent="steel"
        />
      </div>

      <Card>
        <CardHeader
          title="Tren Kehadiran 7 Hari Terakhir"
          subtitle="Seluruh siswa"
        />
        <AttendanceChart data={Array.from(trendMap.values())} />
      </Card>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  AttendanceChart,
  type AttendanceTrendPoint,
} from "@/components/charts/AttendanceChart";
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

export default async function AdminOverviewPage() {
  const supabase = createClient();

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
    { count: totalEvents },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "siswa"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "pembimbing"),
    supabase
      .from("attendance_records")
      .select("status")
      .gte("scanned_at", `${today}T00:00:00`),
    supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
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
      .select("*", { count: "exact", head: true }),
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">
          Ringkasan Admin
        </h1>
        <p className="text-sm text-mist-dim">
          Gambaran umum seluruh peserta PKL Politeknik SSR.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Siswa"
          value={siswaCount ?? 0}
          icon={<GraduationCap className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Total Pembimbing"
          value={pembimbingCount ?? 0}
          icon={<Users className="h-5 w-5" />}
          accent="ocean"
        />
        <StatCard
          label="Hadir Hari Ini"
          value={hadirToday}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Izin Menunggu"
          value={izinPendingCount ?? 0}
          icon={<FileClock className="h-5 w-5" />}
          accent="steel"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Event Mendatang"
            subtitle={`${totalEvents ?? 0} total event`}
            action={
              <Link
                href="/dashboard/admin/kalender"
                className="text-sm text-blue-vibrant hover:underline"
              >
                Lihat Semua
              </Link>
            }
          />
          <div className="divide-y divide-deep/6">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${ev.tipe === "libur" ? "bg-green-500" : "bg-blue-500"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-deep truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-mist-dim">
                      {formatDate(ev.event_date)}
                    </p>
                  </div>
                  <Badge tone={ev.tipe === "libur" ? "success" : "neutral"}>
                    {ev.tipe === "libur" ? "Libur" : "Event"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-mist-dim">
                Tidak ada event mendatang.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Tren Kehadiran 7 Hari Terakhir"
            subtitle="Seluruh siswa"
          />
          <AttendanceChart data={Array.from(trendMap.values())} />
        </Card>
      </div>
    </div>
  );
}
