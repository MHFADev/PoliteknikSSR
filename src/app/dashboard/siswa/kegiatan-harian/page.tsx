import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LogbookForm } from "@/components/logbook/LogbookForm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, todayISODate } from "@/lib/utils";
import styles from "@/styles/pages/dashboard/siswa/Logbook.module.css";

export default async function SiswaLogbookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  type LogbookEntry = {
    id: string;
    student_id: string;
    entry_date: string;
    content: string;
    grade: number | null;
    photo_url?: string | null;
    feedback: string | null;
    graded_by: string | null;
    graded_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const { data: history } = await supabase
    .from("logbook_entries")
    .select("*")
    .eq("student_id", user!.id)
    .order("entry_date", { ascending: false }) as unknown as { data: LogbookEntry[] | null };

  const todayEntry = history?.find((e) => e.entry_date === todayISODate());

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Kegiatan Harian</h1>
        <p>Catat aktivitas PKL kamu setiap hari.</p>
      </div>

      <div className={styles.formGrid}>
        <LogbookForm userId={user!.id} existingContent={todayEntry?.content} existingPhotoUrl={todayEntry?.photo_url ?? undefined} />

        <Card>
          <CardHeader title="Riwayat Kegiatan" />
          <div className={styles.historyList}>
            {history && history.length > 0 ? (
              history.map((entry) => (
                <div key={entry.id} className={styles.historyItem}>
                  <div className={styles.historyItemHeader}>
                    <p className={styles.historyItemDate}>{formatDate(entry.entry_date)}</p>
                    {entry.grade !== null ? (
                      <Badge tone="leaf">Nilai {entry.grade}</Badge>
                    ) : (
                      <Badge tone="neutral">Belum dinilai</Badge>
                    )}
                  </div>
                  <p className={styles.historyItemContent}>{entry.content}</p>
                  
                  {entry.photo_url && (
                    <div className={styles.historyItemPhoto}>
                      {/* Tidak pakai fill — parent .historyItemPhoto tidak punya position + tinggi,
                          sehingga fill akan membuat img position:absolute relatif ke viewport
                          dan menutupi konten di atasnya (bug "gambar diatas"). */}
                      <Image 
                        src={entry.photo_url} 
                        alt="Bukti kegiatan" 
                        width={0} height={0} sizes="100vw"
                        unoptimized={true}
                      />
                    </div>
                  )}
                  
                  {entry.feedback && (
                    <p className={styles.historyItemFeedback}>Feedback: {entry.feedback}</p>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>Belum ada entri kegiatan.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
