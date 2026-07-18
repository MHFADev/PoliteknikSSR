export type TutorialStep = {
  navigateTo?: string
  target?: string
  title: string
  description: string
  placement?: "top" | "bottom" | "left" | "right"
  expandSidebar?: boolean
  expandMobileMore?: boolean
  waitFor?: string
}

const SISWA_STEPS: TutorialStep[] = [
  // ── Welcome ──
  {
    title: "Selamat Datang di PKL Dashboard!",
    description: "Panduan ini akan menjelaskan setiap halaman dan fitur yang tersedia. Kita akan berkeliling ke semua halaman agar kamu paham fungsinya masing-masing. Klik Next untuk memulai.",
  },

  // ── Dashboard ──
  {
    navigateTo: "/dashboard/siswa",
    target: "[data-tour='siswa-dashboard']",
    title: "Navigasi Sidebar",
    description: "Sidebar ini adalah menu utama. Setiap ikon mewakili halaman berbeda. Klik untuk berpindah. Aktif saat ini: Dashboard.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/siswa",
    target: "main .gap-4",
    title: "Ringkasan Dashboard",
    description: "Tiga kartu ini menunjukkan statistik penting: jumlah Hadir bulan ini, Izin yang masih pending, dan status Kegiatan Hari ini. Pantau terus agar tidak ada yang terlewat.",
    placement: "bottom",
    waitFor: ".gap-4",
  },

  // ── Absensi QR ──
  {
    navigateTo: "/dashboard/siswa/absensi",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='siswa-absensi']",
    title: "Menu Absensi QR",
    description: "Halaman untuk scan QR code presensi. Pastikan GPS aktif dan kamu berada di area yang diizinkan.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/siswa/absensi",
    target: "[class*='gpsBanner']",
    title: "Status Lokasi GPS",
    description: "Banner ini menunjukkan status verifikasi lokasi kamu. Pastikan lokasi terverifikasi (hijau) sebelum scan QR. Jika merah, periksa GPS dan coba lagi.",
    placement: "bottom",
  },
  {
    navigateTo: "/dashboard/siswa/absensi",
    target: "[class*='scannerWrapper']",
    title: "Scanner QR",
    description: "Tekan tombol 'Mulai Scan QR' untuk mengaktifkan kamera. Arahkan ke QR code yang ditampilkan admin/pembimbing. Setelah ter-scan, status kehadiran akan langsung tercatat.",
    placement: "bottom",
    waitFor: "button",
  },

  // ── Pengajuan Izin ──
  {
    navigateTo: "/dashboard/siswa/izin",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='siswa-izin']",
    title: "Menu Pengajuan Izin",
    description: "Halaman untuk mengajukan izin, sakit, atau cuti. Isi form dan tunggu persetujuan pembimbing.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/siswa/izin",
    target: "form, [class*='card']",
    title: "Form & Riwayat Izin",
    description: "Form di atas untuk pengajuan baru (pilih jenis, tanggal, alasan). Riwayat di bawah menampilkan semua pengajuan dan statusnya (Pending/Disetujui/Ditolak).",
    placement: "bottom",
  },

  // ── Kegiatan Harian ──
  {
    navigateTo: "/dashboard/siswa/kegiatan-harian",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='siswa-kegiatan']",
    title: "Menu Kegiatan Harian",
    description: "Catat kegiatan PKL kamu setiap hari di sini. Pembimbing akan membaca, memberi nilai, dan feedback.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/siswa/kegiatan-harian",
    target: "form, textarea",
    title: "Form Kegiatan",
    description: "Tulis kegiatan yang kamu lakukan hari ini. Semakin detail semakin baik. Pembimbing akan menilai dan memberikan feedback.",
    placement: "bottom",
  },

  // ── Kalender ──
  {
    navigateTo: "/dashboard/siswa/kalender",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='siswa-kalender']",
    title: "Menu Kalender",
    description: "Lihat jadwal PKL, hari libur, dan event akademik dalam tampilan kalender.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/siswa/kalender",
    target: "[class*='calendar'], [class*='Calendar']",
    title: "Kalender PKL",
    description: "Navigasi antar bulan. Hari libur ditandai, event ditampilkan, dan status presensi kamu bisa dilihat per tanggal.",
    placement: "bottom",
  },

  // ── Pengumuman ──
  {
    navigateTo: "/dashboard/siswa/pengumuman",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='siswa-pengumuman']",
    title: "Menu Pengumuman",
    description: "Baca pengumuman terbaru dari admin atau pembimbing di sini.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/siswa/pengumuman",
    target: "main",
    title: "Daftar Pengumuman",
    description: "Semua pengumuman tampil berurutan dari yang terbaru. Klik untuk membaca detail.",
    placement: "bottom",
  },

  // ── Profile ──
  {
    navigateTo: "/dashboard/siswa/profile",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='siswa-profile']",
    title: "Menu Profil",
    description: "Halaman untuk mengelola data diri dan informasi akun kamu.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/siswa/profile",
    target: "form, [class*='profile']",
    title: "Data Diri",
    description: "Lengkapi profil kamu: nama, NIS, instansi PKL, dan kelas. Bisa juga upload foto profil dan ganti password.",
    placement: "bottom",
  },
]

const PEMBIMBING_STEPS: TutorialStep[] = [
  // ── Welcome ──
  {
    title: "Selamat Datang di Dashboard Pembimbing!",
    description: "Panduan ini akan menjelaskan semua fitur bimbingan PKL. Kita akan keliling ke setiap halaman. Klik Next untuk memulai.",
  },

  // ── Dashboard ──
  {
    navigateTo: "/dashboard/pembimbing",
    target: "[data-tour='pembimbing-dashboard']",
    title: "Navigasi Sidebar",
    description: "Sidebar menu utama pembimbing. Setiap ikon mewakili halaman berbeda untuk mengelola siswa bimbingan.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/pembimbing",
    target: "main",
    title: "Ringkasan Bimbingan",
    description: "Lihat jumlah siswa bimbingan, kehadiran hari ini, izin pending, dan grafik tren 7 hari. Pantau semuanya dari sini.",
    placement: "bottom",
  },

  // ── Persetujuan Izin ──
  {
    navigateTo: "/dashboard/pembimbing/izin",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='pembimbing-izin']",
    title: "Menu Persetujuan Izin",
    description: "Setujui atau tolak pengajuan izin/sakit dari siswa bimbingan.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/pembimbing/izin",
    target: "main",
    title: "Daftar Pengajuan",
    description: "Semua pengajuan izin siswa tampil di sini. Klik untuk melihat detail dan memberikan keputusan (Setujui / Tolak).",
    placement: "bottom",
  },

  // ── Penilaian Kegiatan ──
  {
    navigateTo: "/dashboard/pembimbing/kegiatan-harian",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='pembimbing-kegiatan']",
    title: "Menu Penilaian Kegiatan",
    description: "Nilai dan beri feedback pada kegiatan harian yang diisi siswa bimbingan.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/pembimbing/kegiatan-harian",
    target: "main",
    title: "Daftar Kegiatan Siswa",
    description: "Pilih siswa, lihat kegiatan harian mereka, beri nilai 0-100 dan feedback. Kegiatan yang belum dinilai akan ditandai.",
    placement: "bottom",
  },

  // ── Generate QR ──
  {
    navigateTo: "/dashboard/pembimbing/qr",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='pembimbing-qr']",
    title: "Menu Generate QR",
    description: "Buat QR code presensi yang akan di-scan siswa untuk absensi harian. Tampilkan QR di layar atau proyektor.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/pembimbing/qr",
    target: "main",
    title: "QR Presensi",
    description: "Tekan 'Generate QR' untuk membuat sesi baru. QR otomatis kadaluarsa sesuai pengaturan. Atur jam batas telat dan durasi QR di panel pengaturan.",
    placement: "bottom",
  },

  // ── Sertifikat & Nilai ──
  {
    navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='pembimbing-sertifikat']",
    title: "Menu Sertifikat & Nilai",
    description: "Kelola sertifikat PKL dan rekap nilai akhir untuk siswa bimbingan.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
    target: "main",
    title: "Daftar Sertifikat",
    description: "Upload sertifikat PKL dan rekap nilai per siswa. Siswa bisa melihat dan mendownload dokumen dari dashboard mereka.",
    placement: "bottom",
  },

  // ── Profile ──
  {
    navigateTo: "/dashboard/pembimbing/profile",
    expandSidebar: true,
    expandMobileMore: true,
    target: "[data-tour='pembimbing-profile']",
    title: "Menu Profil",
    description: "Atur data diri dan preferensi notifikasi bimbingan.",
    placement: "right",
  },
  {
    navigateTo: "/dashboard/pembimbing/profile",
    target: "form, main",
    title: "Data Diri",
    description: "Lengkapi profil: nama, NIP/NIDN, upload foto. Jangan lupa cek pengaturan notifikasi agar tidak ketinggalan pengajuan izin baru.",
    placement: "bottom",
  },
]

export const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  siswa: SISWA_STEPS,
  pembimbing: PEMBIMBING_STEPS,
}
