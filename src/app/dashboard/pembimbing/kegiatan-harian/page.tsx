import { createClient } from "@/lib/supabase/server";
import { LogbookReviewList } from "@/components/logbook/LogbookGradeModal";

export default async function PembimbingLogbookPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("logbook_entries")
    .select(
      "id, entry_date, content, grade, feedback, student:profiles!logbook_entries_student_id_fkey(full_name)"
    )
    .order("entry_date", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Penilaian Logbook</h1>
        <p className="text-sm text-mist-dim">Review dan beri nilai logbook siswa bimbinganmu.</p>
      </div>

      <LogbookReviewList initialEntries={(data as any) ?? []} />
    </div>
  );
}
