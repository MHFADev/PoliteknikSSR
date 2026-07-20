import { createClient } from "@/lib/supabase/server";
import { LeaveRequestForm } from "@/components/izin/LeaveRequestForm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import styles from "@/styles/pages/dashboard/siswa/Izin.module.css";

const STATUS_TONE = {
  pending: "warning",
  disetujui: "success",
  ditolak: "danger",
} as const;

export default async function SiswaIzinPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: history } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Pengajuan Izin</h1>
        <p>Ajukan izin, sakit, atau cuti selama masa PKL.</p>
      </div>

      <div className={styles.formGrid}>
        <div data-tour="izin-form">
          <LeaveRequestForm />
        </div>

        <Card data-tour="izin-history">
          <CardHeader title="Riwayat Pengajuan" />
          <div className={styles.historyList}>
            {history && history.length > 0 ? (
              history.map((req) => (
                <div key={req.id} className={styles.historyItem}>
                  <div className={styles.historyItemHeader}>
                    <p className={styles.historyItemTitle}>{req.type}</p>
                    <Badge tone={STATUS_TONE[req.status as keyof typeof STATUS_TONE]}>{req.status}</Badge>
                  </div>
                  <p className={styles.historyItemDate}>
                    {formatDate(req.start_date)} – {formatDate(req.end_date)}
                  </p>
                  <p className={styles.historyItemReason}>{req.reason}</p>
                  {req.review_note && (
                    <p className={styles.historyItemNote}>Catatan: {req.review_note}</p>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>Belum ada pengajuan.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
