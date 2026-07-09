import { createClient } from "@/lib/supabase/server";
import { LeaveRequestForm } from "@/components/izin/LeaveRequestForm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Pengajuan Izin</h1>
        <p className="text-sm text-mist-dim">Ajukan izin, sakit, atau cuti selama masa PKL.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveRequestForm />

        <Card>
          <CardHeader title="Riwayat Pengajuan" />
          <div className="divide-y divide-deep/6 max-h-[28rem] overflow-y-auto">
            {history && history.length > 0 ? (
              history.map((req) => (
                <div key={req.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-deep capitalize">{req.type}</p>
                    <Badge tone={STATUS_TONE[req.status as keyof typeof STATUS_TONE]}>{req.status}</Badge>
                  </div>
                  <p className="text-xs text-mist-dim mt-0.5">
                    {formatDate(req.start_date)} – {formatDate(req.end_date)}
                  </p>
                  <p className="text-sm text-steel mt-1 truncate">{req.reason}</p>
                  {req.review_note && (
                    <p className="text-xs text-mist-dim mt-1 italic">Catatan: {req.review_note}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-mist-dim">Belum ada pengajuan.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
