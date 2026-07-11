/**
 * Skeleton — Placeholder loading dengan animasi pulse
 * ====================================================
 * Menampilkan placeholder abu-abu beranimasi untuk konten
 * yang masih dimuat. Tersedia 3 varian: dasar, Card, dan TableRow.
 *
 * Cara pakai:
 *   <Skeleton className="h-4 w-24" />
 *   <CardSkeleton />
 *   <TableRowSkeleton cols={5} />
 */

import { cn } from "@/lib/utils";
import styles from "@/styles/components/ui/Skeleton.module.css";

/** Skeleton dasar — satu blok abu-abu beranimasi */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn(styles.skeleton, className)} />;
}

/** Skeleton untuk kartu — 3 baris (judul, nilai, deskripsi) */
export function CardSkeleton() {
  return (
    <div className={styles.cardSkeleton}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/** Skeleton untuk baris tabel — N kolom selebar flex-1 */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className={styles.tableRow}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}