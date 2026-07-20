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
  Calendar,
  BookOpen,
} from "lucide-react";
import { getAvailableMentors, getMyMentor, selectMentor } from "@/actions/student-mentors";
import type { MentorInfo, StudentMentorInfo } from "@/actions/student-mentors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface MentorSelectorProps {
  studentJurusanId?: string | null;
  /** Jika true, tampilkan tombol ganti & info lengkap (mode profile) */
  profileMode?: boolean;
  onMentorSelected?: () => void;
}

export function MentorSelector({ studentJurusanId, profileMode = false, onMentorSelected }: MentorSelectorProps) {
  const [myMentor, setMyMentor] = useState<StudentMentorInfo | null>(null);
  const [mentors, setMentors] = useState<MentorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmChange, setConfirmChange] = useState(false);

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
    setConfirmChange(false);
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
      <div className="rounded-xl border border-outline bg-card p-5">
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-mist-dim" />
          <span className="text-sm text-mist-dim">Memuat data pembimbing...</span>
        </div>
      </div>
    );
  }

  // ── Sudah punya pembimbing ──
  if (myMentor) {
    return (
      <>
        <div className="rounded-xl border border-outline bg-card p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {myMentor.mentorAvatarUrl ? (
                  <img
                    src={myMentor.mentorAvatarUrl}
                    alt={myMentor.mentorName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <UserCog className="h-5 w-5 text-sky" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-deep">Pembimbing Anda</h3>
                <p className="text-xs text-mist-dim">Sudah memilih pembimbing</p>
              </div>
            </div>
          </div>

          {/* Info Lengkap Pembimbing */}
          <div className="rounded-lg bg-muted p-3 space-y-0">
            <div className="flex justify-between py-2 border-b border-outline">
              <span className="text-xs text-mist-dim flex items-center gap-1.5">
                <UserCog className="h-3.5 w-3.5" /> Nama
              </span>
              <span className="text-xs font-medium text-deep">{myMentor.mentorName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-outline">
              <span className="text-xs text-mist-dim flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Jurusan
              </span>
              <span className="text-xs font-medium text-deep">{myMentor.studyProgramName || "-"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs text-mist-dim flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Ditunjuk sejak
              </span>
              <span className="text-xs font-medium text-deep">
                {new Date(myMentor.assignedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="mt-2 text-xs text-leaf-deep bg-leaf-soft border border-leaf rounded-lg px-3 py-2">{success}</p>
          )}
        </div>

        {/* Confirm Dialog untuk ganti pembimbing */}
        <ConfirmDialog
          open={confirmChange}
          onClose={() => setConfirmChange(false)}
          onConfirm={() => { setShowDropdown(true); setConfirmChange(false); }}
          title="Ganti Pembimbing?"
          message="Apakah Anda yakin ingin mengganti pembimbing? Pilihan Anda akan diperbarui."
          confirmLabel="Ya, Ganti"
          cancelLabel="Batal"
          variant="warning"
        />

        {/* Dropdown ganti pembimbing — hanya muncul di profile mode atau setelah konfirmasi */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-outline bg-card overflow-hidden"
            >
              <div className="p-3">
                <div className="flex items-center gap-2 px-2 pb-2 border-b border-outline">
                  <Search className="h-4 w-4 text-mist-dim" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari pembimbing..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-deep placeholder:text-mist-dim"
                    autoFocus
                  />
                  <button
                    onClick={() => { setShowDropdown(false); setSearch(""); }}
                    className="p-1 rounded-full hover:bg-muted text-mist-dim transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto mt-1">
                  {filteredMentors.length === 0 ? (
                    <p className="py-4 text-center text-xs text-mist-dim">Tidak ada pembimbing ditemukan</p>
                  ) : (
                    filteredMentors.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMentor(m.id)}
                        disabled={selecting || m.id === myMentor.mentorId}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-none bg-transparent text-left transition-colors ${
                          m.id === myMentor.mentorId ? "bg-sky/5" : "hover:bg-muted"
                        } disabled:opacity-50`}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.fullName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <UserCog className="h-4 w-4 text-mist-dim" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-deep block">{m.fullName}</span>
                          <span className="text-xs text-mist-dim">{m.studyProgramName || "-"}</span>
                        </div>
                        {m.id === myMentor.mentorId && (
                          <Check className="h-4 w-4 text-leaf-deep flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tombol ganti — tampil di profile mode */}
        {profileMode && !showDropdown && (
          <button
            onClick={() => setConfirmChange(true)}
            className="mt-3 w-full py-2.5 text-sm font-medium text-mist-dim bg-muted border border-outline rounded-lg hover:bg-surface-elevated transition-colors"
          >
            Ganti Pembimbing
          </button>
        )}
      </>
    );
  }

  // ── Belum memilih pembimbing ──
  return (
    <>
      <div className="rounded-xl border border-outline bg-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gold-light flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-gold-dark" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-deep">Pilih Pembimbing</h3>
            <p className="text-xs text-mist-dim">Anda belum memilih pembimbing PKL</p>
          </div>
        </div>

        <p className="text-xs text-mist-dim leading-relaxed mb-4">
          Pilih pembimbing yang akan membimbing Anda selama PKL. Pembimbing akan memantau kehadiran
          dan kegiatan harian Anda.
        </p>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-card border border-outline rounded-lg text-sm cursor-pointer hover:border-sky transition-colors"
          >
            <span className="text-mist-dim">Pilih pembimbing...</span>
            <ChevronDown className="h-4 w-4 text-mist-dim" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-1 bg-card border border-outline rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-outline">
                  <Search className="h-4 w-4 text-mist-dim" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama atau jurusan..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-deep placeholder:text-mist-dim"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredMentors.length === 0 ? (
                    <p className="py-4 text-center text-xs text-mist-dim">Tidak ada pembimbing tersedia</p>
                  ) : (
                    filteredMentors.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMentor(m.id)}
                        disabled={selecting}
                        className="w-full flex items-center gap-3 px-3 py-2.5 border-none bg-transparent text-left hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.fullName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <UserCog className="h-4 w-4 text-mist-dim" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-deep block">{m.fullName}</span>
                          <span className="text-xs text-mist-dim">{m.studyProgramName || "-"}</span>
                        </div>
                        {selecting && <Loader2 className="h-4 w-4 animate-spin text-mist-dim" />}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p className="mt-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="mt-2 text-xs text-leaf-deep bg-leaf-soft border border-leaf rounded-lg px-3 py-2">{success}</p>
        )}
      </div>
    </>
  );
}
