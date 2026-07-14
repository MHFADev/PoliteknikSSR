"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, Ban, CheckCircle, Shield } from "lucide-react";
import { deleteUser, blockUser, unblockUser, updateUserRole } from "@/actions/admin";

interface UserActionsMenuProps {
  userId: string;
  userName: string;
  currentRole: string;
  isApproved: boolean;
}

export function UserActionsMenu({ userId, userName, currentRole, isApproved }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAction(action: () => Promise<any>, label: string) {
    setConfirmAction(label);
    startTransition(async () => {
      await action();
      setConfirmAction(null);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-outline/30 transition-colors"
        disabled={isPending}
      >
        <MoreVertical className="h-4 w-4 text-ink-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setConfirmAction(null); }} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-xl border border-outline shadow-lg py-1 overflow-hidden">
            {/* Ganti Role */}
            <div className="px-3 py-1.5 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Role</div>
            {["siswa", "pembimbing", "admin"].filter(r => r !== currentRole).map((role) => (
              <button
                key={role}
                onClick={() => handleAction(() => updateUserRole(userId, role as any), `role-${role}`)}
                className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-mist-soft flex items-center gap-2 transition-colors"
                disabled={isPending}
              >
                <Shield className="h-3.5 w-3.5 text-ink-muted" />
                {confirmAction === `role-${role}` ? "Memproses..." : `Jadi ${role}`}
              </button>
            ))}

            <div className="border-t border-outline my-1" />

            {/* Blokir / Buka Blokir */}
            <button
              onClick={() => handleAction(
                () => isApproved ? blockUser(userId) : unblockUser(userId),
                isApproved ? "block" : "unblock"
              )}
              className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-mist-soft flex items-center gap-2 transition-colors"
              disabled={isPending}
            >
              {isApproved ? (
                <>
                  <Ban className="h-3.5 w-5 text-amber-500" />
                  {confirmAction === "block" ? "Memproses..." : "Blokir Akun"}
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-leaf" />
                  {confirmAction === "unblock" ? "Memproses..." : "Buka Blokir"}
                </>
              )}
            </button>

            <div className="border-t border-outline my-1" />

            {/* Hapus */}
            <button
              onClick={() => handleAction(() => deleteUser(userId), "delete")}
              className="w-full text-left px-3 py-2 text-sm text-coral hover:bg-coral/5 flex items-center gap-2 transition-colors"
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmAction === "delete" ? "Menghapus..." : "Hapus Akun"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
