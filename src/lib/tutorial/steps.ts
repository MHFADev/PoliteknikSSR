export type TutorialStep = {
  navigateTo?: string
  target?: string
  title: string
  description: string
  placement?: "right" | "bottom"
  pageLabel?: string
  expandSidebar?: boolean
  expandMobileMore?: boolean
  waitFor?: string
}

type PageGroup = {
  label: string
  steps: TutorialStep[]
}

const SISWA_GROUPS: PageGroup[] = [
  {
    label: "Selamat Datang",
    steps: [
      {
        title: "Selamat Datang di PKL Dashboard!",
        description: "Panduan ini akan mengajak kamu berkeliling ke semua halaman. Setiap fitur akan dijelaskan satu per satu. Klik Next untuk memulai perjalanan.",
      },
    ],
  },
  {
    label: "Dashboard",
    steps: [
      {
        navigateTo: "/dashboard/siswa",
        target: "[data-tour='siswa-dashboard']",
        pageLabel: "Navigasi",
        title: "Sidebar — Menu Utama",
        description: "Sidebar adalah pusat navigasi. Setiap ikon mewakili halaman berbeda. Menu yang aktif akan menyala biru.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa",
        pageLabel: "Dashboard",
        title: "Ringkasan Dashboard",
        description: "Halaman ini menampilkan ringkasan: jumlah kehadiran bulan ini, pengajuan izin pending, status kegiatan hari ini, pengumuman terbaru, dan kalender PKL bulanan.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Absensi QR",
    steps: [
      {
        navigateTo: "/dashboard/siswa/absensi",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='siswa-absensi']",
        pageLabel: "Navigasi",
        title: "Menu Absensi QR",
        description: "Halaman untuk melakukan presensi harian. Scan QR Code yang ditampilkan admin atau pembimbing.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        pageLabel: "Absensi QR",
        title: "Jam & Lokasi",
        description: "Jam实时 menampilkan waktu saat ini. Pastikan GPS aktif dan banner lokasi menunjukkan hijau (terverifikasi) sebelum scan QR.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        target: "button",
        pageLabel: "Absensi QR",
        title: "Scan QR Code",
        description: "Tekan tombol 'Mulai Scan QR' untuk mengaktifkan kamera. Arahkan ke QR Code yang ditampilkan admin. Setelah ter-scan, kehadiran langsung tercatat.",
        placement: "bottom",
        waitFor: "button",
      },
    ],
  },
  {
    label: "Pengajuan Izin",
    steps: [
      {
        navigateTo: "/dashboard/siswa/izin",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='siswa-izin']",
        pageLabel: "Navigasi",
        title: "Menu Pengajuan Izin",
        description: "Ajukan izin tidak masuk PKL karena sakit, keperluan, atau cuti.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/izin",
        pageLabel: "Pengajuan Izin",
        title: "Form & Riwayat",
        description: "Isi form pengajuan: jenis izin, tanggal, alasan, dan bukti pendukung. Riwayat pengajuan tampil di bawah dengan status (Pending/Disetujui/Ditolak).",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Kegiatan Harian",
    steps: [
      {
        navigateTo: "/dashboard/siswa/kegiatan-harian",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='siswa-kegiatan']",
        pageLabel: "Navigasi",
        title: "Menu Kegiatan Harian",
        description: "Catat kegiatan PKL setiap hari. Pembimbing akan membaca, menilai, dan memberi feedback.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kegiatan-harian",
        pageLabel: "Kegiatan Harian",
        title: "Catat Kegiatan",
        description: "Tulis kegiatan hari ini, upload foto dokumentasi. Pembimbing akan memberi nilai 0-100 dan feedback. Cek riwayat untuk melihat penilaian sebelumnya.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Kalender",
    steps: [
      {
        navigateTo: "/dashboard/siswa/kalender",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='siswa-kalender']",
        pageLabel: "Navigasi",
        title: "Menu Kalender",
        description: "Lihat jadwal PKL, hari libur, dan event akademik dalam tampilan kalender bulanan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kalender",
        pageLabel: "Kalender",
        title: "Kalender Akademik",
        description: "Navigasi antar bulan. Hari libur dan event ditandai dengan warna berbeda. Status presensi juga bisa dicek per tanggal.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Pengumuman",
    steps: [
      {
        navigateTo: "/dashboard/siswa/pengumuman",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='siswa-pengumuman']",
        pageLabel: "Navigasi",
        title: "Menu Pengumuman",
        description: "Baca pengumuman resmi dari admin atau pembimbing.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/pengumuman",
        pageLabel: "Pengumuman",
        title: "Daftar Pengumuman",
        description: "Semua pengumuman diurutkan dari yang terbaru. Klik untuk membaca detail.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Profil",
    steps: [
      {
        navigateTo: "/dashboard/siswa/profile",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='siswa-profile']",
        pageLabel: "Navigasi",
        title: "Menu Profil",
        description: "Kelola data diri dan informasi akun kamu.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/profile",
        pageLabel: "Profil",
        title: "Data Diri",
        description: "Lengkapi profil: nama, NIS, instansi PKL, kelas, foto profil. Ganti password jika perlu.",
        placement: "bottom",
      },
    ],
  },
]

const PEMBIMBING_GROUPS: PageGroup[] = [
  {
    label: "Selamat Datang",
    steps: [
      {
        title: "Selamat Datang di Dashboard Pembimbing!",
        description: "Panduan ini akan mengajak kamu berkeliling ke semua halaman bimbingan PKL. Klik Next untuk memulai.",
      },
    ],
  },
  {
    label: "Dashboard",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing",
        target: "[data-tour='pembimbing-dashboard']",
        pageLabel: "Navigasi",
        title: "Sidebar — Menu Utama",
        description: "Sidebar adalah pusat navigasi pembimbing. Setiap ikon mewakili halaman berbeda untuk mengelola siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing",
        pageLabel: "Dashboard",
        title: "Ringkasan Bimbingan",
        description: "Lihat jumlah siswa bimbingan, kehadiran hari ini, izin pending, dan grafik tren 7 hari.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Persetujuan Izin",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/izin",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='pembimbing-izin']",
        pageLabel: "Navigasi",
        title: "Menu Persetujuan Izin",
        description: "Setujui atau tolak pengajuan izin/sakit dari siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/izin",
        pageLabel: "Persetujuan Izin",
        title: "Daftar Pengajuan",
        description: "Semua pengajuan izin tampil berurutan. Klik untuk detail, pilih Setujui atau Tolak.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Penilaian Kegiatan",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/kegiatan-harian",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='pembimbing-kegiatan']",
        pageLabel: "Navigasi",
        title: "Menu Penilaian Kegiatan",
        description: "Nilai dan beri feedback pada kegiatan harian siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/kegiatan-harian",
        pageLabel: "Penilaian Kegiatan",
        title: "Penilaian & Feedback",
        description: "Pilih siswa, baca kegiatannya, beri nilai 0-100 dan feedback. Kegiatan yang belum dinilai ditandai.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Generate QR",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/qr",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='pembimbing-qr']",
        pageLabel: "Navigasi",
        title: "Menu Generate QR",
        description: "Buat QR Code presensi yang akan di-scan siswa untuk absensi harian.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/qr",
        pageLabel: "Generate QR",
        title: "Buat Sesi Presensi",
        description: "Tekan 'Generate QR' untuk membuat sesi baru. Atur jam batas telat & durasi QR. Tampilkan QR di layar/proyektor agar siswa bisa scan.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Sertifikat & Nilai",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='pembimbing-sertifikat']",
        pageLabel: "Navigasi",
        title: "Menu Sertifikat & Nilai",
        description: "Kirim sertifikat PKL dan rekap penilaian prakerin ke siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
        pageLabel: "Sertifikat & Nilai",
        title: "Upload & Kelola",
        description: "Upload sertifikat (PDF/Gambar) dan rekap nilai prakerin. Siswa bisa melihat dan mendownload dari dashboard mereka.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Profil",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/profile",
        expandSidebar: true,
        expandMobileMore: true,
        target: "[data-tour='pembimbing-profile']",
        pageLabel: "Navigasi",
        title: "Menu Profil",
        description: "Atur data diri dan preferensi akun pembimbing.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/profile",
        pageLabel: "Profil",
        title: "Data Diri",
        description: "Lengkapi profil: nama, NIP/NIDN, foto. Cek Pengaturan untuk notifikasi agar tidak ketinggalan pengajuan izin baru.",
        placement: "bottom",
      },
    ],
  },
]

function flatten(groups: PageGroup[]): TutorialStep[] {
  return groups.flatMap((g) => g.steps)
}

export const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  siswa: flatten(SISWA_GROUPS),
  pembimbing: flatten(PEMBIMBING_GROUPS),
}

export const TUTORIAL_GROUPS: Record<string, PageGroup[]> = {
  siswa: SISWA_GROUPS,
  pembimbing: PEMBIMBING_GROUPS,
}
