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

  // Tanda tangan & NIP
  pembimbingSekolahNip: string;
  pembimbingSekolahTtd: string;
  pembimbingIndustriNip: string;
  pembimbingIndustriTtd: string;
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

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  headerBg: string;
  headerText: string;
  rowEven: string;
  border: string;
  accent: string;
}

export const RECAP_THEMES: Record<string, { label: string; colors: ThemeColors }> = {
  navy: {
    label: "Navy",
    colors: { primary: "#0F172A", primaryLight: "#1E293B", headerBg: "#0F172A", headerText: "#FFFFFF", rowEven: "#F8FAFC", border: "#CBD5E1", accent: "#2563EB" },
  },
  emerald: {
    label: "Emerald",
    colors: { primary: "#064E3B", primaryLight: "#065F46", headerBg: "#064E3B", headerText: "#FFFFFF", rowEven: "#F0FDF4", border: "#A7F3D0", accent: "#059669" },
  },
  royal: {
    label: "Royal",
    colors: { primary: "#1E1B4B", primaryLight: "#312E81", headerBg: "#1E1B4B", headerText: "#FFFFFF", rowEven: "#EEF2FF", border: "#C7D2FE", accent: "#6366F1" },
  },
  wine: {
    label: "Wine",
    colors: { primary: "#4C0519", primaryLight: "#881337", headerBg: "#4C0519", headerText: "#FFFFFF", rowEven: "#FFF1F2", border: "#FDA4AF", accent: "#E11D48" },
  },
  slate: {
    label: "Slate",
    colors: { primary: "#1E293B", primaryLight: "#334155", headerBg: "#1E293B", headerText: "#FFFFFF", rowEven: "#F8FAFC", border: "#CBD5E1", accent: "#475569" },
  },
};

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
    pembimbingSekolahNip: "",
    pembimbingSekolahTtd: "",
    pembimbingIndustriNip: "",
    pembimbingIndustriTtd: "",
  };
}
