"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, Ban, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import { deleteUser, blockUser, unblockUser, updateUserRole } from "@/actions/admin";

interface UserActionsMenuProps {
  userId: string;
  userName: string;
  currentRole: string;
  isApproved: boolean;
}

export function UserActionsMenu({ userId, userName, currentRole, isApproved }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function doAction(action: () => Promise<any>) {
    startTransition(async () => {
      await action();
      setOpen(false);
      setConfirmDelete(false);
      router.refresh();
      setTimeout(() => window.location.reload(), 300);
    });
  }

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Hapus Akun</h3>
                <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus akun <strong className="text-gray-900">{userName}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => doAction(() => deleteUser(userId))}
                disabled={isPending}
                className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2 transition-colors"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={isPending}
          aria-label="Aksi pengguna"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setConfirmDelete(false); }} />
            <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Role</div>
              {["siswa", "pembimbing", "admin"].filter((r) => r !== currentRole).map((role) => (
                <button
                  key={role}
                  onClick={() => doAction(() => updateUserRole(userId, role as any))}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  disabled={isPending}
                >
                  <Shield className="h-3.5 w-3.5 text-gray-400" />
                  Jadi {role}
                </button>
              ))}

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={() => doAction(() => (isApproved ? blockUser(userId) : unblockUser(userId)))}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                disabled={isPending}
              >
                {isApproved ? (
                  <>
                    <Ban className="h-3.5 w-3.5 text-amber-500" />
                    Blokir Akun
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    Buka Blokir
                  </>
                )}
              </button>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={() => { setConfirmDelete(true); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Akun
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
