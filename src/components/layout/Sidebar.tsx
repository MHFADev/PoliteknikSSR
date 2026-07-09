"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  QrCode,
  FileText,
  NotebookPen,
  Users,
  Download,
  MapPin,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const NAV_BY_ROLE: Record<"siswa" | "pembimbing" | "admin", NavItem[]> = {
  siswa: [
    { href: "/dashboard/siswa", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/dashboard/siswa/absensi", label: "Absensi QR", icon: QrCode },
    { href: "/dashboard/siswa/izin", label: "Pengajuan Izin", icon: FileText },
    { href: "/dashboard/siswa/logbook", label: "Logbook Harian", icon: NotebookPen },
  ],
  pembimbing: [
    { href: "/dashboard/pembimbing", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/dashboard/pembimbing/izin", label: "Persetujuan Izin", icon: FileText },
    { href: "/dashboard/pembimbing/logbook", label: "Penilaian Logbook", icon: NotebookPen },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/dashboard/admin/pengguna", label: "Kelola Pengguna", icon: Users },
    { href: "/dashboard/admin/qr", label: "Generate QR", icon: QrCode },
    { href: "/dashboard/admin/izin", label: "Data Izin", icon: FileText },
    { href: "/dashboard/admin/logbook", label: "Data Logbook", icon: NotebookPen },
    { href: "/dashboard/admin/export", label: "Ekspor Data", icon: Download },
    { href: "/dashboard/admin/lokasi", label: "Lokasi GPS", icon: MapPin },
  ],
};

export function Sidebar({
  role,
  fullName,
}: {
  role: "siswa" | "pembimbing" | "admin";
  fullName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_BY_ROLE[role];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-deep/8 bg-mist-soft/80 backdrop-blur-xl px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="font-display text-lg font-semibold text-deep">Politeknik SSR</p>
          <p className="text-xs text-mist-dim">Manajemen PKL · SatriaD</p>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="relative block">
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-blue-vibrant/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-blue-vibrant" : "text-steel hover:text-deep"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 px-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-steel/30 text-blue-vibrant font-medium">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-deep font-medium">{fullName}</p>
            <p className="text-xs text-mist-dim capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-steel hover:bg-deep/5 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
