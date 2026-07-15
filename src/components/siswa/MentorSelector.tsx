"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  Check,
  ChevronDown,
  Search,
  Loader2,
  X,
  GraduationCap,
} from "lucide-react";
import { getAvailableMentors, getMyMentor, selectMentor } from "@/actions/student-mentors";
import type { MentorInfo, StudentMentorInfo } from "@/actions/student-mentors";

interface MentorSelectorProps {
  studentJurusanId?: string | null;
  onMentorSelected?: () => void;
}

export function MentorSelector({ studentJurusanId, onMentorSelected }: MentorSelectorProps) {
  const [myMentor, setMyMentor] = useState<StudentMentorInfo | null>(null);
  const [mentors, setMentors] = useState<MentorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mentor, availableMentors] = await Promise.all([
        getMyMentor(),
        getAvailableMentors(studentJurusanId || undefined),
      ]);
      setMyMentor(mentor);
      setMentors(availableMentors);
    } catch {
      setError("Gagal memuat data pembimbing.");
    }
    setLoading(false);
  }

  async function handleSelectMentor(mentorId: string) {
    setSelecting(true);
    setError(null);
    setSuccess(null);

    const result = await selectMentor(mentorId);
    setSelecting(false);

    if (!result.success) {
      setError(result.message || "Gagal memilih pembimbing.");
      return;
    }

    setSuccess("Pembimbing berhasil dipilih!");
    setShowDropdown(false);
    setSearch("");
    await loadData();
    onMentorSelected?.();
    setTimeout(() => setSuccess(null), 3000);
  }

  const filteredMentors = mentors.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.studyProgramName?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.loadingContainer}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#64748B" }} />
          <span style={styles.loadingText}>Memuat data pembimbing...</span>
        </div>
      </div>
    );
  }

  if (myMentor) {
    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardHeaderLeft}>
            <div style={styles.mentorAvatar}>
              {myMentor.mentorAvatarUrl ? (
                <img
                  src={myMentor.mentorAvatarUrl}
                  alt={myMentor.mentorName}
                  style={styles.avatarImg}
                />
              ) : (
                <UserCog className="h-5 w-5" style={{ color: "#2563EB" }} />
              )}
            </div>
            <div>
              <h3 style={styles.cardTitle}>Pembimbing Anda</h3>
              <p style={styles.cardSubtitle}>Sudah memilih pembimbing</p>
            </div>
          </div>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={styles.changeBtn}
            disabled={selecting}
          >
            Ganti
          </button>
        </div>

        <div style={styles.mentorInfo}>
          <div style={styles.mentorInfoRow}>
            <span style={styles.mentorInfoLabel}>Nama</span>
            <span style={styles.mentorInfoValue}>{myMentor.mentorName}</span>
          </div>
          <div style={styles.mentorInfoRow}>
            <span style={styles.mentorInfoLabel}>Jurusan</span>
            <span style={styles.mentorInfoValue}>{myMentor.studyProgramName || "-"}</span>
          </div>
          <div style={styles.mentorInfoRow}>
            <span style={styles.mentorInfoLabel}>Ditunjuk sejak</span>
            <span style={styles.mentorInfoValue}>
              {new Date(myMentor.assignedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.dropdownContainer}
            >
              <div style={styles.searchWrapper}>
                <Search className="h-4 w-4" style={{ color: "#94A3B8" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari pembimbing..."
                  style={styles.searchInput}
                  autoFocus
                />
                <button onClick={() => { setShowDropdown(false); setSearch(""); }} style={styles.closeBtn}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div style={styles.mentorList}>
                {filteredMentors.length === 0 ? (
                  <p style={styles.emptyText}>Tidak ada pembimbing ditemukan</p>
                ) : (
                  filteredMentors.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMentor(m.id)}
                      disabled={selecting || m.id === myMentor.mentorId}
                      style={{
                        ...styles.mentorOption,
                        ...(m.id === myMentor.mentorId ? styles.mentorOptionActive : {}),
                      }}
                    >
                      <div style={styles.mentorOptionAvatar}>
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.fullName} style={styles.avatarImgSmall} />
                        ) : (
                          <UserCog className="h-4 w-4" style={{ color: "#64748B" }} />
                        )}
                      </div>
                      <div style={styles.mentorOptionInfo}>
                        <span style={styles.mentorOptionName}>{m.fullName}</span>
                        <span style={styles.mentorOptionMeta}>{m.studyProgramName || "-"}</span>
                      </div>
                      {m.id === myMentor.mentorId && (
                        <Check className="h-4 w-4" style={{ color: "#22C55E" }} />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p style={styles.errorText}>{error}</p>}
        {success && <p style={styles.successText}>{success}</p>}
      </div>
    );
  }

  // No mentor selected yet
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <div style={{ ...styles.mentorAvatar, background: "#FEF3C7" }}>
            <GraduationCap className="h-5 w-5" style={{ color: "#D97706" }} />
          </div>
          <div>
            <h3 style={styles.cardTitle}>Pilih Pembimbing</h3>
            <p style={styles.cardSubtitle}>Anda belum memilih pembimbing PKL</p>
          </div>
        </div>
      </div>

      <p style={styles.description}>
        Pilih pembimbing yang akan membimbing Anda selama PKL. Pembimbing akan memantau kehadiran
        dan kegiatan harian Anda.
      </p>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={styles.selectTrigger}
        >
          <span style={styles.selectPlaceholder}>Pilih pembimbing...</span>
          <ChevronDown className="h-4 w-4" style={{ color: "#94A3B8" }} />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={styles.dropdownFloating}
            >
              <div style={styles.searchWrapper}>
                <Search className="h-4 w-4" style={{ color: "#94A3B8" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau jurusan..."
                  style={styles.searchInput}
                  autoFocus
                />
              </div>
              <div style={styles.mentorList}>
                {filteredMentors.length === 0 ? (
                  <p style={styles.emptyText}>Tidak ada pembimbing tersedia</p>
                ) : (
                  filteredMentors.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMentor(m.id)}
                      disabled={selecting}
                      style={styles.mentorOption}
                    >
                      <div style={styles.mentorOptionAvatar}>
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.fullName} style={styles.avatarImgSmall} />
                        ) : (
                          <UserCog className="h-4 w-4" style={{ color: "#64748B" }} />
                        )}
                      </div>
                      <div style={styles.mentorOptionInfo}>
                        <span style={styles.mentorOptionName}>{m.fullName}</span>
                        <span style={styles.mentorOptionMeta}>{m.studyProgramName || "-"}</span>
                      </div>
                      {selecting && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#64748B" }} />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}
      {success && <p style={styles.successText}>{success}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "0.75rem",
    padding: "1.25rem",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "1.5rem",
  },
  loadingText: {
    fontSize: "0.875rem",
    color: "#64748B",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  cardHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  mentorAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarImgSmall: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
  },
  cardTitle: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#0F172A",
    margin: 0,
  },
  cardSubtitle: {
    fontSize: "0.75rem",
    color: "#64748B",
    margin: "0.125rem 0 0",
  },
  changeBtn: {
    padding: "0.375rem 0.75rem",
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
  },
  mentorInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0",
    background: "#F8FAFC",
    borderRadius: "0.5rem",
    padding: "0.75rem",
  },
  mentorInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    borderBottom: "1px solid #F1F5F9",
  },
  mentorInfoLabel: {
    fontSize: "0.8125rem",
    color: "#64748B",
  },
  mentorInfoValue: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "#1E293B",
  },
  dropdownContainer: {
    marginTop: "0.75rem",
    overflow: "hidden",
  },
  dropdownFloating: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "0.25rem",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "0.5rem",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 50,
    overflow: "hidden",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderBottom: "1px solid #E2E8F0",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "0.8125rem",
    background: "transparent",
    color: "#1E293B",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94A3B8",
    padding: "0.25rem",
    display: "flex",
  },
  mentorList: {
    maxHeight: "240px",
    overflowY: "auto" as const,
  },
  mentorOption: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.625rem 0.75rem",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background 0.15s",
  },
  mentorOptionActive: {
    background: "#EFF6FF",
  },
  mentorOptionAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  mentorOptionInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.0625rem",
  },
  mentorOptionName: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "#1E293B",
  },
  mentorOptionMeta: {
    fontSize: "0.6875rem",
    color: "#94A3B8",
  },
  selectTrigger: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.625rem 0.75rem",
    background: "#fff",
    border: "1px solid #CBD5E1",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  selectPlaceholder: {
    color: "#94A3B8",
  },
  description: {
    fontSize: "0.8125rem",
    color: "#64748B",
    lineHeight: 1.6,
    margin: "0 0 1rem",
  },
  emptyText: {
    padding: "1rem",
    textAlign: "center" as const,
    fontSize: "0.8125rem",
    color: "#94A3B8",
  },
  errorText: {
    marginTop: "0.5rem",
    fontSize: "0.8125rem",
    color: "#EF4444",
    padding: "0.5rem 0.75rem",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "0.375rem",
  },
  successText: {
    marginTop: "0.5rem",
    fontSize: "0.8125rem",
    color: "#16A34A",
    padding: "0.5rem 0.75rem",
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: "0.375rem",
  },
};
