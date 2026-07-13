/*
 * layout.tsx — Root Layout Aplikasi
 * ==========================================
 * Layout utama Next.js yang membungkus seluruh halaman.
 * Mengatur font global (Inter, Jakarta, Josefin).
 */

import type { Metadata } from "next";
import "./globals.css";

import { Inter, Plus_Jakarta_Sans, Josefin_Sans } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700"],
});

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Politeknik SSR — Manajemen PKL",
  description:
    "Dashboard manajemen PKL siswa, pembimbing, dan admin — Politeknik SSR",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.jpg", type: "image/jpeg" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jakarta.variable} ${josefin.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.jpg" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
