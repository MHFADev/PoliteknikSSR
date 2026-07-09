import { createClient } from "@/lib/supabase/server";
import { PendingLeaveApprovals } from "@/components/izin/LeaveApprovalModal";

export default async function PembimbingIzinPage() {
  const supabase = createClient();

  // RLS (is_mentor_of) otomatis membatasi hasil hanya ke siswa bimbingan pembimbing ini.
  const { data } = await supabase
    .from("leave_requests")
    .select(
      "id, type, reason, start_date, end_date, proof_url, student:profiles!leave_requests_student_id_fkey(full_name, identity_number)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Persetujuan Izin</h1>
        <p className="text-sm text-mist-dim">Tinjau dan proses pengajuan izin siswa bimbinganmu.</p>
      </div>

      <PendingLeaveApprovals initialRequests={(data as any) ?? []} />
    </div>
  );
}
