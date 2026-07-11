"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { get30DayAttendanceStats, AttendanceStats } from "@/actions/admin";
import { Badge } from "@/components/ui/Badge";
import { RefreshCw } from "lucide-react";
import styles from "@/styles/pages/dashboard/admin/Absensi.module.css";

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
      filtered = filtered.filter(s => 
        s.fullName.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.jurusan) {
      filtered = filtered.filter(s => 
        s.jurusan?.toLowerCase().includes(filters.jurusan.toLowerCase())
      );
    }
    if (filters.kelas) {
      filtered = filtered.filter(s => 
        s.kelas?.toLowerCase().includes(filters.kelas.toLowerCase())
      );
    }
    
    setStats(filtered);
  }, [filters, allStats]);

  function resetFilters() {
    setFilters({ name: "", jurusan: "", kelas: "" });
  }

  // Get unique jurusan options from allStats
  const uniqueJurusan = [...new Set(allStats.map(s => s.jurusan).filter(Boolean))];
  const uniqueKelas = [...new Set(allStats.map(s => s.kelas).filter(Boolean))];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Rekap Absensi 30 Hari Terakhir</h1>
        <p>Lihat rekapitulasi kehadiran semua siswa atau filter sesuai kebutuhan.</p>
      </div>

      <Card variant="flip7">
        <CardHeader title="Filter Data" />
        <div className={styles.filterGrid}>
          <Input
            label="Nama Siswa"
            value={filters.name}
            onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
            placeholder="Cari nama siswa..."
          />
          <Select
            label="Jurusan"
            value={filters.jurusan}
            onChange={(e) => setFilters(f => ({ ...f, jurusan: e.target.value }))}
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
            onChange={(e) => setFilters(f => ({ ...f, kelas: e.target.value }))}
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
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Jurusan</th>
                <th className="text-center">Hadir</th>
                <th className="text-center">Telat</th>
                <th className="text-center">Izin</th>
                <th className="text-center">Sakit</th>
                <th className="text-center">Alfa</th>
                <th className="text-center">Total Hari</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className={styles.tableEmptyCell}>
                    Memuat data...
                  </td>
                </tr>
              ) : stats.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.tableEmptyCell}>
                    Tidak ada data absensi
                  </td>
                </tr>
              ) : (
                stats.map((student) => (
                  <tr key={student.studentId} className={styles.tableRow}>
                    <td className="text-ink">{student.fullName}</td>
                    <td className="text-ink-muted">{student.kelas || "-"}</td>
                    <td className="text-ink-muted">{student.jurusan || "-"}</td>
                    <td className={styles.tableCellCenter}>
                      <Badge tone="leaf">{student.hadir}</Badge>
                    </td>
                    <td className={styles.tableCellCenter}>
                      <Badge tone="sun">{student.telat}</Badge>
                    </td>
                    <td className={styles.tableCellCenter}>
                      <Badge tone="sky">{student.izin}</Badge>
                    </td>
                    <td className={styles.tableCellCenter}>
                      <Badge tone="berry">{student.sakit}</Badge>
                    </td>
                    <td className={styles.tableCellCenter}>
                      <Badge tone="coral">{student.alfa}</Badge>
                    </td>
                    <td className="text-center text-ink font-semibold">{student.total}</td>
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
