"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, User, Hash, GraduationCap, UserCog, ArrowRight, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { completeProfile, getCurrentProfile, getStudyPrograms, getClasses } from "./actions"
import styles from "@/styles/pages/Register.module.css"

export default function CompleteProfilePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [identityNumber, setIdentityNumber] = useState("")
  const [kelas, setKelas] = useState("")
  const [jurusanId, setJurusanId] = useState("")
  const [instansi, setInstansi] = useState("")
  const [role, setRole] = useState<"siswa" | "pembimbing">("siswa")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [studyPrograms, setStudyPrograms] = useState<{ id: string; nama: string; kode: string }[]>([])
  const [classList, setClassList] = useState<{ id: string; nama: string }[]>([])

  useEffect(() => {
    Promise.all([
      getCurrentProfile(),
      getStudyPrograms(),
      getClasses(),
    ]).then(([profile, programs, classes]) => {
      if (!profile) return router.replace("/login")
      setRole(profile.role as "siswa" | "pembimbing")
      if (profile.full_name && profile.full_name !== "Pengguna Baru") setFullName(profile.full_name)
      if (profile.identity_number) setIdentityNumber(profile.identity_number)
      if (profile.kelas) setKelas(profile.kelas)
      if (profile.jurusan_id) setJurusanId(profile.jurusan_id)
      if (profile.instansi) setInstansi(profile.instansi)
      setStudyPrograms(Array.isArray(programs) ? programs : [])
      setClassList(Array.isArray(classes) ? classes : [])
    }).catch(() => router.replace("/login")).finally(() => setLoading(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fullName.trim()) { setError("Nama lengkap wajib diisi."); return }
    if (!identityNumber.trim()) { setError("Nomor induk wajib diisi."); return }
    if (role === "siswa" && !kelas.trim()) { setError("Pilih kelas."); return }
    if (!jurusanId) { setError("Pilih jurusan."); return }
    if (role === "siswa" && !instansi.trim()) { setError("Instansi PKL wajib diisi."); return }

    setSaving(true)
    const result = await completeProfile({
      fullName: fullName.trim(),
      role,
      jurusanId,
      identityNumber: identityNumber.trim(),
      instansi: role === "siswa" ? instansi.trim() : undefined,
      kelas: role === "siswa" ? kelas.trim() : undefined,
    })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setDone(true)
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.formSection}>
          <div className={styles.formCard} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </main>
    )
  }

  if (done) {
    return (
      <main className={styles.main}>
        <div className={styles.formSection}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.formCard}>
            <div className={styles.successSection}>
              <div className={styles.successIconWrapper}>
                <CheckCircle className={styles.successIcon} />
              </div>
              <h2 className={styles.successTitle}>Data Tersimpan!</h2>
              <p className={styles.successDesc}>Lanjutkan ke dashboard untuk mulai menggunakan aplikasi.</p>
              <button type="button" onClick={() => router.replace("/")} className={styles.submitBtn}>
                <ArrowRight className={styles.btnIcon} />
                <span>Masuk ke Dashboard</span>
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.formSection}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={styles.formCard}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Lengkapi Data Diri</h1>
              <p className={styles.formSubtitle}>Isi data berikut sebelum masuk ke dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="role">Saya login sebagai</label>
                <div className={styles.roleGroup}>
                  <label className={`${styles.roleOption} ${role === "siswa" ? styles.roleOptionActive : ""}`}>
                    <input type="radio" name="role" value="siswa" checked={role === "siswa"} onChange={() => setRole("siswa")} className={styles.roleInput} />
                    <GraduationCap className={styles.roleIcon} />
                    <span className={styles.roleName}>Siswa</span>
                  </label>
                  <label className={`${styles.roleOption} ${role === "pembimbing" ? styles.roleOptionActive : ""}`}>
                    <input type="radio" name="role" value="pembimbing" checked={role === "pembimbing"} onChange={() => setRole("pembimbing")} className={styles.roleInput} />
                    <UserCog className={styles.roleIcon} />
                    <span className={styles.roleName}>Pembimbing</span>
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="fullName">Nama Lengkap</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} />
                  <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda" className={`${styles.input} ${styles.inputWithIcon}`} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="identityNumber">{role === "siswa" ? "NISN" : "NIP / NIDN"}</label>
                <div className={styles.inputWrapper}>
                  <Hash className={styles.inputIcon} />
                  <input id="identityNumber" type="text" required value={identityNumber} onChange={(e) => setIdentityNumber(e.target.value)}
                    placeholder={role === "siswa" ? "Nomor Induk Siswa Nasional" : "Nomor Induk Pegawai"} className={`${styles.input} ${styles.inputWithIcon}`} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="jurusanId">{role === "siswa" ? "Program Studi" : "Jurusan yang Dibimbing"}</label>
                <select id="jurusanId" required value={jurusanId} onChange={(e) => setJurusanId(e.target.value)}
                  className={`${styles.select} ${!jurusanId ? styles.selectPlaceholder : ""}`}>
                  <option value="" disabled>Pilih jurusan</option>
                  {studyPrograms.map((sp) => <option key={sp.id} value={sp.id}>{sp.nama}</option>)}
                </select>
              </div>

              {role === "siswa" && (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="kelas">Kelas</label>
                    <select id="kelas" required value={kelas} onChange={(e) => setKelas(e.target.value)}
                      className={`${styles.select} ${!kelas ? styles.selectPlaceholder : ""}`}>
                      <option value="" disabled>Pilih kelas</option>
                      {classList.map((c) => <option key={c.id} value={c.nama}>{c.nama}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="instansi">Instansi / Tempat PKL</label>
                    <input id="instansi" type="text" required value={instansi} onChange={(e) => setInstansi(e.target.value)}
                      placeholder="Nama perusahaan / instansi tempat PKL" className={styles.input} />
                  </div>
                </>
              )}

              {error && <motion.p initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={styles.errorBox}>{error}</motion.p>}

              <button type="submit" disabled={saving} className={styles.submitBtn}>
                {saving ? <Loader2 className={styles.btnSpinner} /> : <ArrowRight className={styles.btnIcon} />}
                <span>{saving ? "Menyimpan..." : "Simpan & Lanjutkan"}</span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  )
}