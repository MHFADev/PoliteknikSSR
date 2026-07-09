import { getTodaySession } from "@/actions/qr";
import { QRGeneratorCard } from "@/components/qr/QRGeneratorCard";

export default async function AdminQRPage() {
  const session = await getTodaySession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Generate QR Presensi</h1>
        <p className="text-sm text-mist-dim">Buat sesi QR harian untuk absensi siswa.</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <QRGeneratorCard initialSession={session ?? null} />
        </div>
      </div>
    </div>
  );
}
