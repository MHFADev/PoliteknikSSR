import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddStudentModal } from "@/components/admin/AddStudentModal";
import { PendingApprovals } from "@/components/admin/PendingApprovals";
import { getPendingUsers } from "@/actions/admin";
import styles from "@/styles/pages/dashboard/admin/Pengguna.module.css";

export default async function AdminUsersPage() {
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, identity_number, kelas, instansi, role, created_at, jurusan_id, study_programs!left(nama)")
    .order("created_at", { ascending: false });

  const pendingUsers = await getPendingUsers();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Kelola Pengguna</h1>
        <p>Lihat dan kelola semua pengguna (siswa, pembimbing, dan admin).</p>
      </div>

      <Card>
        <CardHeader title="Registrasi Menunggu Persetujuan" />
        <PendingApprovals pendingUsers={pendingUsers} />
      </Card>

      <Card>
        <CardHeader title="Daftar Pengguna" action={<AddStudentModal />} />
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIS/NIP</th>
                <th>Kelas</th>
                <th>Jurusan</th>
                <th>Role</th>
                <th>Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {profiles && profiles.length > 0 ? (
                profiles.map((profile: any) => (
                  <tr key={profile.id}>
                    <td>{profile.full_name}</td>
                    <td className={styles.tableCellMuted}>{profile.identity_number || "-"}</td>
                    <td className={styles.tableCellMuted}>{profile.kelas || "-"}</td>
                    <td className={styles.tableCellMuted}>{profile.study_programs?.nama || profile.instansi || "-"}</td>
                    <td>
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
                    <td className={styles.tableCellMuted}>
                      {new Date(profile.created_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>Belum ada pengguna.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}