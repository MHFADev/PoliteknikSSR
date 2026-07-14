"use client";

/**
 * PendingApprovals — Daftar user yang menunggu persetujuan Admin
 * ================================================================
 * Client component yang menampilkan user-user dengan status belum disetujui
 * (approved !== true). Admin dapat menyetujui atau menolak pendaftaran.
 *
 * Alur:
 * 1. Terima daftar pendingUsers sebagai props (dari server component)
 * 2. Tampilkan setiap user dengan info nama, email, role, tanggal daftar
 * 3. Tombol "Setujui" → panggil approveUser server action
 * 4. Tombol "Tolak" → panggil rejectUser server action
 * 5. Setelah sukses, refresh halaman via router.refresh()
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { approveUser, rejectUser } from "@/actions/admin";
import styles from "@/styles/components/admin/PendingApprovals.module.css";

/** Tipe data user yang menunggu persetujuan */
interface PendingUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export function PendingApprovals({ pendingUsers }: { pendingUsers: PendingUser[] }) {
  const router = useRouter();

  /** ID user yang sedang diproses (loading state) */
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  /** Pesan error global jika aksi gagal */
  const [error, setError] = useState<string | null>(null);

  /**
   * handleAction — Proses aksi setujui / tolak
   * @param action - "approve" atau "reject"
   * @param userId - ID target user
   */
  async function handleAction(action: "approve" | "reject", userId: string) {
    setSubmittingId(userId);
    setError(null);

    const result =
      action === "approve" ? await approveUser(userId) : await rejectUser(userId);

    if (!result.success) {
      setError(result.message);
      setSubmittingId(null);
      return;
    }

    setSubmittingId(null);
    router.refresh();
    setTimeout(() => window.location.reload(), 300);
  }

  /**
   * roleBadgeTone — Pilih warna badge berdasarkan role
   */
  function roleBadgeTone(role: string) {
    switch (role) {
      case "admin":
        return "danger" as const;
      case "pembimbing":
        return "success" as const;
      default:
        return "neutral" as const;
    }
  }

  // --- Empty state ---
  if (pendingUsers.length === 0) {
    return <p className={styles.empty}>Tidak ada pendaftaran menunggu persetujuan.</p>;
  }

  return (
    <div className={styles.section}>
      {/* Pesan error global */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Daftar user menunggu persetujuan */}
      {pendingUsers.map((user) => {
        const isLoading = submittingId === user.id;
        const isDisabled = submittingId !== null;

        return (
          <div key={user.id} className={styles.item}>
            {/* Informasi user */}
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{user.fullName}</span>
              <span className={styles.itemEmail}>{user.email}</span>
              <div className={styles.itemMeta}>
                <Badge tone={roleBadgeTone(user.role)} size="sm">
                  {user.role}
                </Badge>
                <span className={styles.itemDate}>
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>

            {/* Tombol aksi */}
            <div className={styles.itemActions}>
              <Button
                size="sm"
                variant="teal"
                isLoading={isLoading}
                disabled={isDisabled}
                onClick={() => handleAction("approve", user.id)}
              >
                <CheckCircle className="h-4 w-4" />
                Setujui
              </Button>

              <Button
                size="sm"
                variant="danger"
                isLoading={isLoading}
                disabled={isDisabled}
                onClick={() => handleAction("reject", user.id)}
              >
                <XCircle className="h-4 w-4" />
                Tolak
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
