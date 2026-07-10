<div align="center">
   <img src="https://raw.githubusercontent.com/MHFADev/asset/main/politeknikssr/logo.png" alt="Politeknik SSR" width="220">

   <h1>Politeknik SSR</h1>
   <p><strong>Sistem Manajemen Praktik Kerja Lapangan (PKL)</strong></p>

   <p>
     <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 14">
     <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
     <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
     <img src="https://img.shields.io/badge/Self%20Hosted-Server-4A5568?style=for-the-badge&logo=linux&logoColor=white" alt="Self Hosted">
   </p>
</div>

<br>

## Tentang Proyek

**Politeknik SSR** adalah platform manajemen Praktik Kerja Lapangan (PKL) yang dirancang untuk membantu institusi pendidikan mengelola seluruh siklus kegiatan magang peserta didik secara terpusat, mulai dari penempatan, pemantauan progres, hingga pelaporan akhir.

Dibangun di atas **Next.js 14** dan **TypeScript**, dengan **Supabase** sebagai basis data dan backend, sistem ini dirancang untuk memberikan pengalaman administrasi yang cepat, aman, dan andal, baik bagi pihak sekolah maupun mitra industri.

<br>

## Kontributor

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/MHFADev">
        <img src="https://github.com/MHFADev.png" width="100" alt="MHFADev"><br>
        <sub><b>MHFADev</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ZED-09">
        <img src="https://github.com/ZED-09.png" width="100" alt="Zidan"><br>
        <sub><b>Zidan</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ferdyafriansyahkosim-wq">
        <img src="https://github.com/ferdyafriansyahkosim-wq.png" width="100" alt="BANGFER"><br>
        <sub><b>BANGFER</b></sub>
      </a>
    </td>
  </tr>
</table>

<br>

---

# Politeknik SSR — Dashboard Manajemen PKL

Dashboard manajemen PKL (Praktik Kerja Lapangan) untuk **Politeknik SSR**, dibuat oleh **SatriaD**.
Fitur utama: presensi QR harian, pengajuan izin dengan upload bukti terkompresi, logbook harian, alur persetujuan pembimbing, analitik kehadiran, dan ekspor CSV.

> **Catatan penting soal role:** brief awal menyebut 2 role (`Siswa`, `Pembimbing`) tapi juga meminta rute `/dashboard/admin` terpisah untuk generate QR & kelola data secara penuh. Supaya konsisten, project ini dibangun dengan **3 role**: `siswa`, `pembimbing`, dan `admin` — masing-masing punya dashboard sendiri (`/dashboard/siswa`, `/dashboard/pembimbing`, `/dashboard/admin`). Kalau kamu maunya cuma 2 role, tinggal hapus role `admin` dan pindahkan fitur generate‑QR ke role `pembimbing`.

---

## 1. Tech Stack

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS (palet krem hangat + aksen teal/sage/terracotta, bukan warna default indigo/ungu) |
| Animasi | Framer Motion |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth + Row Level Security) |
| Storage | Supabase Storage (bucket `leave-proofs`) |
| Chart | Recharts |
| QR Scan | html5-qrcode (kamera browser) |
| QR Generate | qrcode |
| Kompresi gambar | browser-image-compression |
| Validasi | Zod |
| Peta Interaktif | Leaflet + react-leaflet |

---

## 2. Struktur Folder

```
politeknik-ssr/
├── docs/                       # Dokumentasi referensi & desain
├── schema.sql                  # Jalankan di Supabase SQL Editor
├── .env.example                # Template environment variable
├── scripts/create-user.mjs     # Bikin akun admin/pembimbing/siswa pertama
└── src/
    ├── middleware.ts           # Proteksi rute + role-based redirect
    ├── app/
    │   ├── login/               # Halaman login (Skylearn design system)
    │   ├── api/locations/       # API endpoint lokasi GPS
    │   └── dashboard/
    │       ├── (auth)/          # Route group untuk halaman login
    │       ├── siswa/           # Ringkasan, Absensi QR, Izin, Logbook, Kalender, Pengumuman
    │       ├── pembimbing/      # Ringkasan, Persetujuan Izin, Penilaian Logbook
    │       └── admin/           # Ringkasan, Generate QR, Data Izin, Data Logbook, Ekspor, Lokasi GPS, Kalender, Broadcast, Pengguna
    ├── actions/                 # Server Actions (attendance, leave, logbook, qr, location, broadcast, kalender)
    ├── components/
    │   ├── ui/                  # Base UI primitives: Button, Card, Modal, Badge, Skeleton, ProgressBar, StarBadge, AnswerTile, Confetti
    │   ├── layout/              # Layout components: Sidebar
    │   ├── features/
    │   │   ├── izin/            # LeaveRequestForm, LeaveApprovalModal
    │   │   ├── logbook/         # LogbookForm, LogbookGradeModal
    │   │   ├── qr/              # QRScanner (siswa), QRGeneratorCard (admin)
    │   │   ├── location/        # LocationPicker, LocationVerifier (Leaflet)
    │   │   ├── admin/           # AddStudentModal
    │   │   ├── charts/          # AttendanceChart (Recharts)
    │   │   ├── dashboard/       # StatCard
    │   │   └── calendar/        # Calendar, StudentCalendar
    │   └── shared/              # Komponen yang dipakai lintas fitur
    ├── lib/
    │   ├── supabase/            # client.ts (browser), server.ts, middleware.ts
    │   ├── utils.ts             # Helper: cn(), formatDate, todayISODate
    │   ├── constants.ts         # Warna & konstanta global
    │   ├── qr-token.ts          # HMAC sign/verify token QR harian
    │   └── export-csv.ts        # Utilitas ekspor CSV
    └── types/database.ts        # Tipe TypeScript sesuai schema.sql
```

---

## 3. Cara Menjalankan (Setup dari Nol)

### Langkah 1 — Buat project Supabase
1. Buka [supabase.com](https://supabase.com) → **New Project**.
2. Setelah project jadi, buka **Project Settings → API**, catat `Project URL` dan `anon public key`, serta `service_role key` (di tab yang sama, jangan sampai bocor ke publik).

### Langkah 2 — Jalankan schema database
1. Buka **SQL Editor** di dashboard Supabase → **New query**.
2. Copy seluruh isi file `schema.sql` dari project ini, paste, lalu **Run**.
3. File ini otomatis membuat: semua tabel, index, trigger `handle_new_user`, seluruh RLS policy, dan bucket storage `leave-proofs`.

### Langkah 3 — Install dependencies
```bash
npm install
```

> **Kalau kamu develop dari Termux (Android):** `next dev` kadang gagal karena binary SWC belum tersedia untuk arsitektur Termux. Ini cuma masalah di local dev — build production di Vercel tidak terpengaruh. Kalau kejadian, coba `npm install --force` atau jalankan dev server dari device lain, lalu tetap deploy seperti biasa ke Vercel.

### Langkah 4 — Isi environment variable
```bash
cp .env.example .env.local
```
Lalu isi `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` → dari Langkah 1
- `SUPABASE_SERVICE_ROLE_KEY` → dari Langkah 1 (**jangan pernah commit ke git / expose ke client**)
- `QR_SIGNING_SECRET` → string acak bebas, minimal 32 karakter (bisa generate lewat `openssl rand -hex 32`)

### Langkah 5 — Buat akun pertama (Admin)
Karena registrasi publik sengaja dimatikan (akun hanya dibuat Admin), buat akun admin pertama lewat script:
```bash
npm run create-user -- "Nama Admin" admin@sekolah.ac.id password123 admin
```
Setelah itu, akun admin bisa dipakai untuk hal-hal manual lain:
- Menambah akun pembimbing/siswa lain: ulangi perintah di atas dengan role `pembimbing` atau `siswa`.
- Memetakan siswa ke pembimbingnya: insert manual ke tabel `student_mentors` lewat Table Editor Supabase (kolom `student_id`, `mentor_id`, isi dengan `id` dari tabel `profiles`).

### Langkah 6 — Jalankan aplikasi
```bash
npm run dev
```
Buka `http://localhost:3000` → login dengan akun admin yang baru dibuat.

---

## 4. Alur Penggunaan Fitur

- **Admin → Lokasi GPS**: buka halaman Lokasi GPS, tambah lokasi dengan peta interaktif (drag marker atau klik peta), atur radius lokasi.
- **Admin → Generate QR**: klik "Generate QR" tiap pagi, tampilkan QR di layar/proyektor kelas.
- **Siswa → Login & Verifikasi GPS**: saat login, sistem meminta izin lokasi dan memverifikasi apakah siswa berada di radius lokasi yang diizinkan.
- **Siswa → Absensi QR**: buka menu Absensi QR, izinkan akses kamera, arahkan ke QR admin. Presensi otomatis ditandai "Hadir" sebelum jam 08:00 dan "Telat" setelahnya (bisa diubah di `src/actions/attendance.ts`, konstanta `ON_TIME_CUTOFF_HOUR`).
- **Siswa → Pengajuan Izin**: isi form, lampirkan foto (otomatis dikompresi sebelum upload), lalu pantau status di riwayat.
- **Pembimbing/Admin → Persetujuan Izin**: klik salah satu pengajuan pending untuk buka detail, tulis catatan (opsional), lalu Setujui/Tolak.
- **Siswa → Logbook Harian**: isi aktivitas harian (1 entri per tanggal, submit ulang di hari yang sama akan meng-update entri tsb).
- **Pembimbing/Admin → Penilaian Logbook**: buka entri, geser slider nilai 0–100, tulis feedback, simpan.
- **Admin → Ekspor Data**: unduh CSV presensi, izin, atau logbook untuk laporan/rekap.

---

## 5. Keamanan yang Sudah Diterapkan

- **Row Level Security** aktif di semua tabel — siswa hanya bisa lihat datanya sendiri, pembimbing hanya siswa bimbingannya (via tabel `student_mentors`), admin akses penuh.
- **Token QR ditandatangani HMAC-SHA256** (`src/lib/qr-token.ts`) sehingga tidak bisa dipalsukan meski struktur payload-nya publik/terlihat di gambar QR.
- **Role diverifikasi ulang di server** pada setiap Server Action (tidak percaya begitu saja klaim role dari client).
- **Constraint unik** di database mencegah presensi ganda per sesi dan entri logbook ganda per tanggal.
- **`service_role key`** hanya dipakai di script server-side (`scripts/create-user.mjs`), tidak pernah diimpor ke Client Component.
- **Verifikasi lokasi GPS** saat login untuk memastikan siswa berada di area kampus sebelum bisa mengakses sistem.

---

## 6. Deploy ke Vercel

1. Push project ini ke GitHub.
2. Import repo di [vercel.com/new](https://vercel.com/new).
3. Tambahkan environment variables yang sama seperti `.env.local` di Project Settings → Environment Variables.
4. Deploy. Next.js App Router + Server Actions berjalan otomatis tanpa konfigurasi tambahan di Vercel.

---

## 7. Yang Perlu Kamu Sesuaikan Sebelum Production

- Ganti `ON_TIME_CUTOFF_HOUR` di `src/actions/attendance.ts` sesuai jam masuk instansi.
- `SESSION_DURATION_HOURS` di `src/actions/qr.ts` mengatur berapa lama QR berlaku (default 12 jam).
- Tambahkan halaman manajemen user & mapping siswa-pembimbing di dashboard Admin (saat ini masih manual lewat Supabase Table Editor) kalau ingin sepenuhnya self-service tanpa buka Supabase dashboard.
