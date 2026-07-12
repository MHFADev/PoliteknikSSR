"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LogOut, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { NAV } from "@/lib/navigation";
import type { NavItem } from "@/lib/navigation";
import styles from "@/styles/components/layout/Sidebar.module.css";

interface SidebarProps {
  role: "siswa" | "pembimbing" | "admin";
  fullName: string;
}

export function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV[role];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className={styles.desktop}>
      <div className={styles.content}>
        <div>
          <div className={styles.logo}>
            <Image src="/logo.png" alt="Politeknik SSR" width={140} height={40} className="h-auto w-auto" priority />
          </div>
          <nav className={styles.nav}>
            {items.map((item: NavItem) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
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
            })}
          </nav>
        </div>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {fullName.charAt(0).toUpperCase()}
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