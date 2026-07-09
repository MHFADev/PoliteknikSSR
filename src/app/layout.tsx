import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Politeknik SSR — Manajemen PKL",
  description: "Dashboard manajemen PKL siswa, pembimbing, dan admin — Politeknik SSR",
<<<<<<< HEAD
=======
  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
  },
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
