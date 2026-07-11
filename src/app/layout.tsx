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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jakarta.variable} ${josefin.variable}`} // ✅ Harus ada
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
