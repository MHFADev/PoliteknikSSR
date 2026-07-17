import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddStudentModal } from "@/components/admin/AddStudentModal";
import { PendingApprovals } from "@/components/admin/PendingApprovals";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";
import { getPendingUsers } from "@/actions/admin";
import styles from "@/styles/pages/dashboard/admin/Pengguna.module.css";

export const dynamic = "force-dynamic";

const ROLE_BADGES: Record<
  string,
  { label: string; tone: string; className: string }
> = {
  root: {
    label: "Root",
    tone: "danger",
    className: "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] ring-1 ring-[#F59E0B]",
  },
  owner: {
    label: "Owner",
    tone: "warning",
    className: "bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]",
  },
  admin: {
    label: "Admin",
    tone: "danger",
    className: "bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]",
  },
  pembimbing: {
    label: "Pembimbing",
    tone: "success",
    className: "bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]",
  },
  siswa: {
    label: "Siswa",
    tone: "sky",
    className: "bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE]",
  },
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, full_name, identity_number, kelas, instansi, role, approved, created_at, jurusan_id, avatar_url, study_programs!left(nama)",
    )
    .neq("role", "owner")
    .neq("role", "root")
    .order("created_at", { ascending: false });

  const pendingUsers = await getPendingUsers();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Kelola Pengguna</h1>
        <p>Lihat dan kelola semua pengguna (siswa, pembimbing, dan admin)</p>
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
                <th>Status</th>
                <th>Dibuat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles && profiles.length > 0 ? (
                profiles.map((profile: any) => {
                  const roleBadge =
                    ROLE_BADGES[profile.role] || ROLE_BADGES.siswa;
                  return (
                    <tr key={profile.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "9999px",
                              background: profile.avatar_url
                                ? "transparent"
                                : "#DBEAFE",
                              color: "#1D4ED8",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              overflow: "hidden",
                            }}
                          >
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              profile.full_name?.charAt(0).toUpperCase() || "?"
                            )}
                          </div>
                          <span style={{ fontWeight: 500 }}>
                            {profile.full_name}
                          </span>
                        </div>
                      </td>
                      <td className={styles.tableCellMuted}>
                        {profile.identity_number || "-"}
                      </td>
                      <td className={styles.tableCellMuted}>
                        {profile.kelas || "-"}
                      </td>
                      <td className={styles.tableCellMuted}>
                        {profile.study_programs?.nama ||
                          profile.instansi ||
                          "-"}
                      </td>
                      <td>
                        <span
                          className={`${styles.roleBadge} ${roleBadge.className}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${profile.approved ? styles.statusActive : styles.statusBlocked}`}
                        >
                          {profile.approved ? "Aktif" : "Diblokir"}
                        </span>
                      </td>
                      <td className={styles.tableCellMuted}>
                        {new Date(profile.created_at).toLocaleDateString(
                          "id-ID",
                        )}
                      </td>
                      <td>
                        <UserActionsMenu
                          userId={profile.id}
                          userName={profile.full_name}
                          currentRole={profile.role}
                          isApproved={profile.approved ?? true}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
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
