import { createClient } from "@/lib/supabase/server";
import { LogbookReviewList } from "@/components/logbook/LogbookGradeModal";

export default async function AdminLogbookPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("logbook_entries")
    .select(
      "id, entry_date, content, grade, feedback, student:profiles!logbook_entries_student_id_fkey(full_name)"
    )
    .order("entry_date", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Data Logbook</h1>
        <p className="text-sm text-mist-dim">Pantau seluruh entri logbook siswa. Admin juga dapat menilai langsung.</p>
      </div>

      <LogbookReviewList initialEntries={(data as any) ?? []} />
    </div>
  );
}
