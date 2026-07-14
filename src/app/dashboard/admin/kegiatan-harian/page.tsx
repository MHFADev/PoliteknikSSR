import { createClient } from "@/lib/supabase/server";
import { LogbookReviewList } from "@/components/logbook/LogbookGradeModal";
import styles from "@/styles/pages/dashboard/admin/Logbook.module.css";

export default async function AdminLogbookPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("logbook_entries")
    .select(
      "id, entry_date, content, grade, feedback, photo_url, student:profiles!logbook_entries_student_id_fkey(full_name, avatar_url)"
    )
    .order("entry_date", { ascending: false })
    .limit(100);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Data Kegiatan</h1>
        <p>Pantau seluruh entri kegiatan siswa. Admin juga dapat menilai langsung.</p>
      </div>

      <LogbookReviewList initialEntries={(data as any) ?? []} />
    </div>
  );
}
