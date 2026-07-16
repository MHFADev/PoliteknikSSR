// ============================================================
// Shared Types & Constants — Dapat di-import dari mana saja
// ============================================================

// ─── Prakerin Recap Types ─────────────────────────────
export const UNSUR_NILAI_LABELS = [
  "Disiplin",
  "Kerja Sama",
  "Inisiatif",
  "Kerajinan",
  "Tanggung Jawab",
  "Kepribadian",
  "Kehadiran",
] as const;

export type UnsurNilaiKey = (typeof UNSUR_NILAI_LABELS)[number];

export interface UnsurNilai {
  name: string;
  score: number;
}

export interface BidangKeahlian {
  name: string;
  score: number;
  keterangan?: string;
}

export interface PrakerinRecapData {
  // Identitas siswa
  studentName: string;
  nis: string;
  kelas: string;
  programKeahlian: string;
  industri: string;
  periode: string;

  // 7 unsur nilai (Disiplin s.d. Kehadiran)
  unsurNilai: UnsurNilai[];

  // Bidang keahlian
  bidangKeahlian: BidangKeahlian[];

  // Catatan
  notes: string;

  // Tanggal
  pklStartDate: string;
  pklEndDate: string;
}

// ─── Pembimbing-Siswa Relationship ─────────────────────
export interface StudentMentor {
  id: string;
  studentId: string;
  mentorId: string;
  createdAt: string;
}

export interface MentorWithStudent extends StudentMentor {
  studentName: string;
  studentKelas: string | null;
  studentIdentityNumber: string | null;
  studentAvatarUrl: string | null;
}

export interface MentorInfo {
  id: string;
  fullName: string;
  jurusan: string | null;
  avatarUrl: string | null;
}

export function prakerinGradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}

export function prakerinGradeLabel(score: number): string {
  if (score >= 90) return "Sangat Baik";
  if (score >= 80) return "Baik";
  if (score >= 70) return "Cukup";
  return "Kurang";
}

export function createDefaultPrakerinData(): PrakerinRecapData {
  return {
    studentName: "",
    nis: "",
    kelas: "",
    programKeahlian: "",
    industri: "",
    periode: "",
    unsurNilai: UNSUR_NILAI_LABELS.map((name) => ({ name, score: 0 })),
    bidangKeahlian: Array.from({ length: 3 }, () => ({
      name: "",
      score: 0,
    })),
    notes: "",
    pklStartDate: "",
    pklEndDate: "",
  };
}
