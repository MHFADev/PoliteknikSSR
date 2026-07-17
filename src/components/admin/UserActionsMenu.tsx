"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical, Shield, UserX, Ban, CheckCircle, KeyRound,
  LogOut, Activity, Crown, Lock, Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  updateUserRole, deleteUser, blockUser, unblockUser,
  resetUserPassword, forceLogoutUser,
} from "@/actions/admin";

interface UserActionsMenuProps {
  userId: string;
  userName: string;
  currentRole: string;
  isApproved: boolean;
}

const ALL_ROLES = [
  { key: "siswa", label: "Siswa", color: "#2563EB", hoverBg: "#EFF6FF", icon: "🔵" },
  { key: "pembimbing", label: "Pembimbing", color: "#16A34A", hoverBg: "#DCFCE7", icon: "🟢" },
  { key: "admin", label: "Admin", color: "#DC2626", hoverBg: "#FEE2E2", icon: "🔴" },
  { key: "owner", label: "Owner", color: "#D97706", hoverBg: "#FFF7ED", icon: "👑" },
];

export function UserActionsMenu({ userId, userName, currentRole, isApproved }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [myRole, setMyRole] = useState<"admin" | "root">("admin");
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isRoot = myRole === "root";

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (data?.role === "root" || data?.role === "owner") setMyRole("root");
    })();
  }, []);

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuH = 320;
    if (spaceBelow < menuH && spaceAbove > menuH) {
      setMenuStyle({ bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right });
    } else {
      setMenuStyle({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  }, []);

  useEffect(() => { if (open) { updatePosition(); window.addEventListener("scroll", updatePosition, true); } return () => window.removeEventListener("scroll", updatePosition, true); }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setShowAll(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function showMsg(type: "success" | "error", text: string) {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  }

  function doAction(action: () => Promise<any>) {
    startTransition(async () => {
      const result = await action();
      if (result && !result.success) {
        showMsg("error", result.message);
      } else {
        setOpen(false);
        setShowAll(false);
        router.refresh();
        setTimeout(() => window.location.reload(), 300);
      }
    });
  }

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      showMsg("error", "Password minimal 6 karakter");
      return;
    }
    doAction(() => resetUserPassword(userId, newPassword));
    setShowResetPw(false);
    setNewPassword("");
  };

  // ── Build flat action list ──
  const actionItems: React.ReactNode[] = [];
  const roles = ALL_ROLES.filter((r) => r.key !== "owner" || isRoot);

  roles.forEach((r) => {
    const isCurrent = r.key === currentRole;
    actionItems.push(
      <button key={r.key}
        onClick={() => { if (!isCurrent) doAction(() => updateUserRole(userId, r.key as any)); }}
        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors disabled:opacity-50"
        disabled={isPending || isCurrent}
        style={{ color: isCurrent ? "#94A3B8" : r.color }}
        onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = r.hoverBg; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span className="text-base flex-shrink-0">{r.icon}</span>
        <span className={`font-medium ${isCurrent ? "line-through" : ""}`}>{r.label}</span>
        {isCurrent && <Check className="h-3.5 w-3.5 ml-auto text-green-500" />}
      </button>
    );
  });

  actionItems.push(
    <button key="resetpw" onClick={() => { setShowResetPw(true); setOpen(false); }}
      className="w-full text-left px-3 py-2 text-sm text-violet-700 hover:bg-violet-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
      disabled={isPending}
    >
      <KeyRound className="h-4 w-4 text-violet-500" />
      <span className="font-medium">Reset Password</span>
    </button>
  );

  if (isRoot) {
    actionItems.push(
      <button key="paksa" onClick={() => doAction(() => forceLogoutUser(userId))}
        className="w-full text-left px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
        disabled={isPending}
      >
        <LogOut className="h-4 w-4 text-amber-500" />
        <span className="font-medium">Paksa Logout</span>
      </button>
    );
  }

  actionItems.push(
    isApproved ? (
      <button key="blokir" onClick={() => doAction(() => blockUser(userId))}
        className="w-full text-left px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
        disabled={isPending}
      >
        <Ban className="h-4 w-4 text-orange-500" />
        <span className="font-medium">Blokir Akun</span>
      </button>
    ) : (
      <button key="blokir" onClick={() => doAction(() => unblockUser(userId))}
        className="w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
        disabled={isPending}
      >
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        <span className="font-medium">Buka Blokir</span>
      </button>
    )
  );

  actionItems.push(
    <button key="hapus" onClick={() => {
      if (confirm(`Yakin ingin menghapus akun ${userName}? Tindakan ini tidak dapat dibatalkan.`)) {
        doAction(() => deleteUser(userId));
      }
    }}
      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors disabled:opacity-50 font-medium"
      disabled={isPending}
    >
      <UserX className="h-4 w-4" />
      <span>Hapus Akun</span>
    </button>
  );

  const MAX_VISIBLE = 5;
  const isCollapsed = !showAll && actionItems.length > MAX_VISIBLE;
  const visibleItems = isCollapsed ? actionItems.slice(0, MAX_VISIBLE) : actionItems;

  const roleItems = visibleItems.slice(0, roles.length);
  const securityStart = roles.length;
  const securityCount = 1 + (isRoot ? 1 : 0);
  const securityItems = visibleItems.slice(securityStart, securityStart + securityCount);
  const statusItems = visibleItems.slice(securityStart + securityCount);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        disabled={isPending}
        aria-label="Aksi pengguna"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>

      {actionMsg && (
        <div style={{ position: "fixed", top: btnRef.current?.getBoundingClientRect().bottom ? btnRef.current.getBoundingClientRect().bottom - 30 : 0, right: 16, zIndex: 60 }}
          className={`text-xs px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap ${
          actionMsg.type === "success" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
        }`}>
          {actionMsg.text}
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setShowAll(false); }} />
          <div
            style={{ position: "fixed", ...menuStyle, zIndex: 50, maxHeight: "calc(100vh - 16px)", overflowY: "auto" }}
            className="min-w-[12rem] bg-white rounded-xl border border-gray-200 shadow-xl py-1.5"
          >
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                Ubah Role
              </div>
              {roleItems}

              {securityItems.length > 0 && <div className="h-px bg-gray-100 my-1" />}
              {securityItems.length > 0 && (
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Keamanan
                </div>
              )}
              {securityItems}

              {statusItems.length > 0 && <div className="h-px bg-gray-100 my-1" />}
              {statusItems.length > 0 && (
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  Status Akun
                </div>
              )}
              {statusItems}

              {isCollapsed && (
                <button onClick={() => setShowAll(true)}
                  className="w-full py-2.5 text-xs font-semibold text-center text-blue-600 hover:bg-blue-50 border-t border-gray-100 transition-colors">
                  Show all +{actionItems.length - MAX_VISIBLE}
                </button>
              )}
              {showAll && (
                <button onClick={() => setShowAll(false)}
                  className="w-full py-2.5 text-xs font-semibold text-center text-slate-500 hover:bg-slate-50 border-t border-gray-100 transition-colors">
                  Show less
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {showResetPw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setShowResetPw(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-1">Reset Password</h3>
            <p className="text-sm text-slate-500 mb-4">Masukkan password baru untuk <strong>{userName}</strong></p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password baru (min. 6 karakter)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowResetPw(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Batal
              </button>
              <button onClick={handleResetPassword}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}