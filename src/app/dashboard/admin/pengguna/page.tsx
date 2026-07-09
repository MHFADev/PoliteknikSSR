import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddStudentModal } from "@/components/admin/AddStudentModal";

export default async function AdminUsersPage() {
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, identity_number, kelas, instansi, role, created_at, jurusan_id, study_programs!left(nama)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Kelola Pengguna</h1>
        <p className="text-sm text-mist-dim">Lihat dan kelola semua pengguna (siswa, pembimbing, dan admin).</p>
      </div>

      <Card>
        <CardHeader title="Daftar Pengguna" action={<AddStudentModal />} />
        <div className="divide-y divide-deep/6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mist-dim">
                <th className="py-3 px-4 font-medium">Nama</th>
                <th className="py-3 px-4 font-medium">NIS/NIP</th>
                <th className="py-3 px-4 font-medium">Kelas</th>
                <th className="py-3 px-4 font-medium">Jurusan</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {profiles && profiles.length > 0 ? (
                profiles.map((profile: any) => (
                  <tr key={profile.id} className="text-deep">
                    <td className="py-3 px-4">{profile.full_name}</td>
                    <td className="py-3 px-4 text-steel">{profile.identity_number || "-"}</td>
                    <td className="py-3 px-4 text-steel">{profile.kelas || "-"}</td>
                    <td className="py-3 px-4 text-steel">{profile.study_programs?.nama || profile.instansi || "-"}</td>
                    <td className="py-3 px-4">
                      <Badge
                        tone={
                          profile.role === "admin"
                            ? "danger"
                            : profile.role === "pembimbing"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {profile.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-steel">
                      {new Date(profile.created_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-mist-dim">
                    Belum ada pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}