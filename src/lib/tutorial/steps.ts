export type TutorialStep = {
  navigateTo?: string
  target?: string
  title: string
  description: string
  placement?: "top" | "bottom" | "left" | "right"
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
        description: "Panduan interaktif ini akan mengajak kamu berkeliling ke semua halaman. Setiap fitur akan dijelaskan satu per satu. Klik Next untuk memulai perjalanan.",
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
        description: "Sidebar ini adalah pusat navigasi. Setiap ikon mewakili halaman berbeda. Saat ini kamu ada di halaman Dashboard, menu yang aktif akan menyala biru.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa",
        target: "a[href='/dashboard/siswa/absensi']",
        pageLabel: "Dashboard",
        title: "Status & Statistik",
        description: "Di sini kamu bisa melihat ringkasan penting: jumlah kehadiran bulan ini, pengajuan izin yang pending, dan status kegiatan harian.",
        placement: "bottom",
        waitFor: "a[href='/dashboard/siswa/absensi']",
      },
      {
        navigateTo: "/dashboard/siswa",
        target: "[class*='MentorSelector']",
        pageLabel: "Dashboard",
        title: "Pilih Pembimbing",
        description: "Jika belum punya pembimbing, kamu bisa memilihnya di sini. Pembimbing akan memantau kegiatan PKL dan menyetujui izin kamu.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa",
        target: "[class*='card']:nth-child(3)",
        pageLabel: "Dashboard",
        title: "Aktivitas Terbaru",
        description: "Kartu ini menampilkan event mendatang dan kegiatan terbaru kamu. Pantau terus agar tidak ketinggalan informasi.",
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
        description: "Halaman ini digunakan untuk melakukan presensi harian dengan scan QR Code.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        target: "[class*='gps']",
        pageLabel: "Absensi QR",
        title: "Verifikasi Lokasi GPS",
        description: "Sebelum scan QR, pastikan GPS kamu aktif. Banner ini akan menunjukkan status lokasi. Jika hijau, kamu berada di area yang diizinkan dan siap scan.",
        placement: "bottom",
        waitFor: "[class*='gps']",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        target: "[class*='scanner']",
        pageLabel: "Absensi QR",
        title: "Scan QR Code",
        description: "Tekan tombol 'Mulai Scan QR' untuk membuka kamera. Arahkan kamera ke QR Code yang ditampilkan admin atau pembimbing. Begitu ter-scan, kehadiran kamu langsung tercatat otomatis.",
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
        description: "Halaman untuk mengajukan izin tidak masuk PKL karena sakit, keperluan, atau cuti.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/izin",
        target: "form",
        pageLabel: "Pengajuan Izin",
        title: "Form Pengajuan",
        description: "Isi jenis izin (Izin/Sakit/Cuti), tanggal mulai dan selesai, serta alasan. Sertakan bukti pendukung jika perlu, lalu klik Ajukan.",
        placement: "bottom",
        waitFor: "form",
      },
      {
        navigateTo: "/dashboard/siswa/izin",
        target: "table, [class*='list'], [class*='card']:nth-child(2)",
        pageLabel: "Pengajuan Izin",
        title: "Riwayat Pengajuan",
        description: "Semua pengajuan kamu tampil di sini beserta statusnya: Menunggu, Disetujui, atau Ditolak. Pantau terus sampai ada keputusan dari pembimbing.",
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
        description: "Catat kegiatan PKL kamu setiap hari. Pembimbing akan membaca dan memberikan penilaian.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kegiatan-harian",
        target: "form, textarea",
        pageLabel: "Kegiatan Harian",
        title: "Tulis Kegiatan",
        description: "Ceritakan apa yang kamu kerjakan hari ini. Semakin detail semakin baik. Kamu juga bisa upload foto dokumentasi kegiatan.",
        placement: "bottom",
        waitFor: "textarea",
      },
      {
        navigateTo: "/dashboard/siswa/kegiatan-harian",
        target: "[class*='card']:nth-child(2), [class*='list']",
        pageLabel: "Kegiatan Harian",
        title: "Riwayat & Nilai",
        description: "Lihat kegiatan hari-hari sebelumnya. Pembimbing akan memberi nilai 0-100 dan feedback tulisan tangan. Manfaatkan feedback untuk meningkatkan kualitas kegiatan.",
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
        description: "Lihat jadwal PKL, hari libur nasional, dan event akademik dalam satu tampilan kalender.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kalender",
        target: "main",
        pageLabel: "Kalender",
        title: "Kalender Akademik",
        description: "Navigasi antar bulan. Tanggal dengan warna berbeda menandakan event atau hari libur. Status presensi kamu juga bisa dicek per tanggal.",
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
        description: "Baca pengumuman resmi dari admin dan pembimbing di sini.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/pengumuman",
        target: "main",
        pageLabel: "Pengumuman",
        title: "Daftar Pengumuman",
        description: "Semua pengumuman diurutkan dari yang terbaru. Klik untuk membaca detail isi pengumuman.",
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
        target: "form",
        pageLabel: "Profil",
        title: "Data Diri",
        description: "Lengkapi profil kamu: nama lengkap, NIS/NIM, instansi PKL, dan kelas. Upload foto profil agar dikenali pembimbing. Ganti password jika perlu.",
        placement: "bottom",
        waitFor: "form",
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
        description: "Panduan interaktif ini akan mengajak kamu berkeliling ke semua halaman bimbingan PKL. Setiap fitur akan dijelaskan agar kamu siap membimbing siswa. Klik Next untuk memulai.",
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
        description: "Sidebar ini adalah pusat navigasi pembimbing. Setiap ikon mewakili halaman berbeda untuk mengelola siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing",
        target: "main",
        pageLabel: "Dashboard",
        title: "Ringkasan Bimbingan",
        description: "Dashboard ini menampilkan jumlah siswa bimbingan, kehadiran hari ini, pengajuan izin pending, dan grafik tren 7 hari. Pantau semua dari sini.",
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
        description: "Halaman untuk menyetujui atau menolak pengajuan izin/sakit dari siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/izin",
        target: "main",
        pageLabel: "Persetujuan Izin",
        title: "Daftar & Aksi",
        description: "Semua pengajuan izin siswa tampil berurutan. Klik untuk lihat detail, lalu pilih Setujui atau Tolak. Berikan catatan jika perlu.",
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
        target: "main",
        pageLabel: "Penilaian Kegiatan",
        title: "Penilaian & Feedback",
        description: "Pilih siswa, baca kegiatan hariannya, beri nilai 0-100 dan feedback. Kegiatan yang belum dinilai akan ditandai agar tidak terlewat.",
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
        target: "main",
        pageLabel: "Generate QR",
        title: "Buat Sesi Presensi",
        description: "Tekan 'Generate QR' untuk membuat sesi baru. Atur jam batas telat dan durasi QR. Tampilkan QR ini di layar atau proyektor agar siswa bisa scan.",
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
        description: "Kelola sertifikat PKL dan rekap nilai akhir untuk siswa bimbingan.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
        target: "main",
        pageLabel: "Sertifikat & Nilai",
        title: "Upload & Kelola",
        description: "Upload sertifikat PKL dan rekap nilai per siswa. Siswa bisa melihat dan mendownload dokumen dari dashboard mereka masing-masing.",
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
        target: "form, main",
        pageLabel: "Profil",
        title: "Data Diri & Notifikasi",
        description: "Lengkapi profil: nama, NIP/NIDN, upload foto. Jangan lupa atur notifikasi di menu Pengaturan agar tidak ketinggalan pengajuan izin baru dari siswa.",
        placement: "bottom",
        waitFor: "form",
      },
    ],
  },
]

function flattenGroups(groups: PageGroup[]): TutorialStep[] {
  return groups.flatMap((g) => g.steps)
}

export const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  siswa: flattenGroups(SISWA_GROUPS),
  pembimbing: flattenGroups(PEMBIMBING_GROUPS),
}

export const TUTORIAL_GROUPS: Record<string, PageGroup[]> = {
  siswa: SISWA_GROUPS,
  pembimbing: PEMBIMBING_GROUPS,
}
