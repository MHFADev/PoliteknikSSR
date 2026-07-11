/**
 * Sidebar — Navigasi samping berbasis role
 * ==========================================
 * Menampilkan menu navigasi yang berbeda untuk setiap role (siswa/pembimbing/admin).
 * Di desktop: sidebar tetap di samping kiri (256px).
 * Di mobile: drawer yang bisa dibuka/tutup dengan hamburger button.
 *
 * Cara pakai:
 *   <Sidebar role="admin" fullName="Budi Santoso" />
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, QrCode, FileText, NotebookPen,
  Users, Download, MapPin, CalendarDays, Megaphone,
  LogOut, Menu, X, UserCircle, Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "@/styles/components/layout/Sidebar.module.css";

// ---------------------------------------------------------------------------
// Data navigasi per role
// ---------------------------------------------------------------------------

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<string, NavItem[]> = {
  siswa: [
    { href: "/dashboard/siswa",             label: "Dashboard",          icon: LayoutDashboard },
    { href: "/dashboard/siswa/absensi",      label: "Absensi QR",         icon: QrCode },
    { href: "/dashboard/siswa/izin",         label: "Pengajuan Izin",     icon: FileText },
    { href: "/dashboard/siswa/kegiatan-harian", label: "Kegiatan Harian", icon: NotebookPen },
    { href: "/dashboard/siswa/kalender",     label: "Kalender",           icon: CalendarDays },
    { href: "/dashboard/siswa/pengumuman",   label: "Pengumuman",         icon: Megaphone },
    { href: "/dashboard/siswa/profile",      label: "Profil Saya",        icon: UserCircle },
    { href: "/dashboard/siswa/settings",     label: "Pengaturan",         icon: Settings },
  ],
  pembimbing: [
    { href: "/dashboard/pembimbing",             label: "Dashboard",           icon: LayoutDashboard },
    { href: "/dashboard/pembimbing/izin",        label: "Persetujuan Izin",    icon: FileText },
    { href: "/dashboard/pembimbing/kegiatan-harian", label: "Penilaian Kegiatan", icon: NotebookPen },
    { href: "/dashboard/pembimbing/profile",     label: "Profil Saya",         icon: UserCircle },
    { href: "/dashboard/pembimbing/settings",    label: "Pengaturan",          icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin",            label: "Dashboard",        icon: LayoutDashboard },
    { href: "/dashboard/admin/absensi",     label: "Rekap Absensi",    icon: FileText },
    { href: "/dashboard/admin/pengguna",    label: "Kelola Pengguna",  icon: Users },
    { href: "/dashboard/admin/qr",          label: "Generate QR",      icon: QrCode },
    { href: "/dashboard/admin/izin",        label: "Data Izin",        icon: FileText },
    { href: "/dashboard/admin/kegiatan-harian", label: "Data Kegiatan",icon: NotebookPen },
    { href: "/dashboard/admin/kalender",    label: "Kalender PKL",     icon: CalendarDays },
    { href: "/dashboard/admin/broadcast",   label: "Broadcast",        icon: Megaphone },
    { href: "/dashboard/admin/export",      label: "Ekspor Data",      icon: Download },
    { href: "/dashboard/admin/lokasi",      label: "Lokasi GPS",       icon: MapPin },
    { href: "/dashboard/admin/profile",     label: "Profil Saya",      icon: UserCircle },
    { href: "/dashboard/admin/settings",    label: "Pengaturan",       icon: Settings },
  ],
};

// ---------------------------------------------------------------------------
// Komponen
// ---------------------------------------------------------------------------

interface SidebarProps {
  role: "siswa" | "pembimbing" | "admin";
  fullName: string;
}

export function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV[role];

  /** Logout: hapus session Supabase lalu redirect ke halaman login */
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  /** Konten sidebar yang sama untuk desktop dan mobile */
  const sidebarContent = (
    <div className={styles.content}>
      {/* Bagian atas: logo + navigasi */}
      <div>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="Politeknik SSR" width={140} height={40} className="h-auto w-auto" priority />
        </div>
        <nav className={styles.nav}>
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={styles.link}>
                {/* Indikator halaman aktif dengan animasi layout */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className={styles.activeBg}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={cn(styles.linkText, active ? styles.linkActive : styles.linkInactive)}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bagian bawah: info user + tombol logout */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className={styles.userName}>{fullName}</p>
            <p className={styles.userRole}>{role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut className="h-5 w-5" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Tombol hamburger untuk mobile */}
      <button
        onClick={() => setOpen(!open)}
        className={styles.hamburger}
        aria-label={open ? "Tutup menu" : "Buka menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar desktop — selalu terlihat di layar lebar */}
      <aside className={styles.desktop}>{sidebarContent}</aside>

      {/* Sidebar mobile — drawer yang muncul dari kiri */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.mobileOverlay}
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className={styles.mobileDrawer}
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