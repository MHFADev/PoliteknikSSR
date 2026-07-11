import styles from "@/styles/pages/dashboard/loading.module.css";

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonSubtitle} />
      <div className={styles.skeletonGrid}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
      <div className={styles.skeletonChart} />
    </div>
  );
}
