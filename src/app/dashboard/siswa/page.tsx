import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, todayISODate } from "@/lib/utils";
import { CalendarCheck, FileClock, NotebookPen, CalendarDays, Megaphone } from "lucide-react";
import Link from "next/link";
import { getAnnouncementsForStudent } from "@/actions/broadcast";

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
    { data: leaves },
    announcements,
  ] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user!.id)
      .eq("status", "hadir")
      .gte("scanned_at", startOfMonth.toISOString()),
    supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
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
      .from("leave_requests")
      .select("start_date, end_date, type")
      .eq("student_id", user!.id)
      .eq("status", "disetujui"),
    getAnnouncementsForStudent(user!.id, profile?.jurusan_id ?? null),
  ]);

  const todayEntry = recentLogbook?.find((e) => e.entry_date === todayISODate());
  const activeLeaves = leaves?.filter((l) => l.start_date <= today && l.end_date >= today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">
          HI, {profile?.full_name || "Pengguna"} 👋👋
        </h1>
        <p className="text-sm text-mist-dim">Pantau progres PKL kamu bulan ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Hadir Bulan Ini" value={hadirCount ?? 0} icon={<CalendarCheck className="h-5 w-5" />} accent="blue" />
        <StatCard label="Izin Menunggu Review" value={izinPendingCount ?? 0} icon={<FileClock className="h-5 w-5" />} accent="steel" />
        <StatCard
          label="Logbook Hari Ini"
          value={todayEntry ? "Sudah diisi" : "Belum diisi"}
          icon={<NotebookPen className="h-5 w-5" />}
          accent="ocean"
        />
      </div>

      {announcements && announcements.length > 0 && (
        <Card>
          <CardHeader 
            title="Pengumuman Terbaru" 
            icon={<Megaphone className="h-5 w-5" />} 
            action={
              <Link href="/dashboard/siswa/pengumuman" className="text-sm text-blue-vibrant hover:underline">Lihat Semua</Link>
            }
          />
          <div className="divide-y divide-deep/6">
            {announcements.map((a: any) => (
              <div key={a.id} className="px-4 py-3">
                <h3 className="text-sm font-semibold text-deep">{a.title}</h3>
                <p className="text-xs text-mist mt-1">{a.content}</p>
                <p className="text-[10px] text-mist-dim mt-2">
                  {formatDate(a.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Event Mendatang" action={
            <Link href="/dashboard/siswa/kalender" className="text-sm text-blue-vibrant hover:underline">Lihat Kalender</Link>
          } />
          <div className="divide-y divide-deep/6">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${ev.tipe === "libur" ? "bg-green-500" : "bg-blue-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-deep truncate">{ev.title}</p>
                    <p className="text-xs text-mist-dim">{formatDate(ev.event_date)}</p>
                  </div>
                  <Badge tone={ev.tipe === "libur" ? "success" : "neutral"}>{ev.tipe === "libur" ? "Libur" : "Event"}</Badge>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-mist-dim">Tidak ada event mendatang.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Riwayat Logbook Terbaru" />
          <div className="divide-y divide-deep/6">
            {recentLogbook && recentLogbook.length > 0 ? (
              recentLogbook.map((entry) => (
                <div key={entry.entry_date} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-mist-dim">{formatDate(entry.entry_date)}</p>
                    <p className="text-sm text-deep truncate max-w-md">{entry.content}</p>
                  </div>
                  {entry.grade !== null ? (
                    <Badge tone="success">Nilai {entry.grade}</Badge>
                  ) : (
                    <Badge tone="neutral">Belum dinilai</Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-mist-dim">Belum ada entri logbook.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
