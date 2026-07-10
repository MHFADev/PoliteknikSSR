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
    <div className="flex h-full flex-col justify-between px-3 py-5 sm:px-4 sm:py-6">
      <div>
        <div className="mb-6 px-2 sm:mb-8">
          <Image src="/logo.png" alt="Politeknik SSR" width={120} height={34} className="h-auto w-auto sm:w-[140px]" priority />
        </div>
        <nav className="space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="relative block">
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-blue-vibrant/10 sm:rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm",
                    active ? "text-blue-vibrant" : "text-steel hover:text-deep"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="space-y-2 px-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-steel/30 text-blue-vibrant text-xs font-medium sm:h-8 sm:w-8">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-deep font-medium text-xs sm:text-sm">{fullName}</p>
            <p className="text-[10px] text-mist-dim capitalize sm:text-xs">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-steel hover:bg-deep/5 hover:text-danger sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-glass border border-deep/10 text-deep lg:hidden"
        aria-label={open ? "Tutup menu" : "Buka menu"}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <aside className="hidden h-screen w-56 shrink-0 border-r border-deep/8 bg-white lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-deep/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="h-full w-64 border-r border-deep/8 bg-white"
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
