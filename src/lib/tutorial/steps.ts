export type TutorialStep = {
  target?: string
  title: string
  description: string
  placement?: "top" | "bottom" | "left" | "right"
}

export const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  siswa: [
    {
      title: "Selamat Datang di PKL Dashboard!",
      description: "Panduan singkat ini akan membantu kamu mengenal fitur-fitur yang tersedia. Klik Next untuk melanjutkan.",
    },
    {
      target: "[data-tour='siswa-dashboard']",
      title: "Dashboard",
      description: "Lihat ringkasan kehadiran, pengumuman terbaru, dan kalender PKL dalam satu halaman.",
      placement: "right",
    },
    {
      target: "[data-tour='siswa-absensi']",
      title: "Absensi QR",
      description: "Scan QR code yang ditampilkan admin untuk mencatat kehadiran PKL hari ini. Pastikan GPS aktif.",
      placement: "right",
    },
    {
      target: "[data-tour='siswa-izin']",
      title: "Pengajuan Izin",
      description: "Ajukan izin, sakit, atau cuti. Status pengajuan bisa dipantau langsung dari sini.",
      placement: "right",
    },
    {
      target: "[data-tour='siswa-kegiatan']",
      title: "Kegiatan Harian",
      description: "Catat kegiatan PKL kamu setiap hari. Pembimbing akan memberikan penilaian dan feedback.",
      placement: "right",
    },
    {
      target: "[data-tour='siswa-kalender']",
      title: "Kalender",
      description: "Lihat jadwal PKL, hari libur, dan event akademik dalam tampilan kalender.",
      placement: "right",
    },
    {
      target: "[data-tour='siswa-pengumuman']",
      title: "Pengumuman",
      description: "Baca pengumuman terbaru dari admin atau pembimbing.",
      placement: "right",
    },
    {
      target: "[data-tour='siswa-profile']",
      title: "Profil & Pengaturan",
      description: "Kelola data diri, ubah password, dan atur preferensi notifikasi.",
      placement: "right",
    },
  ],
  pembimbing: [
    {
      title: "Selamat Datang di Dashboard Pembimbing!",
      description: "Panduan ini akan membantu kamu memahami fitur-fitur bimbingan PKL. Klik Next untuk memulai.",
    },
    {
      target: "[data-tour='pembimbing-dashboard']",
      title: "Dashboard",
      description: "Lihat ringkasan siswa bimbingan, kehadiran hari ini, dan grafik tren 7 hari.",
      placement: "right",
    },
    {
      target: "[data-tour='pembimbing-izin']",
      title: "Persetujuan Izin",
      description: "Setujui atau tolak pengajuan izin/sakit dari siswa bimbingan.",
      placement: "right",
    },
    {
      target: "[data-tour='pembimbing-kegiatan']",
      title: "Penilaian Kegiatan",
      description: "Nilai dan beri feedback pada kegiatan harian yang diisi siswa bimbingan.",
      placement: "right",
    },
    {
      target: "[data-tour='pembimbing-qr']",
      title: "Generate QR",
      description: "Buat QR code presensi yang akan di-scan siswa untuk absensi harian.",
      placement: "right",
    },
    {
      target: "[data-tour='pembimbing-sertifikat']",
      title: "Sertifikat & Nilai",
      description: "Kelola sertifikat PKL dan rekap nilai untuk siswa bimbingan.",
      placement: "right",
    },
    {
      target: "[data-tour='pembimbing-profile']",
      title: "Profil & Pengaturan",
      description: "Atur data diri dan preferensi notifikasi bimbingan.",
      placement: "right",
    },
  ],
}
