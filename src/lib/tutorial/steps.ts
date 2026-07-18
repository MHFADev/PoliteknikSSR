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
        description: "Panduan singkat ini akan mengajak kamu berkeliling semua fitur. Klik Lanjut untuk memulai, atau Lewati kapan saja.",
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
        title: "Sidebar — Navigasi Utama",
        description: "Seluruh halaman bisa diakses dari sini. Menu yang sedang aktif ditandai dengan warna biru.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa",
        pageLabel: "Dashboard",
        title: "Ringkasan Cepat",
        description: "Halaman utama menampilkan: total kehadiran bulan ini, izin pending, status kegiatan hari ini, pengumuman terbaru, dan kalender PKL.",
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
        description: "Halaman presensi harian — scan QR Code dari pembimbing untuk mencatat kehadiran.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        pageLabel: "Absensi QR",
        title: "Jam Real-Time & GPS",
        description: "Jam di pojok kanan atas berjalan real-time. Pastikan GPS aktif dan banner lokasi hijau sebelum scan.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        pageLabel: "Absensi QR",
        title: "Scan QR Code",
        description: "Tekan tombol Mulai Scan QR untuk mengaktifkan kamera. Arahkan ke QR Code dari pembimbing. Kehadiran langsung tercatat.",
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
        description: "Ajukan izin tidak masuk PKL karena sakit, keperluan mendesak, atau cuti.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/izin",
        pageLabel: "Pengajuan Izin",
        title: "Form & Riwayat",
        description: "Isi form: pilih jenis izin, tanggal, alasan, dan bukti. Riwayat dengan status Pending/Disetujui/Ditolak tampil di bawah.",
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
        description: "Catat seluruh aktivitas PKL harian. Pembimbing akan membaca, menilai, dan memberi feedback.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kegiatan-harian",
        pageLabel: "Kegiatan Harian",
        title: "Catat & Kirim",
        description: "Tulis kegiatan hari ini, upload foto jika ada. Nilai 0-100 dan feedback dari pembimbing muncul di riwayat.",
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
        description: "Lihat jadwal PKL, hari libur, dan event akademik dalam tampilan kalender interaktif.",
        placement: "right",
        expandMobileMore: true,
      },
      {
        navigateTo: "/dashboard/siswa/kalender",
        pageLabel: "Kalender",
        title: "Navigasi Kalender",
        description: "Geser antar bulan. Hari libur dan event ditandai warna berbeda. Status presensi bisa dicek per tanggal.",
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
        description: "Baca pengumuman resmi dari admin atau pembimbing. Selalu cek halaman ini secara berkala.",
        placement: "right",
        expandSidebar: true,
        expandMobileMore: true,
      },
      {
        navigateTo: "/dashboard/siswa/pengumuman",
        pageLabel: "Pengumuman",
        title: "Daftar Pengumuman",
        description: "Semua pengumuman diurutkan dari yang terbaru. Klik untuk baca detail lengkap.",
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
        expandSidebar: true,
        expandMobileMore: true,
      },
      {
        navigateTo: "/dashboard/siswa/profile",
        pageLabel: "Profil",
        title: "Data Diri & Pengaturan",
        description: "Lengkapi profil: nama, NIS, instansi PKL, kelas, foto profil. Bisa juga ganti password dari sini.",
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
        title: "Selamat Datang, Pembimbing!",
        description: "Panduan ini akan mengajak kamu berkeliling semua halaman bimbingan PKL. Klik Lanjut untuk memulai.",
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
        title: "Sidebar — Navigasi Utama",
        description: "Seluruh fitur bimbingan bisa diakses dari sidebar. Menu aktif ditandai warna biru.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing",
        pageLabel: "Dashboard",
        title: "Ringkasan Bimbingan",
        description: "Lihat jumlah siswa bimbingan, kehadiran hari ini, izin pending, dan grafik tren 7 hari terakhir.",
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
        description: "Tinjau dan setujui atau tolak pengajuan izin sakit dari siswa bimbinganmu.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/izin",
        pageLabel: "Persetujuan Izin",
        title: "Tinjau & Putuskan",
        description: "Semua pengajuan tampil berurutan dari yang terbaru. Klik untuk lihat detail lalu Setujui atau Tolak.",
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
        description: "Nilai dan beri feedback kegiatan harian siswa bimbinganmu.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/kegiatan-harian",
        pageLabel: "Penilaian Kegiatan",
        title: "Nilai & Feedback",
        description: "Pilih siswa, baca kegiatan yang dikirim, beri nilai 0-100 dan feedback. Kegiatan belum dinilai ditandai khusus.",
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
        description: "Buat QR Code presensi untuk absensi harian siswa bimbingan.",
        placement: "right",
        expandMobileMore: true,
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
        expandMobileMore: true,
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
        expandSidebar: true,
        expandMobileMore: true,
      },
      {
        navigateTo: "/dashboard/pembimbing/profile",
        pageLabel: "Profil",
        title: "Data Diri",
        description: "Lengkapi profil: nama, NIP/NIDN, foto. Cek Pengaturan untuk notifikasi.",
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
