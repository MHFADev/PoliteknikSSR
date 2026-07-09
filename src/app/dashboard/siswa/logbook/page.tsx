import { createClient } from "@/lib/supabase/server";
import { LogbookForm } from "@/components/logbook/LogbookForm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, todayISODate } from "@/lib/utils";

export default async function SiswaLogbookPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: history } = await supabase
    .from("logbook_entries")
    .select("*")
    .eq("student_id", user!.id)
    .order("entry_date", { ascending: false });

  const todayEntry = history?.find((e) => e.entry_date === todayISODate());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Logbook Harian</h1>
        <p className="text-sm text-mist-dim">Catat aktivitas PKL kamu setiap hari.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LogbookForm existingContent={todayEntry?.content} />

        <Card>
          <CardHeader title="Riwayat Logbook" />
          <div className="divide-y divide-deep/6 max-h-[32rem] overflow-y-auto">
            {history && history.length > 0 ? (
              history.map((entry) => (
                <div key={entry.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-deep">{formatDate(entry.entry_date)}</p>
                    {entry.grade !== null ? (
                      <Badge tone="success">Nilai {entry.grade}</Badge>
                    ) : (
                      <Badge tone="neutral">Belum dinilai</Badge>
                    )}
                  </div>
                  <p className="text-sm text-steel mt-1 line-clamp-2">{entry.content}</p>
                  {entry.feedback && (
                    <p className="text-xs text-mist-dim mt-1 italic">Feedback: {entry.feedback}</p>
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
