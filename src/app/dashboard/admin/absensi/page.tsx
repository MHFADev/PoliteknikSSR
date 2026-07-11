"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { get30DayAttendanceStats, AttendanceStats } from "@/actions/admin";
import { Badge } from "@/components/ui/Badge";

export default function AdminAttendancePage() {
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await get30DayAttendanceStats(selectedStudent || undefined);
      setStats(data);
      setLoading(false);
    }
    fetchData();
  }, [selectedStudent]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Rekap Absensi 30 Hari Terakhir
        </h1>
        <p className="text-sm text-ink-muted">
          Lihat rekapitulasi kehadiran siswa
        </p>
      </div>

      <Card variant="flip7">
        <CardHeader title="Filter Data" />
        <div className="max-w-md">
          <Select
            label="Pilih Siswa (Opsional)"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Semua Siswa</option>
            {stats.map((s) => (
              <option key={s.studentId} value={s.studentId}>
                {s.fullName}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card variant="flip7">
        <CardHeader title="Tabel Absensi" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline">
                <th className="text-left py-3 px-4 font-semibold text-ink">
                  Nama Siswa
                </th>
                <th className="text-left py-3 px-4 font-semibold text-ink">
                  Kelas
                </th>
                <th className="text-left py-3 px-4 font-semibold text-ink">
                  Jurusan
                </th>
                <th className="text-center py-3 px-4 font-semibold text-leaf">
                  Hadir
                </th>
                <th className="text-center py-3 px-4 font-semibold text-ink-muted">
                  Telat
                </th>
                <th className="text-center py-3 px-4 font-semibold text-sun">
                  Izin
                </th>
                <th className="text-center py-3 px-4 font-semibold text-[#A855F7]">
                  Sakit
                </th>
                <th className="text-center py-3 px-4 font-semibold text-coral1">
                  Alfa
                </th>
                <th className="text-center py-3 px-4 font-semibold text-ink">
                  Total Hari
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-ink-muted">
                    Memuat data...
                  </td>
                </tr>
              ) : stats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-ink-muted">
                    Tidak ada data absensi
                  </td>
                </tr>
              ) : (
                stats.map((student) => (
                  <tr
                    key={student.studentId}
                    className="border-b border-outline hover:bg-surface/50"
                  >
                    <td className="py-3 px-4 text-ink">{student.fullName}</td>
                    <td className="py-3 px-4 text-ink-muted">
                      {student.kelas || "-"}
                    </td>
                    <td className="py-3 px-4 text-ink-muted">
                      {student.jurusan || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge tone="leaf">{student.hadir}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge tone="ink">{student.telat}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge tone="sun">{student.izin}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge tone="berry">{student.sakit}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge tone="coral">{student.alfa}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-ink font-semibold">
                      {student.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
