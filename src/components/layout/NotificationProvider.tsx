"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { getUnreadNotificationCounts, markNotificationsRead } from "@/actions/notifications";

type Counts = Record<string, number>;

const NotificationContext = createContext<Counts>({});

/** Hook untuk membaca jumlah notifikasi per link (untuk badge sidebar). */
export function useNotificationCounts() {
  return useContext(NotificationContext);
}

/**
 * NotificationProvider — memuat jumlah notifikasi belum dibaca per link,
 * lalu menandai sebagai sudah dibaca saat user berpindah ke halaman yang cocok.
 * Dibungkus di layout di atas Sidebar & MobileNav.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({});
  const markedRef = useRef<string>("");

  // Muat badge awal sekali
  useEffect(() => {
    getUnreadNotificationCounts().then(setCounts);
  }, []);

  // Saat halaman berubah → notifikasi link itu dianggap dibaca
  useEffect(() => {
    if (!pathname || markedRef.current === pathname) return;
    markedRef.current = pathname;
    markNotificationsRead(pathname).then(() => {
      setCounts((prev) => {
        if (!prev[pathname]) return prev;
        const next = { ...prev };
        delete next[pathname];
        return next;
      });
    });
  }, [pathname]);

  return <NotificationContext.Provider value={counts}>{children}</NotificationContext.Provider>;
}