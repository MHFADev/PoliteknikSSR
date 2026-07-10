"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit, Loader2, CalendarCheck, Users, CalendarDays, Search } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { getAllEvents, addEvent, updateEvent, deleteEvent, getAdminCalendarStats, getStudents } from "@/actions/kalender";
import { formatDate } from "@/lib/utils";

const EVENT_COLORS = {
  libur: { bg: "bg-flip7-coral-light/20", text: "text-flip7-coral-dark", dot: "bg-flip7-coral" },
  event: { bg: "bg-teal-bg", text: "text-teal-dark", dot: "bg-teal" },
} as const;

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  tipe: "libur" | "event";
  student_id: string | null;
  profiles: { full_name: string; identity_number: string } | null;
};

type Student = {
  id: string;
  full_name: string;
  identity_number: string | null;
  kelas: string | null;
  jurusan_id: string | null;
  study_programs: { nama: string } | null;
};

export default function AdminKalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0, totalSiswa: 0 });
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function loadData() {
    setLoading(true);
    Promise.all([
      getAllEvents(search || undefined),
      getAdminCalendarStats(),
      getStudents(),
    ]).then(([evts, st, stds]) => {
      setEvents(evts as CalendarEvent[]);
      setStats(st);
      setStudents(stds as Student[]);
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() { setCurrentDate(new Date(year, month - 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1)); }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const monthEvents = events.filter((ev) => {
    const d = ev.event_date.slice(0, 7);
    const target = `${year}-${String(month + 1).padStart(2, "0")}`;
    return d === target;
  });

  const eventMap = new Map<string, CalendarEvent[]>();
  monthEvents.forEach((ev) => {
    if (!eventMap.has(ev.event_date)) eventMap.set(ev.event_date, []);
    eventMap.get(ev.event_date)!.push(ev);
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
    setSelectedStudent(ev.student_id ?? "");
    setError(null);
    setModalOpen(true);
  }

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.identity_number?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.study_programs?.nama?.toLowerCase().includes(studentSearch.toLowerCase())
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
      result = await updateEvent(editing.id, title, description, event_date, end_date, tipe, student_id);
    } else {
      result = await addEvent(title, description, event_date, end_date, tipe, student_id);
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
    calendarCells.push(<div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[100px]" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = getEventsForDate(dateStr);
    const isToday = dateStr === todayStr;

    calendarCells.push(
      <div
        key={day}
        className={`min-h-[60px] sm:min-h-[100px] rounded-lg sm:rounded-xl border border-deep/6 p-1 transition-colors hover:border-deep/20 sm:p-1.5 ${isToday ? "bg-blue-vibrant/5 border-blue-vibrant/30" : "bg-white"}`}
      >
        <div className={`mb-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium sm:h-6 sm:w-6 sm:text-xs ${isToday ? "bg-blue-vibrant text-white" : "text-deep"}`}>
          {day}
        </div>
        <div className="space-y-0.5">
          {dayEvents.slice(0, 2).map((ev) => (
            <div
              key={ev.id}
              className={`group relative cursor-pointer rounded px-1 py-0.5 text-[9px] font-medium leading-tight sm:text-[11px] sm:px-1.5 sm:py-0.5 ${EVENT_COLORS[ev.tipe].bg} ${EVENT_COLORS[ev.tipe].text}`}
            >
              <span className="truncate block">{ev.title}</span>
              {dayEvents.length > 2 && <span className="text-[8px] text-steel sm:text-[10px]">+{dayEvents.length - 2} lainnya</span>}
              <div className="absolute right-0.5 top-0.5 hidden gap-0.5 group-hover:flex">
                <button onClick={() => openEdit(ev)} className="rounded p-0.5 hover:bg-black/10"><Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" /></button>
                <button onClick={() => handleDelete(ev.id)} className="rounded p-0.5 hover:bg-black/10"><Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-danger" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-deep sm:text-2xl">Kalender PKL</h1>
          <p className="text-xs text-mist-dim sm:text-sm">Atur event & libur untuk siswa PKL.</p>
        </div>
        <Button onClick={openAdd} className="w-full sm:w-auto"><Plus className="h-4 w-4" /> Tambah Event</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total Event" value={stats.totalEvents} icon={<CalendarDays className="h-5 w-5" />} accent="teal" />
        <StatCard label="Event Mendatang" value={stats.upcomingEvents} icon={<CalendarCheck className="h-5 w-5" />} accent="sky" />
        <StatCard label="Total Siswa" value={stats.totalSiswa} icon={<Users className="h-5 w-5" />} accent="sun" />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
          <h3 className="font-display text-lg font-semibold text-deep">{MONTHS[month]} {year}</h3>
          <Button variant="ghost" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
          {DAYS.map((d) => (
            <div key={d} className="rounded px-1 py-1 text-center text-[10px] font-semibold text-steel sm:rounded-lg sm:px-2 sm:py-1.5 sm:text-xs">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-steel" /></div>
        ) : (
          <div className="grid grid-cols-7 gap-1">{calendarCells}</div>
        )}
      </Card>

      <div className="flex items-center gap-4 text-sm text-steel">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500" /> Libur PKL</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500" /> Event</span>
      </div>

      <Card>
        <CardHeader title="Semua Event" action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari event atau siswa..."
              className="rounded-xl border border-deep/10 bg-white/80 pl-9 pr-3 py-2 text-sm outline-none focus:border-ocean w-64"
            />
          </div>
        } />
        <div className="divide-y divide-deep/6">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-steel" /></div>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-sm text-mist-dim">Belum ada event.</p>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between px-4 py-3 hover:bg-deep/5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${EVENT_COLORS[ev.tipe].dot}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-deep truncate">{ev.title}</p>
                    <p className="text-xs text-mist-dim">
                      {formatDate(ev.event_date)}
                      {ev.end_date && ` — ${formatDate(ev.end_date)}`}
                      {ev.profiles && ` · ${ev.profiles.full_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(ev)} className="rounded-lg p-1.5 text-steel hover:bg-deep/5"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(ev.id)} className="rounded-lg p-1.5 text-steel hover:bg-deep/5"><Trash2 className="h-4 w-4 text-danger" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setError(null); }} title={editing ? "Edit Event" : "Tambah Event"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-deep">Judul</label>
            <input name="title" type="text" required defaultValue={editing?.title ?? ""} placeholder="Libur PKL" className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean" />
          </div>
          <div>
            <label className="text-sm font-medium text-deep">Deskripsi (opsional)</label>
            <textarea name="description" rows={2} defaultValue={editing?.description ?? ""} placeholder="Keterangan..." className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-deep">Tanggal Mulai</label>
              <input name="event_date" type="date" required defaultValue={editing?.event_date ?? ""} className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean" />
            </div>
            <div>
              <label className="text-sm font-medium text-deep">Tanggal Selesai (opsional)</label>
              <input name="end_date" type="date" defaultValue={editing?.end_date ?? ""} className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-deep">Tipe</label>
            <select name="tipe" defaultValue={editing?.tipe ?? "event"} className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean">
              <option value="libur">Libur PKL</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-deep">Siswa (opsional — kosongkan jika untuk semua)</label>
            <div className="relative">
              <input
                value={showStudentPicker ? studentSearch : (editing ? students.find(s => s.id === editing?.student_id)?.full_name || "Semua Siswa" : selectedStudent ? students.find(s => s.id === selectedStudent)?.full_name || "Semua Siswa" : "Semua Siswa")}
                onChange={(e) => { setShowStudentPicker(true); setStudentSearch(e.target.value); }}
                onFocus={() => setShowStudentPicker(true)}
                placeholder="Cari siswa..."
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
              />
              {showStudentPicker && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-deep/10 bg-white shadow-glass max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setSelectedStudent(""); setShowStudentPicker(false); setStudentSearch(""); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-deep/5 ${!selectedStudent ? "bg-blue-vibrant/10 font-medium" : "text-steel"}`}
                  >
                    Semua Siswa (Global)
                  </button>
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedStudent(s.id); setShowStudentPicker(false); setStudentSearch(""); }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-deep/5 ${selectedStudent === s.id ? "bg-blue-vibrant/10 font-medium" : "text-steel"}`}
                    >
                      <span className="text-deep">{s.full_name}</span>
                      <span className="ml-2 text-xs text-mist-dim">{s.study_programs?.nama || "-"}</span>
                    </button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="px-3 py-2 text-xs text-mist-dim">Tidak ditemukan</p>
                  )}
                </div>
              )}
              <input type="hidden" name="student_id" value={selectedStudent} />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setEditing(null); setError(null); }}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
