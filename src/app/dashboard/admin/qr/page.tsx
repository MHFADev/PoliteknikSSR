import { getTodaySession } from "@/actions/qr";
import { QRGeneratorCard } from "@/components/qr/QRGeneratorCard";
import styles from "@/styles/pages/dashboard/admin/QR.module.css";

export default async function AdminQRPage() {
  const session = await getTodaySession();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Generate QR Presensi</h1>
        <p>Buat sesi QR harian untuk absensi siswa.</p>
      </div>

      <div className={styles.qrCentered}>
        <div className={styles.qrWrapper}>
          <QRGeneratorCard initialSession={session ?? null} />
        </div>
      </div>
    </div>
  );
}
