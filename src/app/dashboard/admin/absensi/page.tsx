"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { get30DayAttendanceStats } from "@/actions/admin";
import type { AttendanceStats } from "@/lib/repositories";
import { Badge } from "@/components/ui/Badge";
import { RefreshCw } from "lucide-react";

export default function AdminAttendancePage() {
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [allStats, setAllStats] = useState<AttendanceStats[]>([]);
  const [filters, setFilters] = useState({
    name: "",
    jurusan: "",
    kelas: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await get30DayAttendanceStats();
      setStats(data);
      setAllStats(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Apply filters client-side
  useEffect(() => {
    let filtered = [...allStats];

    if (filters.name) {
      filtered = filtered.filter((s) =>
        s.fullName.toLowerCase().includes(filters.name.toLowerCase()),
      );
    }
    if (filters.jurusan) {
      filtered = filtered.filter((s) =>
        s.jurusan?.toLowerCase().includes(filters.jurusan.toLowerCase()),
      );
    }
    if (filters.kelas) {
      filtered = filtered.filter((s) =>
        s.kelas?.toLowerCase().includes(filters.kelas.toLowerCase()),
      );
    }

    setStats(filtered);
  }, [filters, allStats]);

  function resetFilters() {
    setFilters({ name: "", jurusan: "", kelas: "" });
  }

  // Get unique jurusan options from allStats
  const uniqueJurusan = [
    ...new Set(allStats.map((s) => s.jurusan).filter(Boolean)),
  ];
  const uniqueKelas = [
    ...new Set(allStats.map((s) => s.kelas).filter(Boolean)),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Rekap Absensi 30 Hari Terakhir
        </h1>
        <p className="text-sm text-ink-muted">
          Lihat rekapitulasi kehadiran semua siswa atau filter sesuai kebutuhan
        </p>
      </div>

      <Card variant="flip7">
        <CardHeader title="Filter Data" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Nama Siswa"
            value={filters.name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Cari nama siswa..."
          />
          <Select
            label="Jurusan"
            value={filters.jurusan}
            onChange={(e) =>
              setFilters((f) => ({ ...f, jurusan: e.target.value }))
            }
          >
            <option value="">Semua Jurusan</option>
            {uniqueJurusan.map((j) => (
              <option key={j} value={j!}>
                {j}
              </option>
            ))}
          </Select>
          <Select
            label="Kelas"
            value={filters.kelas}
            onChange={(e) =>
              setFilters((f) => ({ ...f, kelas: e.target.value }))
            }
          >
            <option value="">Semua Kelas</option>
            {uniqueKelas.map((k) => (
              <option key={k} value={k!}>
                {k}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Filter
          </Button>
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
                    <td className="py-3 px-4 text-ink">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "9999px",
                            background: student.avatarUrl
                              ? "transparent"
                              : "#DBEAFE",
                            color: "#1D4ED8",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt={student.fullName}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            student.fullName?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                        <span>{student.fullName}</span>
                      </div>
                    </td>
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
