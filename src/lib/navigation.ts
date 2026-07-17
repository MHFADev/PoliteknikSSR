import {
  LayoutDashboard, QrCode, FileText, NotebookPen,
  Users, Download, MapPin, CalendarDays, Megaphone,
  UserCircle, Settings, GraduationCap, Award, ListOrdered,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; group?: string };

export const NAV: Record<string, NavItem[]> = {
  siswa: [
    { href: "/dashboard/siswa",             label: "Dashboard",       icon: LayoutDashboard, group: "Utama" },
    { href: "/dashboard/siswa/absensi",      label: "Absensi QR",     icon: QrCode, group: "Utama" },
    { href: "/dashboard/siswa/izin",         label: "Pengajuan Izin", icon: FileText, group: "Pengajuan" },
    { href: "/dashboard/siswa/kegiatan-harian", label: "Kegiatan Harian", icon: NotebookPen, group: "Pengajuan" },
    { href: "/dashboard/siswa/kalender",     label: "Kalender",       icon: CalendarDays, group: "Info" },
    { href: "/dashboard/siswa/pengumuman",   label: "Pengumuman",     icon: Megaphone, group: "Info" },
    { href: "/dashboard/siswa/profile",      label: "Profil Saya",    icon: UserCircle, group: "Akun" },
    { href: "/dashboard/siswa/settings",     label: "Pengaturan",     icon: Settings, group: "Akun" },
  ],
  pembimbing: [
    { href: "/dashboard/pembimbing",             label: "Dashboard",          icon: LayoutDashboard, group: "Utama" },
    { href: "/dashboard/pembimbing/izin",        label: "Persetujuan Izin",   icon: FileText, group: "Penilaian" },
    { href: "/dashboard/pembimbing/kegiatan-harian", label: "Penilaian Kegiatan", icon: NotebookPen, group: "Penilaian" },
    { href: "/dashboard/pembimbing/profile",     label: "Profil Saya",        icon: UserCircle, group: "Akun" },
    { href: "/dashboard/pembimbing/settings",    label: "Pengaturan",         icon: Settings, group: "Akun" },
  ],
  admin: [
    { href: "/dashboard/admin",            label: "Dashboard",           icon: LayoutDashboard, group: "Utama" },
    { href: "/dashboard/admin/absensi",     label: "Rekap Absensi",      icon: FileText, group: "Manajemen" },
    { href: "/dashboard/admin/pengguna",    label: "Kelola Pengguna",    icon: Users, group: "Manajemen" },
    { href: "/dashboard/admin/study-programs", label: "Program Studi",   icon: GraduationCap, group: "Manajemen" },
    { href: "/dashboard/admin/kelas",        label: "Kelola Kelas",      icon: ListOrdered, group: "Manajemen" },
    { href: "/dashboard/admin/sertifikat-rekap", label: "Sertifikat & Nilai", icon: Award, group: "Manajemen" },
    { href: "/dashboard/admin/qr",          label: "Generate QR",        icon: QrCode, group: "Manajemen" },
    { href: "/dashboard/admin/izin",        label: "Data Izin",          icon: FileText, group: "Data" },
    { href: "/dashboard/admin/kegiatan-harian", label: "Data Kegiatan",  icon: NotebookPen, group: "Data" },
    { href: "/dashboard/admin/kalender",    label: "Kalender PKL",       icon: CalendarDays, group: "Data" },
    { href: "/dashboard/admin/broadcast",   label: "Broadcast",          icon: Megaphone, group: "Komunikasi" },
    { href: "/dashboard/admin/export",      label: "Ekspor Data",        icon: Download, group: "Laporan" },
    { href: "/dashboard/admin/profile",     label: "Profil Saya",        icon: UserCircle, group: "Akun" },
    { href: "/dashboard/admin/settings",    label: "Pengaturan",         icon: Settings, group: "Akun" },
  ],
  owner: [
    { href: "/dashboard/admin",            label: "Dashboard",           icon: LayoutDashboard, group: "Utama" },
    { href: "/dashboard/admin/absensi",     label: "Rekap Absensi",      icon: FileText, group: "Manajemen" },
    { href: "/dashboard/admin/pengguna",    label: "Kelola Pengguna",    icon: Users, group: "Manajemen" },
    { href: "/dashboard/admin/study-programs", label: "Program Studi",   icon: GraduationCap, group: "Manajemen" },
    { href: "/dashboard/admin/kelas",        label: "Kelola Kelas",      icon: ListOrdered, group: "Manajemen" },
    { href: "/dashboard/admin/sertifikat-rekap", label: "Sertifikat & Nilai", icon: Award, group: "Manajemen" },
    { href: "/dashboard/admin/qr",          label: "Generate QR",        icon: QrCode, group: "Manajemen" },
    { href: "/dashboard/admin/izin",        label: "Data Izin",          icon: FileText, group: "Data" },
    { href: "/dashboard/admin/kegiatan-harian", label: "Data Kegiatan",  icon: NotebookPen, group: "Data" },
    { href: "/dashboard/admin/kalender",    label: "Kalender PKL",       icon: CalendarDays, group: "Data" },
    { href: "/dashboard/admin/broadcast",   label: "Broadcast",          icon: Megaphone, group: "Komunikasi" },
    { href: "/dashboard/admin/lokasi",      label: "Lokasi GPS",         icon: MapPin, group: "Laporan" },
    { href: "/dashboard/admin/export",      label: "Ekspor Data",        icon: Download, group: "Laporan" },
    { href: "/dashboard/admin/profile",     label: "Profil Saya",        icon: UserCircle, group: "Akun" },
    { href: "/dashboard/admin/settings",    label: "Pengaturan",         icon: Settings, group: "Akun" },
  ],
  root: [
    { href: "/dashboard/admin",            label: "Dashboard",           icon: LayoutDashboard, group: "Utama" },
    { href: "/dashboard/admin/absensi",     label: "Rekap Absensi",      icon: FileText, group: "Manajemen" },
    { href: "/dashboard/admin/pengguna",    label: "Kelola Pengguna",    icon: Users, group: "Manajemen" },
    { href: "/dashboard/admin/study-programs", label: "Program Studi",   icon: GraduationCap, group: "Manajemen" },
    { href: "/dashboard/admin/kelas",        label: "Kelola Kelas",      icon: ListOrdered, group: "Manajemen" },
    { href: "/dashboard/admin/sertifikat-rekap", label: "Sertifikat & Nilai", icon: Award, group: "Manajemen" },
    { href: "/dashboard/admin/qr",          label: "Generate QR",        icon: QrCode, group: "Manajemen" },
    { href: "/dashboard/admin/izin",        label: "Data Izin",          icon: FileText, group: "Data" },
    { href: "/dashboard/admin/kegiatan-harian", label: "Data Kegiatan",  icon: NotebookPen, group: "Data" },
    { href: "/dashboard/admin/kalender",    label: "Kalender PKL",       icon: CalendarDays, group: "Data" },
    { href: "/dashboard/admin/broadcast",   label: "Broadcast",          icon: Megaphone, group: "Komunikasi" },
    { href: "/dashboard/admin/lokasi",      label: "Lokasi GPS",         icon: MapPin, group: "Laporan" },
    { href: "/dashboard/admin/export",      label: "Ekspor Data",        icon: Download, group: "Laporan" },
    { href: "/dashboard/admin/profile",     label: "Profil Saya",        icon: UserCircle, group: "Akun" },
    { href: "/dashboard/admin/settings",    label: "Pengaturan",         icon: Settings, group: "Akun" },
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
  root: [
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
  root: NAV.root.slice(4),
};