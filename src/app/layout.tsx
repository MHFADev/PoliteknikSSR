/*
 * layout.tsx — Root Layout Aplikasi
 * ==========================================
 * Layout utama Next.js yang membungkus seluruh halaman.
 * Mengatur font global (Inter, Jakarta, Josefin) dan
 * menyediakan Leaflet CSS CDN untuk peta di halaman lokasi.
 *
 * Alur:
 * - Import dan konfigurasi font Google (variable CSS)
 * - Metadata global (title, description, favicon)
 * - Inject Leaflet CSS di <head> (CDN)
 */

import type { Metadata } from "next";
import "./globals.css";
import { Inter, Plus_Jakarta_Sans, Josefin_Sans } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700"],
});

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Politeknik SSR — Manajemen PKL",
  description:
    "Dashboard manajemen PKL siswa, pembimbing, dan admin — Politeknik SSR",
  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        {/* Leaflet CSS — diperlukan untuk komponen peta di halaman lokasi */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
