"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LogOut, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { NAV } from "@/lib/navigation";
import type { NavItem } from "@/lib/navigation";
import styles from "@/styles/components/layout/Sidebar.module.css";

interface SidebarProps {
  role: "siswa" | "pembimbing" | "admin" | "owner" | "root";
  fullName: string;
  avatarUrl?: string | null;
}

const MAX_VISIBLE = 5;

export function Sidebar({ role, fullName, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV[role];
  const [showAll, setShowAll] = useState(false);
  const collapsed = !showAll && items.length > MAX_VISIBLE;
  const visibleItems = collapsed ? items.slice(0, MAX_VISIBLE) : items;

  // Render grouped items
  let lastGroup = "";
  const rendered: React.ReactNode[] = [];

  visibleItems.forEach((item: NavItem, idx: number) => {
    const active = pathname === item.href;
    const Icon = item.icon;

    // Group header
    if (item.group && item.group !== lastGroup) {
      lastGroup = item.group;
      rendered.push(
        <div key={`g-${idx}`} className={styles.groupLabel}>
          {item.group === "Utama" ? "◈" : item.group === "Manajemen" ? "▣" : item.group === "Data" ? "▤" : item.group === "Komunikasi" ? "◉" : item.group === "Laporan" ? "▣" : item.group === "Pengajuan" ? "▣" : item.group === "Info" ? "◉" : item.group === "Penilaian" ? "▣" : item.group === "Akun" ? "●" : "○"} {item.group}
        </div>
      );
    }

    rendered.push(
      <Link key={item.href} href={item.href} className={styles.link}>
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className={styles.activeBg}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <span className={cn(styles.linkText, active ? styles.linkActive : styles.linkInactive)}>
          <Icon className="h-5 w-5" />
          {item.label}
        </span>
      </Link>
    );
  });

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className={styles.desktop}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="Politeknik SSR" width={140} height={40} className="h-auto w-auto" priority />
        </div>
        <nav className={styles.nav}>
          {rendered}
          {collapsed && (
            <button onClick={() => setShowAll(true)} className={styles.showAllBtn}>
              Show all <ChevronDown className="h-4 w-4" />
            </button>
          )}
          {showAll && items.length > MAX_VISIBLE && (
            <button onClick={() => setShowAll(false)} className={styles.showAllBtn}>
              Show less <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
          )}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full rounded-full object-cover" />
              ) : (
                fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className={styles.userName}>{fullName}</p>
              <p className={styles.userRole}>{role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut className="h-5 w-5" />
            Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}