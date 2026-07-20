import { getTodaySession } from "@/actions/qr";
import { QRGeneratorCard } from "@/components/qr/QRGeneratorCard";
import styles from "@/styles/pages/dashboard/admin/QR.module.css";

export default async function PembimbingQRPage() {
  const session = await getTodaySession();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Generate QR Presensi</h1>
        <p>Buat QR harian untuk absensi siswa bimbingan</p>
      </div>

      <div className={styles.qrCentered}>
        <div className={styles.qrWrapper} data-tour="pqr-card">
          <QRGeneratorCard initialSession={session ?? null} showSettings={false} />
        </div>
      </div>
    </div>
  );
}
