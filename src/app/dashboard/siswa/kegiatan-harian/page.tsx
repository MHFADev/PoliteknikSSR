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
        <h1 className="font-display text-2xl font-semibold text-ink">Kegiatan Harian</h1>
        <p className="text-sm text-ink-muted">Catat aktivitas PKL kamu setiap hari.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LogbookForm existingContent={todayEntry?.content} existingPhotoUrl={todayEntry?.photo_url} />

        <Card>
          <CardHeader title="Riwayat Kegiatan" />
          <div className="divide-y divide-outline max-h-[36rem] overflow-y-auto">
            {history && history.length > 0 ? (
              history.map((entry) => (
                <div key={entry.id} className="py-4 px-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{formatDate(entry.entry_date)}</p>
                    {entry.grade !== null ? (
                      <Badge tone="success">Nilai {entry.grade}</Badge>
                    ) : (
                      <Badge tone="neutral">Belum dinilai</Badge>
                    )}
                  </div>
                  <p className="text-sm text-ink-muted mt-2 line-clamp-3">{entry.content}</p>
                  
                  {entry.photo_url && (
                    <div className="mt-3">
                      <img 
                        src={entry.photo_url} 
                        alt="Bukti kegiatan" 
                        className="w-full max-h-40 object-cover rounded-skylearn-md border border-outline"
                      />
                    </div>
                  )}
                  
                  {entry.feedback && (
                    <p className="text-xs text-ink-subtle mt-3 italic border-l-2 border-sky-soft pl-3">Feedback: {entry.feedback}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-ink-subtle">Belum ada entri kegiatan.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
