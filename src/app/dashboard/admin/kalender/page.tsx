"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  Loader2,
  CalendarCheck,
  Users,
  CalendarDays,
  Search,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  getAllEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  getAdminCalendarStats,
  getStudents,
} from "@/actions/kalender";
import type { CalendarEvent, User } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import styles from "@/styles/pages/dashboard/admin/Kalender.module.css";

const EVENT_COLORS = {
  libur: {
    bg: "bg-flip7-coral-light/20",
    text: "text-flip7-coral-dark",
    dot: "bg-flip7-coral",
  },
  event: { bg: "bg-teal-bg", text: "text-teal-dark", dot: "bg-teal" },
} as const;

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AdminKalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalSiswa: 0,
  });
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function loadData(silent = false) {
    if (!silent) setLoading(true);
    Promise.all([
      getAllEvents(search || undefined),
      getAdminCalendarStats(),
      getStudents(),
    ]).then(([evts, st, stds]) => {
      setEvents(evts as unknown as CalendarEvent[]);
      setStats(st);
      setStudents(stds as unknown as User[]);
      if (!silent) setLoading(false);
    });
  }

  useEffect(() => {
    loadData();
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: perbarui data otomatis saat admin lain menambah/edit/menghapus event
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("calendar-changes-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events" },
        () => loadData(true),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1));
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1));
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const monthEvents = events.filter((ev) => {
    const d = ev.eventDate.slice(0, 7);
    const target = `${year}-${String(month + 1).padStart(2, "0")}`;
    return d === target;
  });

  const eventMap = new Map<string, CalendarEvent[]>();
  monthEvents.forEach((ev) => {
    if (!eventMap.has(ev.eventDate)) eventMap.set(ev.eventDate, []);
    eventMap.get(ev.eventDate)!.push(ev);
  });

  function getEventsForDate(dateStr: string) {
    return eventMap.get(dateStr) ?? [];
  }

  function openAdd() {
    setEditing(null);
    setSelectedStudent("");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(ev: CalendarEvent) {
    setEditing(ev);
    setSelectedStudent(ev.studentId ?? "");
    setError(null);
    setModalOpen(true);
  }

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.identityNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studyProgramName?.toLowerCase().includes(studentSearch.toLowerCase()),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    const description = (form.get("description") as string) || null;
    const event_date = form.get("event_date") as string;
    const end_date = (form.get("end_date") as string) || null;
    const tipe = form.get("tipe") as "libur" | "event";
    const student_id = (form.get("student_id") as string) || null;

    if (!title || !event_date) {
      setError("Judul dan tanggal harus diisi.");
      setIsSubmitting(false);
      return;
    }

    let result;
    if (editing) {
      result = await updateEvent(
        editing.id,
        title,
        description,
        event_date,
        end_date,
        tipe,
        student_id,
      );
    } else {
      result = await addEvent(
        title,
        description,
        event_date,
        end_date,
        tipe,
        student_id,
      );
    }

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message ?? "Gagal menyimpan.");
      return;
    }

    setModalOpen(false);
    setEditing(null);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus event ini?")) return;
    await deleteEvent(id);
    loadData();
  }

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(
      <div key={`empty-${i}`} className={styles.calendarCell} />,
    );
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = getEventsForDate(dateStr);
    const isToday = dateStr === todayStr;

    calendarCells.push(
      <div
        key={day}
        className={`${styles.calendarCell} ${isToday ? styles.calendarCellToday : ""}`}
      >
        <div
          className={`${styles.calendarDayNumber} ${isToday ? styles.calendarDayToday : styles.calendarDayNormal}`}
        >
          {day}
        </div>
        <div className={styles.calendarEvents}>
          {dayEvents.slice(0, 2).map((ev) => (
            <div
              key={ev.id}
              className={`${styles.calendarEventItem} ${EVENT_COLORS[ev.tipe].bg} ${EVENT_COLORS[ev.tipe].text}`}
            >
              <span className="truncate block">{ev.title}</span>
              {dayEvents.length > 2 && (
                <span className={styles.eventMoreText}>
                  +{dayEvents.length - 2} lainnya
                </span>
              )}
              <div className={styles.eventActions}>
                <button
                  onClick={() => openEdit(ev)}
                  className={styles.eventActionBtn}
                >
                  <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className={styles.eventActionBtn}
                >
                  <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-danger" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>,
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeaderRow}>
        <div className={styles.pageHeader}>
          <h1>Kalender PKL</h1>
          <p>Atur event & libur untuk siswa PKL</p>
        </div>
        <Button onClick={openAdd} className={styles.addBtn}>
          <Plus className="h-4 w-4" /> Tambah Event
        </Button>
      </div>

      <div className={styles.statGrid}>
        <StatCard
          label="Total Event"
          value={stats.totalEvents}
          icon={<CalendarDays className="h-5 w-5" />}
          accent="teal"
        />
        <StatCard
          label="Event Mendatang"
          value={stats.upcomingEvents}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="sky"
        />
        <StatCard
          label="Total Siswa"
          value={stats.totalSiswa}
          icon={<Users className="h-5 w-5" />}
          accent="sun"
        />
      </div>

      <Card>
        <div className={styles.calendarNav}>
          <Button variant="ghost" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className={styles.calendarNavTitle}>
            {MONTHS[month]} {year}
          </h3>
          <Button variant="ghost" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className={styles.dayHeaders}>
          {DAYS.map((d) => (
            <div key={d} className={styles.dayHeader}>
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className={styles.loadingSpinner}>
            <Loader2 className="h-6 w-6 animate-spin text-steel" />
          </div>
        ) : (
          <div className={styles.calendarGrid}>{calendarCells}</div>
        )}
      </Card>

      <div className={styles.legendContainer}>
        <span className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: "#22C55E" }}
          />{" "}
          Libur PKL
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: "#3B82F6" }}
          />{" "}
          Event
        </span>
      </div>

      <Card className={styles.eventListCard}>
        <CardHeader
          title="Semua Event"
          action={
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari event atau siswa..."
                className={styles.searchInput}
              />
            </div>
          }
        />
        <div className={styles.eventList}>
          {loading ? (
            <div className={styles.loadingSpinner}>
              <Loader2 className="h-5 w-5 animate-spin text-steel" />
            </div>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-sm text-mist-dim">
              Belum ada event.
            </p>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className={styles.eventListItem}>
                <div className={styles.eventListInfo}>
                  <span
                    className={`${styles.eventListDot} ${EVENT_COLORS[ev.tipe].dot}`}
                  />
                  <div className="min-w-0">
                    <p className={styles.eventListTitle}>{ev.title}</p>
                    <p className={styles.eventListMeta}>
                      {formatDate(ev.eventDate)}
                      {ev.endDate && ` — ${formatDate(ev.endDate)}`}
                      {ev.creatorName && ` · ${ev.creatorName}`}
                    </p>
                  </div>
                </div>
                <div className={styles.eventListActions}>
                  <button
                    onClick={() => openEdit(ev)}
                    className={styles.eventListActionBtn}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className={styles.eventListActionBtn}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setError(null);
        }}
        title={editing ? "Edit Event" : "Tambah Event"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={styles.formField}>
            <label className={styles.formLabel}>Judul</label>
            <input
              name="title"
              type="text"
              required
              defaultValue={editing?.title ?? ""}
              placeholder="Libur PKL"
              className={styles.formInput}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Deskripsi (opsional)</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editing?.description ?? ""}
              placeholder="Keterangan..."
              className={styles.formTextarea}
            />
          </div>
          <div className={styles.formGrid2Col}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Tanggal Mulai</label>
              <input
                name="event_date"
                type="date"
                required
                defaultValue={editing?.eventDate ?? ""}
                className={styles.formInput}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                Tanggal Selesai (opsional)
              </label>
              <input
                name="end_date"
                type="date"
                defaultValue={editing?.endDate ?? ""}
                className={styles.formInput}
              />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Tipe</label>
            <select
              name="tipe"
              defaultValue={editing?.tipe ?? "event"}
              className={styles.formSelect}
            >
              <option value="libur">Libur PKL</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>
              Siswa (opsional — kosongkan jika untuk semua)
            </label>
            <div className="relative">
              <input
                value={
                  showStudentPicker
                    ? studentSearch
                    : editing
                      ? students.find((s) => s.id === editing?.studentId)
                          ?.fullName || "Semua Siswa"
                      : selectedStudent
                        ? students.find((s) => s.id === selectedStudent)
                            ?.fullName || "Semua Siswa"
                        : "Semua Siswa"
                }
                onChange={(e) => {
                  setShowStudentPicker(true);
                  setStudentSearch(e.target.value);
                }}
                onFocus={() => setShowStudentPicker(true)}
                placeholder="Cari siswa..."
                className={styles.studentPickerInput}
              />
              {showStudentPicker && (
                <div className={styles.studentPickerDropdown}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent("");
                      setShowStudentPicker(false);
                      setStudentSearch("");
                    }}
                    className={`${styles.studentPickerOption} ${!selectedStudent ? styles.studentPickerOptionActive : ""}`}
                  >
                    Semua Siswa (Global)
                  </button>
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(s.id);
                        setShowStudentPicker(false);
                        setStudentSearch("");
                      }}
                      className={`${styles.studentPickerOption} ${selectedStudent === s.id ? styles.studentPickerOptionActive : ""}`}
                    >
                      <span className={styles.studentPickerName}>
                        {s.fullName}
                      </span>
                      <span className={styles.studentPickerMeta}>
                        {s.studyProgramName || "-"}
                      </span>
                    </button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className={styles.studentPickerEmpty}>Tidak ditemukan</p>
                  )}
                </div>
              )}
              <input type="hidden" name="student_id" value={selectedStudent} />
            </div>
          </div>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
                setError(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
