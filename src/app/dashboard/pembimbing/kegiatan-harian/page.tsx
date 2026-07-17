import { createClient } from "@/lib/supabase/server";
import { LogbookReviewList } from "@/components/logbook/LogbookGradeModal";
import styles from "@/styles/pages/dashboard/pembimbing/Logbook.module.css";

export default async function PembimbingLogbookPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("logbook_entries")
    .select(
      "id, entry_date, content, grade, feedback, student:profiles!logbook_entries_student_id_fkey(full_name, avatar_url)"
    )
    .order("entry_date", { ascending: false })
    .limit(50);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Penilaian Logbook</h1>
        <p>Review dan beri nilai logbook siswa bimbinganmu.</p>
      </div>

      <LogbookReviewList initialEntries={(data as any) ?? []} />
    </div>
  );
}
