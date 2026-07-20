export type TutorialStep = {
  navigateTo?: string
  target?: string
  title: string
  description: string
  placement?: "right" | "bottom" | "left" | "top"
  pageLabel?: string
  expandSidebar?: boolean
  expandMobileMore?: boolean
  waitFor?: string
}

type PageGroup = {
  label: string
  steps: TutorialStep[]
}

// ============================================================
// SISWA
// ============================================================
// Setiap halaman dipecah jadi beberapa langkah: 1 langkah untuk
// menunjukkan menu di sidebar, lalu beberapa langkah lanjutan yang
// masing-masing meng-highlight SATU bagian nyata di halaman itu
// (seperti tutorial game) — bukan cuma satu kartu teks generik.
// ============================================================

const SISWA_GROUPS: PageGroup[] = [
  {
    label: "Selamat Datang",
    steps: [
      {
        title: "Selamat Datang di PKL Dashboard!",
        description: "Panduan singkat ini akan mengajak kamu berkeliling semua fitur, halaman per halaman. Tiap bagian penting akan disorot langsung di layar. Klik Lanjut untuk memulai, atau Lewati kapan saja.",
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
        title: "Menu Dashboard",
        description: "Ini halaman utama kamu. Sidebar di sini berisi semua menu — menu yang sedang aktif ditandai warna biru.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa",
        target: "[data-tour='dash-reminder']",
        waitFor: "[data-tour='dash-stats']",
        pageLabel: "Dashboard",
        title: "Pengingat Kegiatan Harian",
        description: "Kalau muncul, kartu ini mengingatkan kamu untuk mengisi kegiatan hari ini. Tekan \"Isi Sekarang\" untuk langsung menuju form logbook.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa",
        target: "[data-tour='dash-stats']",
        pageLabel: "Dashboard",
        title: "Ringkasan Statistik",
        description: "Tiga angka penting: total hadir bulan ini, izin yang masih pending, dan status kegiatan hari ini (sudah/belum diisi).",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa",
        target: "[data-tour='dash-mentor']",
        pageLabel: "Dashboard",
        title: "Pilih Pembimbing",
        description: "Pilih pembimbing PKL kamu di sini jika belum ditentukan. Pembimbing inilah yang akan menilai kegiatan dan menyetujui izin kamu.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa",
        target: "[data-tour='dash-activity']",
        pageLabel: "Dashboard",
        title: "Aktivitas Terbaru",
        description: "Gabungan event mendatang dan riwayat kegiatan harian kamu, diurutkan dari yang terbaru. Badge di kanan menunjukkan jenis atau nilai.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa",
        target: "[data-tour='dash-calendar']",
        pageLabel: "Dashboard",
        title: "Kalender Ringkas",
        description: "Cuplikan kalender PKL kamu. Untuk tampilan lengkap dengan filter dan statistik, buka menu Kalender di sidebar.",
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
        target: "[data-tour='absensi-clock']",
        pageLabel: "Absensi QR",
        title: "Jam Real-Time",
        description: "Jam ini berjalan real-time mengikuti waktu WIB, jadi kamu bisa memastikan kamu scan tepat waktu sebelum batas telat.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        target: "[data-tour='absensi-gps']",
        pageLabel: "Absensi QR",
        title: "Status Lokasi GPS",
        description: "Banner ini menunjukkan status verifikasi lokasi kamu. Pastikan berwarna hijau (lokasi terverifikasi) sebelum memulai scan.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa/absensi",
        target: "[data-tour='absensi-scan']",
        pageLabel: "Absensi QR",
        title: "Scan QR Code",
        description: "Tekan tombol Mulai Scan QR untuk mengaktifkan kamera, lalu arahkan ke QR Code yang ditampilkan pembimbing. Kehadiran langsung tercatat otomatis.",
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
        target: "[data-tour='izin-form']",
        pageLabel: "Pengajuan Izin",
        title: "Form Pengajuan",
        description: "Pilih jenis izin (Izin/Sakit/Cuti), tanggal mulai–selesai, tulis alasan, dan lampirkan bukti pendukung (surat dokter, dll) jika ada.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/izin",
        target: "[data-tour='izin-history']",
        pageLabel: "Pengajuan Izin",
        title: "Riwayat Pengajuan",
        description: "Semua pengajuan izin kamu tampil di sini lengkap dengan statusnya: Pending (menunggu), Disetujui, atau Ditolak beserta catatan dari pembimbing.",
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
        target: "[data-tour='logbook-form']",
        pageLabel: "Kegiatan Harian",
        title: "Catat Kegiatan Hari Ini",
        description: "Tulis aktivitas PKL kamu hari ini, dan upload foto sebagai bukti kalau perlu. Isi setiap hari sebelum batas waktu.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kegiatan-harian",
        target: "[data-tour='logbook-history']",
        pageLabel: "Kegiatan Harian",
        title: "Riwayat & Penilaian",
        description: "Riwayat kegiatan yang sudah kamu catat. Nilai 0-100 dan feedback dari pembimbing akan muncul di sini setelah dinilai.",
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
        target: "[data-tour='kalender-stats']",
        pageLabel: "Kalender",
        title: "Statistik Kehadiran",
        description: "Rekap jumlah Hadir, Sakit, Izin, dan Alfa bulan ini, lengkap dengan progress bar perbandingannya.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/siswa/kalender",
        target: "[data-tour='kalender-grid']",
        pageLabel: "Kalender",
        title: "Navigasi Kalender",
        description: "Geser antar bulan pakai tombol panah. Setiap tanggal diberi warna sesuai status presensi — lihat legenda warna di bawah kalender.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/kalender",
        target: "[data-tour='kalender-events']",
        pageLabel: "Kalender",
        title: "Event Mendatang",
        description: "Daftar hari libur dan event akademik terdekat, lengkap dengan hitung mundur harinya.",
        placement: "left",
      },
      {
        navigateTo: "/dashboard/siswa/kalender",
        target: "[data-tour='kalender-summary']",
        pageLabel: "Kalender",
        title: "Ringkasan Bulan",
        description: "Total hari efektif, hari libur, total event, dan persentase kehadiran kamu bulan ini dalam satu tempat.",
        placement: "left",
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
        target: "[data-tour='pengumuman-list']",
        pageLabel: "Pengumuman",
        title: "Daftar Pengumuman",
        description: "Semua pengumuman diurutkan dari yang terbaru. Pengumuman bisa dari admin untuk semua jurusan, atau khusus jurusanmu.",
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
        target: "[data-tour='profile-photo']",
        pageLabel: "Profil",
        title: "Foto Profil",
        description: "Upload foto profil kamu di sini. Foto otomatis dikompres agar tetap ringan dan langsung tampil tanpa perlu refresh.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/profile",
        target: "[data-tour='profile-data']",
        pageLabel: "Profil",
        title: "Data Diri",
        description: "Lengkapi nama, NIS, instansi PKL, dan kelas kamu. Email dan Role bersifat readonly dan tidak bisa diubah sendiri.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/siswa/profile",
        target: "[data-tour='profile-password']",
        pageLabel: "Profil",
        title: "Ubah Password",
        description: "Ganti password akun kamu di sini. Masukkan password lama untuk verifikasi, lalu password baru minimal 6 karakter.",
        placement: "right",
      },
    ],
  },
]

// ============================================================
// PEMBIMBING
// ============================================================

const PEMBIMBING_GROUPS: PageGroup[] = [
  {
    label: "Selamat Datang",
    steps: [
      {
        title: "Selamat Datang, Pembimbing!",
        description: "Panduan ini akan mengajak kamu berkeliling semua halaman bimbingan PKL. Setiap bagian penting akan disorot langsung di layar. Klik Lanjut untuk memulai.",
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
        title: "Menu Dashboard",
        description: "Halaman utama bimbingan kamu. Seluruh fitur bisa diakses dari sidebar — menu aktif ditandai warna biru.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing",
        target: "[data-tour='pdash-stats']",
        pageLabel: "Dashboard",
        title: "Ringkasan Bimbingan",
        description: "Jumlah siswa bimbingan, yang hadir hari ini, izin pending, dan yang alfa — semua dalam satu baris.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/pembimbing",
        target: "[data-tour='pdash-chart']",
        pageLabel: "Dashboard",
        title: "Grafik Tren 7 Hari",
        description: "Grafik ini menunjukkan tren kehadiran, keterlambatan, izin, dan alfa siswa bimbinganmu selama 7 hari terakhir.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing",
        target: "[data-tour='pdash-students']",
        pageLabel: "Dashboard",
        title: "Daftar Siswa Bimbingan",
        description: "Lihat status kehadiran hari ini untuk setiap siswa bimbinganmu — Hadir, Telat, atau Alfa.",
        placement: "left",
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
        target: "[data-tour='pizin-list']",
        pageLabel: "Persetujuan Izin",
        title: "Tinjau & Putuskan",
        description: "Semua pengajuan yang masih pending tampil berurutan. Klik untuk lihat detail lengkap dan bukti pendukung, lalu Setujui atau Tolak.",
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
        target: "[data-tour='plogbook-list']",
        pageLabel: "Penilaian Kegiatan",
        title: "Nilai & Feedback",
        description: "Baca kegiatan yang dikirim tiap siswa, beri nilai 0-100 dan feedback. Kegiatan yang belum dinilai ditandai khusus supaya mudah dicari.",
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
        target: "[data-tour='pqr-card']",
        pageLabel: "Generate QR",
        title: "Buat Sesi Presensi",
        description: "Tekan Generate QR untuk membuat sesi baru. Atur jam batas telat dan durasi berlaku, lalu tampilkan QR di layar agar siswa bisa scan.",
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
        target: "[data-tour='sert-stats']",
        pageLabel: "Sertifikat & Nilai",
        title: "Ringkasan",
        description: "Jumlah siswa bimbingan dan berapa rekap prakerin yang sudah dikirim.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
        target: "[data-tour='sert-tabs']",
        pageLabel: "Sertifikat & Nilai",
        title: "3 Tab Utama",
        description: "Pindah antar tab: Upload Sertifikat, Rekap Prakerin (form penilaian lengkap), dan Riwayat pengiriman.",
        placement: "bottom",
      },
      {
        navigateTo: "/dashboard/pembimbing/sertifikat-rekap",
        target: "[data-tour='sert-cert-form']",
        pageLabel: "Sertifikat & Nilai",
        title: "Kirim Sertifikat PKL",
        description: "Pilih siswa penerima, upload file PDF atau gambar sertifikat (maks 10MB), pratinjau/anotasi jika perlu, lalu kirim.",
        placement: "top",
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
        target: "[data-tour='profile-photo']",
        pageLabel: "Profil",
        title: "Foto Profil",
        description: "Upload foto profil kamu di sini. Foto otomatis dikompres dan langsung tampil tanpa refresh.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/profile",
        target: "[data-tour='profile-data']",
        pageLabel: "Profil",
        title: "Data Diri",
        description: "Lengkapi nama, NIP/NIDN, dan data lain. Email dan Role bersifat readonly.",
        placement: "right",
      },
      {
        navigateTo: "/dashboard/pembimbing/profile",
        target: "[data-tour='profile-password']",
        pageLabel: "Profil",
        title: "Ubah Password",
        description: "Ganti password akun kamu di sini dengan verifikasi password lama terlebih dahulu.",
        placement: "right",
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
