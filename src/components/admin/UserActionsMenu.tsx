"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Shield } from "lucide-react";
import { updateUserRole } from "@/actions/admin";

interface UserActionsMenuProps {
  userId: string;
  userName: string;
  currentRole: string;
  isApproved: boolean;
}

export function UserActionsMenu({ userId, userName, currentRole, isApproved }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setPosition(spaceBelow < 200 ? "top" : "bottom");
  }, []);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function doAction(action: () => Promise<any>) {
    startTransition(async () => {
      await action();
      setOpen(false);
      router.refresh();
      setTimeout(() => window.location.reload(), 300);
    });
  }

  const menuPos = position === "top"
    ? "bottom-full mb-1"
    : "top-full mt-1";

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

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 ${menuPos} z-50 w-48 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Role</div>
            {["siswa", "pembimbing", "admin"].filter((r) => r !== currentRole).map((role) => (
              <button
                key={role}
                onClick={() => doAction(() => updateUserRole(userId, role as any))}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors"
                disabled={isPending}
              >
                <Shield className="h-3.5 w-3.5 text-gray-400" />
                Jadi {role}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
