import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, todayISODate } from "@/lib/utils";
import { CalendarCheck, FileClock, NotebookPen } from "lucide-react";

export default async function SiswaOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);

  const [{ count: hadirCount }, { count: izinPendingCount }, { data: recentLogbook }] = await Promise.all([
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
  ]);

  const todayEntry = recentLogbook?.find((e) => e.entry_date === todayISODate());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Ringkasan</h1>
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
  );
}
