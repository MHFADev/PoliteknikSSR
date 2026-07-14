"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LogOut, ChevronUp, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MAIN_NAV, MORE_NAV, type NavItem } from "@/lib/navigation";
import styles from "@/styles/components/layout/MobileNav.module.css";

type Props = {
  role: "siswa" | "pembimbing" | "admin" | "owner";
  fullName: string;
  avatarUrl?: string | null;
};

export function MobileNav({ role, fullName, avatarUrl }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const mainItems = MAIN_NAV[role];
  const moreItems = MORE_NAV[role];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>Politeknik SSR</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.avatarWrapper} ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={styles.avatarBtn}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className={styles.avatarText}>
                  {fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={styles.dropdown}
                >
                  <div className={styles.dropdownUser}>
                    <span className={styles.dropdownName}>{fullName}</span>
                    <span className={styles.dropdownRole}>{role}</span>
                  </div>
                  <Link
                    href={`/dashboard/${role}/profile`}
                    className={styles.dropdownItem}
                    onClick={() => setShowMenu(false)}
                  >
                    Profil Saya
                  </Link>
                  <Link
                    href={`/dashboard/${role}/settings`}
                    className={styles.dropdownItem}
                    onClick={() => setShowMenu(false)}
                  >
                    Pengaturan
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button onClick={handleLogout} className={styles.logoutItem}>
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {mainItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(styles.navItem, active && styles.navItemActive)}
            >
              <Icon className={cn(styles.navIcon, active && styles.navIconActive)} />
              <span className={cn(styles.navLabel, active && styles.navLabelActive)}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        {moreItems.length > 0 && (
          <div className={styles.moreWrapper}>
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(styles.navItem, showMore && styles.navItemActive)}
            >
              <MoreHorizontal className={cn(styles.navIcon, showMore && styles.navIconActive)} />
              <span className={cn(styles.navLabel, showMore && styles.navLabelActive)}>Lainnya</span>
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={styles.moreSheet}
                >
                  <div className={styles.moreSheetInner}>
                    {moreItems.map((item) => {
                      const active = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMore(false)}
                          className={cn(styles.moreItem, active && styles.moreItemActive)}
                        >
                          <Icon className={styles.moreItemIcon} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setShowMore(false)}
                    className={styles.moreClose}
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>
    </>
  );
}