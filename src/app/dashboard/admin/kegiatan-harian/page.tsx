import { createClient } from "@/lib/supabase/server";
import { LogbookReviewList } from "@/components/logbook/LogbookGradeModal";

export default async function AdminLogbookPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("logbook_entries")
    .select(
      "id, entry_date, content, grade, feedback, photo_url, student:profiles!logbook_entries_student_id_fkey(full_name)"
    )
    .order("entry_date", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Data Kegiatan</h1>
        <p className="text-sm text-ink-muted">Pantau seluruh entri kegiatan siswa. Admin juga dapat menilai langsung.</p>
      </div>

      <LogbookReviewList initialEntries={(data as any) ?? []} />
    </div>
  );
}
