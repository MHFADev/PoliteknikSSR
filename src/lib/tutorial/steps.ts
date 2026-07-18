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
        description: "Panduan ini akan mengajak kamu berkeliling ke semua halaman. Setiap fitur dijelaskan satu per satu. Klik Next untuk memulai.",
      },
    ],
  },
  {
    label: "Dashboard",
    steps: [
      {
        navigateTo: "/dashboard/siswa",
        target: "a[href='/dashboard/siswa']",
        pageLabel: "Dashboard",
        title: "Sidebar — Menu Utama",
        description: "Sidebar adalah navigasi utama setiap ikon mewakili halaman berbeda. Menu yang aktif menyala biru.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa",
        pageLabel: "Dashboard",
        title: "Ringkasan Dashboard",
        description: "Halaman ini menampilkan ringkasan: jumlah kehadiran bulan ini, pengajuan izin pending, status kegiatan hari ini, pengumuman terbaru, dan kalender PKL.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Absensi QR",
    steps: [
      {
        navigateTo: "/dashboard/siswa/absensi",
        target: "a[href='/dashboard/siswa/absensi']",
        pageLabel: "Absensi QR",
        title: "Menu Absensi QR",
        description: "Halaman untuk melakukan presensi harian dengan scan QR Code.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        pageLabel: "Absensi QR",
        title: "Jam & Lokasi GPS",
        description: "Jam real-time menampilkan waktu saat ini. Pastikan GPS aktif dan banner lokasi hijau sebelum scan. Kalau merah periksa GPS dan coba lagi.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        pageLabel: "Absensi QR",
        title: "Scan QR Code",
        description: "Tekan tombol Mulai Scan QR untuk mengaktifkan kamera. Arahkan ke QR Code dari admin. Setelah ter-scan kehadiran langsung tercatat.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Pengajuan Izin",
    steps: [
      {
        navigateTo: "/dashboard/siswa/izin",
        target: "a[href='/dashboard/siswa/izin']",
        pageLabel: "Pengajuan Izin",
        title: "Menu Pengajuan Izin",
        description: "Ajukan izin tidak masuk PKL karena sakit keperluan atau cuti.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/izin",
        pageLabel: "Pengajuan Izin",
        title: "Form & Riwayat",
        description: "Isi form: jenis izin tanggal alasan dan bukti. Riwayat pengajuan tampil di bawah dengan status Pending Disetujui atau Ditolak.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Kegiatan Harian",
    steps: [
      {
        navigateTo: "/dashboard/siswa/kegiatan-harian",
        target: "a[href='/dashboard/siswa/kegiatan-harian']",
        pageLabel: "Kegiatan Harian",
        title: "Menu Kegiatan Harian",
        description: "Catat kegiatan PKL setiap hari. Pembimbing membaca menilai dan memberi feedback.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kegiatan-harian",
        pageLabel: "Kegiatan Harian",
        title: "Catat & Kirim",
        description: "Tulis kegiatan hari ini upload foto jika ada. Pembimbing memberi nilai 0-100 dan feedback. Cek riwayat untuk lihat penilaian sebelumnya.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Kalender",
    steps: [
      {
        navigateTo: "/dashboard/siswa/kalender",
        target: "a[href='/dashboard/siswa/kalender']",
        pageLabel: "Kalender",
        title: "Menu Kalender",
        description: "Lihat jadwal PKL hari libur dan event akademik dalam tampilan kalender.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kalender",
        pageLabel: "Kalender",
        title: "Kalender Akademik",
        description: "Navigasi antar bulan. Hari libur dan event ditandai warna berbeda. Status presensi bisa dicek per tanggal.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Pengumuman",
    steps: [
      {
        navigateTo: "/dashboard/siswa/pengumuman",
        target: "a[href='/dashboard/siswa/pengumuman']",
        pageLabel: "Pengumuman",
        title: "Menu Pengumuman",
        description: "Baca pengumuman resmi dari admin atau pembimbing.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/pengumuman",
        pageLabel: "Pengumuman",
        title: "Daftar Pengumuman",
        description: "Semua pengumuman diurutkan dari terbaru. Klik untuk baca detail.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Profil",
    steps: [
      {
        navigateTo: "/dashboard/siswa/profile",
        target: "a[href='/dashboard/siswa/profile']",
        pageLabel: "Profil",
        title: "Menu Profil",
        description: "Kelola data diri dan informasi akun kamu.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/profile",
        pageLabel: "Profil",
        title: "Data Diri",
        description: "Lengkapi profil: nama NIS instansi PKL kelas foto profil. Ganti password jika perlu.",
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
        description: "Panduan ini akan mengajak kamu berkeliling semua halaman bimbingan PKL. Klik Next untuk memulai.",
      },
    ],
  },
  {
    label: "Dashboard",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing",
        target: "a[href='/dashboard/pembimbing']",
        pageLabel: "Dashboard",
        title: "Sidebar — Menu Utama",
        description: "Sidebar navigasi pembimbing. Setiap ikon untuk mengelola siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing",
        pageLabel: "Dashboard",
        title: "Ringkasan Bimbingan",
        description: "Lihat jumlah siswa bimbingan kehadiran hari ini izin pending dan grafik tren 7 hari.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Persetujuan Izin",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/izin",
        target: "a[href='/dashboard/pembimbing/izin']",
        pageLabel: "Persetujuan Izin",
        title: "Menu Persetujuan Izin",
        description: "Setujui atau tolak pengajuan izin sakit dari siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/izin",
        pageLabel: "Persetujuan Izin",
        title: "Daftar & Aksi",
        description: "Semua pengajuan tampil berurutan. Klik untuk detail lalu Setujui atau Tolak.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Penilaian Kegiatan",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/kegiatan-harian",
        target: "a[href='/dashboard/pembimbing/kegiatan-harian']",
        pageLabel: "Penilaian Kegiatan",
        title: "Menu Penilaian Kegiatan",
        description: "Nilai dan beri feedback kegiatan harian siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/kegiatan-harian",
        pageLabel: "Penilaian Kegiatan",
        title: "Nilai & Feedback",
        description: "Pilih siswa baca kegiatan beri nilai 0-100 dan feedback. Kegiatan belum dinilai ditandai.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Generate QR",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/qr",
        target: "a[href='/dashboard/pembimbing/qr']",
        pageLabel: "Generate QR",
        title: "Menu Generate QR",
        description: "Buat QR Code presensi untuk absensi harian siswa.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/qr",
        pageLabel: "Generate QR",
        title: "Buat Sesi Presensi",
        description: "Tekan Generate QR untuk sesi baru. Atur jam batas telat dan durasi. Tampilkan QR di layar agar siswa bisa scan.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Sertifikat & Nilai",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
        target: "a[href='/dashboard/pembimbing/sertifikat-rekap']",
        pageLabel: "Sertifikat & Nilai",
        title: "Menu Sertifikat & Nilai",
        description: "Kirim sertifikat PKL dan rekap penilaian prakerin ke siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
        pageLabel: "Sertifikat & Nilai",
        title: "Upload & Kirim",
        description: "Upload sertifikat PDF/Gambar dan rekap nilai prakerin. Siswa bisa lihat dan download dari dashboard mereka.",
        placement: "bottom",
      },
    ],
  },
  {
    label: "Profil",
    steps: [
      {
        navigateTo: "/dashboard/pembimbing/profile",
        target: "a[href='/dashboard/pembimbing/profile']",
        pageLabel: "Profil",
        title: "Menu Profil",
        description: "Atur data diri dan preferensi akun pembimbing.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/profile",
        pageLabel: "Profil",
        title: "Data Diri",
        description: "Lengkapi profil: nama NIP/NIDN foto. Cek Pengaturan untuk notifikasi.",
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
