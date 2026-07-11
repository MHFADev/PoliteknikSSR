import { createClient } from "@/lib/supabase/server";
import { PendingLeaveApprovals } from "@/components/izin/LeaveApprovalModal";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import styles from "@/styles/pages/dashboard/admin/Izin.module.css";

const STATUS_TONE = {
  pending: "warning",
  disetujui: "success",
  ditolak: "danger",
} as const;

export default async function AdminIzinPage() {
  const supabase = createClient();

  const [{ data: pending }, { data: allRequests }] = await Promise.all([
    supabase
      .from("leave_requests")
      .select(
        "id, type, reason, start_date, end_date, proof_url, student:profiles!leave_requests_student_id_fkey(full_name, identity_number)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("leave_requests")
      .select("id, type, status, start_date, end_date, student:profiles!leave_requests_student_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Data Izin</h1>
        <p>Kelola seluruh pengajuan izin, sakit, dan cuti siswa.</p>
      </div>

      <div>
        <h2 className={styles.sectionTitle}>Menunggu Review</h2>
        <PendingLeaveApprovals initialRequests={(pending as any) ?? []} />
      </div>

      <Card>
        <CardHeader title="Seluruh Riwayat Pengajuan" />
        <div className={styles.historyList}>
          {allRequests && allRequests.length > 0 ? (
            allRequests.map((req: any) => (
              <div key={req.id} className={styles.historyItem}>
                <div className={styles.historyItemInfo}>
                  <p className={styles.historyItemName}>{req.student?.full_name}</p>
                  <p className={styles.historyItemDetail}>
                    {req.type} · {formatDate(req.start_date)} – {formatDate(req.end_date)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[req.status as keyof typeof STATUS_TONE]}>{req.status}</Badge>
              </div>
            ))
          ) : (
            <p className={styles.emptyState}>Belum ada data.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
