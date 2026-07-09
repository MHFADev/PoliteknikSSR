import { createClient } from "@/lib/supabase/server";
import { PendingLeaveApprovals } from "@/components/izin/LeaveApprovalModal";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

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
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Data Izin</h1>
        <p className="text-sm text-mist-dim">Kelola seluruh pengajuan izin, sakit, dan cuti siswa.</p>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-deep mb-3">Menunggu Review</h2>
        <PendingLeaveApprovals initialRequests={(pending as any) ?? []} />
      </div>

      <Card>
        <CardHeader title="Seluruh Riwayat Pengajuan" />
        <div className="divide-y divide-deep/6 max-h-[28rem] overflow-y-auto">
          {allRequests && allRequests.length > 0 ? (
            allRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-deep">{req.student?.full_name}</p>
                  <p className="text-xs text-mist-dim">
                    {req.type} · {formatDate(req.start_date)} – {formatDate(req.end_date)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[req.status as keyof typeof STATUS_TONE]}>{req.status}</Badge>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-mist-dim">Belum ada data.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
