"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  CalendarDays,
  Megaphone,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const NAV_BY_ROLE: Record<"siswa" | "pembimbing" | "admin", NavItem[]> = {
  siswa: [
    { href: "/dashboard/siswa", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/siswa/absensi", label: "Absensi QR", icon: QrCode },
    { href: "/dashboard/siswa/izin", label: "Pengajuan Izin", icon: FileText },
    { href: "/dashboard/siswa/kegiatan-harian", label: "Kegiatan Harian", icon: NotebookPen },
    { href: "/dashboard/siswa/kalender", label: "Kalender", icon: CalendarDays },
    { href: "/dashboard/siswa/pengumuman", label: "Pengumuman", icon: Megaphone },
  ],
  pembimbing: [
    { href: "/dashboard/pembimbing", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/pembimbing/izin", label: "Persetujuan Izin", icon: FileText },
    { href: "/dashboard/pembimbing/kegiatan-harian", label: "Penilaian Kegiatan", icon: NotebookPen },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/absensi", label: "Rekap Absensi", icon: FileText },
    { href: "/dashboard/admin/pengguna", label: "Kelola Pengguna", icon: Users },
    { href: "/dashboard/admin/qr", label: "Generate QR", icon: QrCode },
    { href: "/dashboard/admin/izin", label: "Data Izin", icon: FileText },
    { href: "/dashboard/admin/kegiatan-harian", label: "Data Kegiatan", icon: NotebookPen },
    { href: "/dashboard/admin/kalender", label: "Kalender PKL", icon: CalendarDays },
    { href: "/dashboard/admin/broadcast", label: "Broadcast", icon: Megaphone },
    { href: "/dashboard/admin/export", label: "Ekspor Data", icon: Download },
    { href: "/dashboard/admin/lokasi", label: "Lokasi GPS", icon: MapPin },
  ],
};

export function Sidebar({ role, fullName }: { role: "siswa" | "pembimbing" | "admin"; fullName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV_BY_ROLE[role];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between px-4 py-6 overflow-y-auto">
      <div className="flex-1">
        <div className="mb-8 px-2 flex items-center justify-between">
          <Image src="/logo.png" alt="Politeknik SSR" width={140} height={40} className="h-auto w-auto" priority />
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-surface"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5 text-ink-muted" />
          </button>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="relative block">
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-skylearn-lg bg-sky-soft"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    "relative flex items-center gap-3 rounded-skylearn-lg px-3 py-3 text-sm font-medium transition-colors min-h-[50px]",
                    active ? "text-sky-deep" : "text-ink-muted hover:text-ink hover:bg-surface"
                  )}
                >
                  <Icon className="h-6 w-6 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="space-y-3 px-2 pt-4 border-t border-outline mt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-soft text-sky-deep text-lg font-bold border-2 border-white shadow-skylearn flex-shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-ink font-semibold">{fullName}</p>
            <p className="text-xs text-ink-subtle capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-skylearn-lg px-3 py-3 text-sm font-medium text-ink-muted hover:bg-surface hover:text-coral transition-colors min-h-[50px]"
        >
          <LogOut className="h-6 w-6 flex-shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 flex h-14 w-14 items-center justify-center rounded-skylearn-lg bg-white shadow-skylearn border border-outline text-ink lg:hidden"
        aria-label={open ? "Tutup menu" : "Buka menu"}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <aside className="hidden h-screen w-64 shrink-0 border-r border-outline bg-white lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="h-full w-full max-w-xs border-r border-outline bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
