import { QRScanner } from "@/components/qr/QRScanner";
import { Card, CardHeader } from "@/components/ui/Card";
import styles from "@/styles/pages/dashboard/siswa/Absensi.module.css";

export default function SiswaAbsensiPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Absensi QR</h1>
        <p>Scan QR yang ditampilkan admin untuk mencatat kehadiran hari ini.</p>
      </div>

      <Card className={styles.scannerCard}>
        <QRScanner />
      </Card>
    </div>
  );
}
