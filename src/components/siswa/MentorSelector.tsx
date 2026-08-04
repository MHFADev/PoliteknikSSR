"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  Search,
  Loader2,
  X,
  GraduationCap,
  IdCard,
  Building2,
  Clock,
  Timer,
  Pencil,
  ChevronDown,
  Filter,
} from "lucide-react";
import { getAvailableMentors, getMyMentor, selectMentor } from "@/actions/student-mentors";
import type { MentorInfo, StudentMentorInfo } from "@/actions/student-mentors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface MentorSelectorProps {
  studentJurusanId?: string | null;
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
  const [jurusanFilter, setJurusanFilter] = useState("all");
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

    // Minta izin lokasi otomatis setelah berhasil memilih pembimbing
    requestLocationPermission();

    setTimeout(() => setSuccess(null), 3000);
  }

  /** Minta akses lokasi sekali — dipakai saat siswa memilih pembimbing. */
  function requestLocationPermission() {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  const filteredMentors = mentors.filter(
    (m) =>
      (jurusanFilter === "all" || m.jurusan === jurusanFilter) &&
      (m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.studyProgramName?.toLowerCase().includes(search.toLowerCase())),
  );

  const jurusanList = Array.from(
    new Map(
      mentors
        .filter((m) => m.jurusan && m.studyProgramName)
        .map((m) => [m.jurusan as string, { id: m.jurusan as string, nama: m.studyProgramName as string }]),
    ).values(),
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

  const mentorList = (
    <div className="bg-card border border-outline rounded-xl shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-outline bg-muted/30">
        <Search className="h-4 w-4 text-mist-dim shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau jurusan..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-deep placeholder:text-mist-dim"
          autoFocus
        />
        <button onClick={() => { setShowDropdown(false); setSearch(""); }} className="p-1 rounded-full hover:bg-muted text-mist-dim transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filter jurusan — semua pembimbing tampil, filter opsional */}
      {jurusanList.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-outline bg-muted/20 overflow-x-auto">
          <Filter className="h-3.5 w-3.5 text-mist-dim shrink-0" />
          <button
            onClick={() => setJurusanFilter("all")}
            className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              jurusanFilter === "all"
                ? "bg-sky text-white border-sky"
                : "bg-card text-mist-dim border-outline hover:border-sky/50"
            }`}
          >
            Semua
          </button>
          {jurusanList.map((j) => (
            <button
              key={j.id}
              onClick={() => setJurusanFilter(jurusanFilter === j.id ? "all" : j.id)}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                jurusanFilter === j.id
                  ? "bg-sky text-white border-sky"
                  : "bg-card text-mist-dim border-outline hover:border-sky/50"
              }`}
            >
              {j.nama}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto p-1.5">
        {filteredMentors.length === 0 ? (
          <p className="py-6 text-center text-xs text-mist-dim">Tidak ada pembimbing ditemukan</p>
        ) : (
          filteredMentors.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelectMentor(m.id)}
              disabled={selecting || m.id === myMentor?.mentorId}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-none bg-transparent text-left transition-all hover:bg-muted disabled:opacity-40 ${
                m.id === myMentor?.mentorId ? "bg-sky/5 ring-1 ring-sky/20" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-outline">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.fullName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <UserCog className="h-5 w-5 text-mist-dim" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-deep block truncate">{m.fullName}</span>
                <span className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${jurusanBadgeClass(m.studyProgramName)}`}>
                    {m.studyProgramName || "Umum"}
                  </span>
                  {m.jurusan === studentJurusanId && (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky/10 text-sky">Jurusan Anda</span>
                  )}
                </span>
              </div>
              {m.id === myMentor?.mentorId && (
                <span className="shrink-0 bg-leaf-soft text-leaf-deep text-[10px] font-bold px-2 py-0.5 rounded-full">Aktif</span>
              )}
              {selecting && <Loader2 className="h-4 w-4 animate-spin text-mist-dim shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ── Sudah punya pembimbing ──
  if (myMentor) {
    return (
      <>
        <div className="rounded-xl border border-outline bg-card overflow-hidden">
          <div className="bg-gradient-to-br from-sky/10 via-sky/5 to-transparent px-5 py-4 border-b border-outline">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-sky/30 shadow-sm">
                {myMentor.mentorAvatarUrl ? (
                  <img src={myMentor.mentorAvatarUrl} alt={myMentor.mentorName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <UserCog className="h-8 w-8 text-sky" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <GraduationCap className="h-3.5 w-3.5 text-sky" />
                  <p className="text-[10px] font-bold text-sky uppercase tracking-wider">Pembimbing PKL</p>
                </div>
                <h3 className="text-lg font-bold text-deep truncate">{myMentor.mentorName}</h3>
                <p className="text-xs text-mist-dim truncate">{myMentor.studyProgramName || "Pembimbing"}</p>
              </div>
              {profileMode && !showDropdown && (
                <button onClick={() => setConfirmChange(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-deep bg-card border border-outline rounded-lg hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Ganti
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-outline">
            <InfoRow
              icon={<IdCard className="h-4 w-4" />}
              label="NIP"
              value={myMentor.mentorNip || "-"}
            />
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label="Instansi"
              value={myMentor.mentorInstansi || myMentor.studyProgramName || "-"}
            />
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label="Jam Masuk"
              value={formatTime(myMentor.entryTime)}
              accent="leaf"
            />
            <InfoRow
              icon={<Timer className="h-4 w-4" />}
              label="Batas Telat"
              value={formatTime(myMentor.lateTime)}
              accent="amber"
            />
          </div>
        </div>

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

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3">{mentorList}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="mt-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="mt-2 text-xs text-leaf-deep bg-leaf-soft border border-leaf rounded-lg px-3 py-2">{success}</p>}
      </>
    );
  }

  // ── Belum memilih pembimbing ──
  return (
    <>
      <div className="rounded-xl border border-outline bg-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-deep">Pilih Pembimbing</h3>
            <p className="text-xs text-mist-dim">Anda belum memilih pembimbing PKL</p>
          </div>
        </div>

        <p className="text-xs text-mist-dim leading-relaxed mb-4">
          Pilih pembimbing yang akan membimbing Anda selama PKL. Pembimbing akan memantau kehadiran
          dan kegiatan harian Anda. Absensi hanya bisa dilakukan setelah memilih pembimbing.
        </p>

        <div>
          {!showDropdown ? (
            <button onClick={() => setShowDropdown(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-card border-2 border-dashed border-outline-strong rounded-xl text-sm cursor-pointer hover:border-sky hover:bg-sky/5 transition-all"
            >
              <span className="text-mist-dim font-medium">Pilih pembimbing...</span>
              <ChevronDown className="h-4 w-4 text-mist-dim" />
            </button>
          ) : null}

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {mentorList}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <p className="mt-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="mt-2 text-xs text-leaf-deep bg-leaf-soft border border-leaf rounded-lg px-3 py-2">{success}</p>}
      </div>
    </>
  );
}

function formatTime(t: string | null): string {
  if (!t) return "-";
  const [h, m] = t.split(":");
  return `${h}:${m}`;
}

const JURUSAN_COLORS = [
  "bg-sky/10 text-sky",
  "bg-violet-100 text-violet-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-teal-bg text-teal",
];

function jurusanBadgeClass(nama: string | null): string {
  if (!nama) return "bg-muted text-mist-dim";
  let hash = 0;
  for (let i = 0; i < nama.length; i++) {
    hash = (hash * 31 + nama.charCodeAt(i)) >>> 0;
  }
  return JURUSAN_COLORS[hash % JURUSAN_COLORS.length];
}

function InfoRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "leaf" | "amber";
}) {
  const accentClass =
    accent === "leaf"
      ? "text-leaf-deep"
      : accent === "amber"
        ? "text-amber-600"
        : "text-mist-dim";
  return (
    <div className="bg-card px-4 py-3 flex items-center gap-3">
      <div className={`shrink-0 ${accentClass}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-mist-dim uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-semibold truncate ${accentClass}`}>{value}</p>
      </div>
    </div>
  );
}
