import {
  LayoutDashboard, QrCode, FileText, NotebookPen,
  Users, Download, MapPin, CalendarDays, Megaphone,
  UserCircle, Settings, GraduationCap, type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: Record<string, NavItem[]> = {
  siswa: [
    { href: "/dashboard/siswa",             label: "Dashboard",       icon: LayoutDashboard },
    { href: "/dashboard/siswa/absensi",      label: "Absensi QR",     icon: QrCode },
    { href: "/dashboard/siswa/izin",         label: "Pengajuan Izin", icon: FileText },
    { href: "/dashboard/siswa/kegiatan-harian", label: "Kegiatan Harian", icon: NotebookPen },
    { href: "/dashboard/siswa/kalender",     label: "Kalender",       icon: CalendarDays },
    { href: "/dashboard/siswa/pengumuman",   label: "Pengumuman",     icon: Megaphone },
    { href: "/dashboard/siswa/profile",      label: "Profil Saya",    icon: UserCircle },
    { href: "/dashboard/siswa/settings",     label: "Pengaturan",     icon: Settings },
  ],
  pembimbing: [
    { href: "/dashboard/pembimbing",             label: "Dashboard",          icon: LayoutDashboard },
    { href: "/dashboard/pembimbing/izin",        label: "Persetujuan Izin",   icon: FileText },
    { href: "/dashboard/pembimbing/kegiatan-harian", label: "Penilaian Kegiatan", icon: NotebookPen },
    { href: "/dashboard/pembimbing/profile",     label: "Profil Saya",        icon: UserCircle },
    { href: "/dashboard/pembimbing/settings",    label: "Pengaturan",         icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin",            label: "Dashboard",       icon: LayoutDashboard },
    { href: "/dashboard/admin/absensi",     label: "Rekap Absensi",  icon: FileText },
    { href: "/dashboard/admin/pengguna",    label: "Kelola Pengguna",icon: Users },
    { href: "/dashboard/admin/study-programs", label: "Program Studi", icon: GraduationCap },
    { href: "/dashboard/admin/qr",          label: "Generate QR",    icon: QrCode },
    { href: "/dashboard/admin/izin",        label: "Data Izin",      icon: FileText },
    { href: "/dashboard/admin/kegiatan-harian", label: "Data Kegiatan", icon: NotebookPen },
    { href: "/dashboard/admin/kalender",    label: "Kalender PKL",   icon: CalendarDays },
    { href: "/dashboard/admin/broadcast",   label: "Broadcast",      icon: Megaphone },
    { href: "/dashboard/admin/export",      label: "Ekspor Data",    icon: Download },
    { href: "/dashboard/admin/profile",     label: "Profil Saya",    icon: UserCircle },
    { href: "/dashboard/admin/settings",    label: "Pengaturan",     icon: Settings },
  ],
  owner: [
    { href: "/dashboard/admin",            label: "Dashboard",       icon: LayoutDashboard },
    { href: "/dashboard/admin/absensi",     label: "Rekap Absensi",  icon: FileText },
    { href: "/dashboard/admin/pengguna",    label: "Kelola Pengguna",icon: Users },
    { href: "/dashboard/admin/study-programs", label: "Program Studi", icon: GraduationCap },
    { href: "/dashboard/admin/qr",          label: "Generate QR",    icon: QrCode },
    { href: "/dashboard/admin/izin",        label: "Data Izin",      icon: FileText },
    { href: "/dashboard/admin/kegiatan-harian", label: "Data Kegiatan", icon: NotebookPen },
    { href: "/dashboard/admin/kalender",    label: "Kalender PKL",   icon: CalendarDays },
    { href: "/dashboard/admin/broadcast",   label: "Broadcast",      icon: Megaphone },
    { href: "/dashboard/admin/export",      label: "Ekspor Data",    icon: Download },
    { href: "/dashboard/admin/lokasi",      label: "Lokasi GPS",     icon: MapPin },
    { href: "/dashboard/admin/profile",     label: "Profil Saya",    icon: UserCircle },
    { href: "/dashboard/admin/settings",    label: "Pengaturan",     icon: Settings },
  ],
};

export const MAIN_NAV: Record<string, NavItem[]> = {
  siswa: NAV.siswa.slice(0, 4),
  pembimbing: NAV.pembimbing.slice(0, 3),
  admin: [
    { href: "/dashboard/admin",         label: "Dashboard",  icon: LayoutDashboard },
    { href: "/dashboard/admin/absensi",  label: "Absensi",   icon: FileText },
    { href: "/dashboard/admin/qr",       label: "QR Code",   icon: QrCode },
    { href: "/dashboard/admin/pengguna", label: "Pengguna",  icon: Users },
  ],
  owner: [
    { href: "/dashboard/admin",         label: "Dashboard",  icon: LayoutDashboard },
    { href: "/dashboard/admin/absensi",  label: "Absensi",   icon: FileText },
    { href: "/dashboard/admin/qr",       label: "QR Code",   icon: QrCode },
    { href: "/dashboard/admin/pengguna", label: "Pengguna",  icon: Users },
  ],
};

export const MORE_NAV: Record<string, NavItem[]> = {
  siswa: NAV.siswa.slice(4),
  pembimbing: NAV.pembimbing.slice(3),
  admin: NAV.admin.slice(4),
  owner: NAV.owner.slice(4),
};