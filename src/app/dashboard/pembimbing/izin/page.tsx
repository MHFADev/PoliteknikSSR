import { createClient } from "@/lib/supabase/server";
import { PendingLeaveApprovals } from "@/components/izin/LeaveApprovalModal";
import styles from "@/styles/pages/dashboard/pembimbing/Izin.module.css";

export default async function PembimbingIzinPage() {
  const supabase = await createClient();

  // RLS (is_mentor_of) otomatis membatasi hasil hanya ke siswa bimbingan pembimbing ini.
  const { data } = await supabase
    .from("leave_requests")
    .select(
      "id, type, reason, start_date, end_date, proof_url, student:profiles!leave_requests_student_id_fkey(full_name, identity_number, avatar_url)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Persetujuan Izin</h1>
        <p>Tinjau dan proses pengajuan izin siswa bimbinganmu.</p>
      </div>

      <PendingLeaveApprovals initialRequests={(data as any) ?? []} />
    </div>
  );
}
