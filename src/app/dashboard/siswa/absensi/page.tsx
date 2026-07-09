import { QRScanner } from "@/components/qr/QRScanner";
import { Card, CardHeader } from "@/components/ui/Card";

export default function SiswaAbsensiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Absensi QR</h1>
        <p className="text-sm text-mist-dim">Scan QR yang ditampilkan admin untuk mencatat kehadiran hari ini.</p>
      </div>

      <Card className="flex justify-center py-8">
        <QRScanner />
      </Card>
    </div>
  );
}
