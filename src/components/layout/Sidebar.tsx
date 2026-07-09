"use client";

import Link from "next/link";
<<<<<<< HEAD
import { usePathname, useRouter } from "next/navigation";
=======
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
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
<<<<<<< HEAD
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
=======
  CalendarDays,
  Megaphone,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const NAV_BY_ROLE: Record<"siswa" | "pembimbing" | "admin", NavItem[]> = {
  siswa: [
    { href: "/dashboard/siswa", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/dashboard/siswa/absensi", label: "Absensi QR", icon: QrCode },
    { href: "/dashboard/siswa/izin", label: "Pengajuan Izin", icon: FileText },
    { href: "/dashboard/siswa/logbook", label: "Logbook Harian", icon: NotebookPen },
<<<<<<< HEAD
=======
    { href: "/dashboard/siswa/kalender", label: "Kalender", icon: CalendarDays },
    { href: "/dashboard/siswa/pengumuman", label: "Pengumuman", icon: Megaphone },
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
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
<<<<<<< HEAD
=======
    { href: "/dashboard/admin/kalender", label: "Kalender PKL", icon: CalendarDays },
    { href: "/dashboard/admin/broadcast", label: "Broadcast", icon: Megaphone },
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
    { href: "/dashboard/admin/export", label: "Ekspor Data", icon: Download },
    { href: "/dashboard/admin/lokasi", label: "Lokasi GPS", icon: MapPin },
  ],
};

<<<<<<< HEAD
export function Sidebar({
  role,
  fullName,
}: {
  role: "siswa" | "pembimbing" | "admin";
  fullName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
=======
export function Sidebar({ role, fullName }: { role: "siswa" | "pembimbing" | "admin"; fullName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  const items = NAV_BY_ROLE[role];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

<<<<<<< HEAD
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-deep/8 bg-mist-soft/80 backdrop-blur-xl px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="font-display text-lg font-semibold text-deep">Politeknik SSR</p>
          <p className="text-xs text-mist-dim">Manajemen PKL</p>
        </div>

        <nav className="space-y-1">
    <div className="flex h-full flex-col justify-between px-3 py-5 sm:px-4 sm:py-6">
      <div>
        <div className="mb-6 px-2 sm:mb-8">
          <Image src="/logo.png" alt="Politeknik SSR" width={120} height={34} className="h-auto w-auto sm:w-[140px]" priority />
        </div>
        <nav className="space-y-0.5">
            return (
<<<<<<< HEAD
              <Link key={item.href} href={item.href} className="relative block">
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-blue-vibrant/10"
=======
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="relative block">
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-blue-vibrant/10 sm:rounded-xl"
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
<<<<<<< HEAD
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-blue-vibrant" : "text-steel hover:text-deep"
                  )}
                >
                  <Icon className="h-4 w-4" />
=======
                    "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm",
                    active ? "text-blue-vibrant" : "text-steel hover:text-deep"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
<<<<<<< HEAD

      <div className="space-y-3 px-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-steel/30 text-blue-vibrant font-medium">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-deep font-medium">{fullName}</p>
            <p className="text-xs text-mist-dim capitalize">{role}</p>
=======
      <div className="space-y-2 px-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-steel/30 text-blue-vibrant text-xs font-medium sm:h-8 sm:w-8">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-deep font-medium text-xs sm:text-sm">{fullName}</p>
            <p className="text-[10px] text-mist-dim capitalize sm:text-xs">{role}</p>
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
          </div>
        </div>
        <button
          onClick={handleLogout}
<<<<<<< HEAD
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-steel hover:bg-deep/5 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
=======
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
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  );
}
