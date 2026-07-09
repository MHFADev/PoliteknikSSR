"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getAllEvents, addEvent, updateEvent, deleteEvent } from "@/actions/kalender";

const EVENT_COLORS = {
  libur: { bg: "bg-green-200", text: "text-green-900", dot: "bg-green-500" },
  event: { bg: "bg-blue-200", text: "text-blue-900", dot: "bg-blue-500" },
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
};

export default function AdminKalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function loadEvents() {
    setLoading(true);
    getAllEvents().then((data) => {
      setEvents(data as CalendarEvent[]);
      setLoading(false);
    });
  }

  useEffect(() => { loadEvents(); }, []);

  function prevMonth() { setCurrentDate(new Date(year, month - 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1)); }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const eventMap = new Map<string, CalendarEvent[]>();
  events.forEach((ev) => {
    const dateStr = ev.event_date;
    if (!eventMap.has(dateStr)) eventMap.set(dateStr, []);
    eventMap.get(dateStr)!.push(ev);
  });

  function getEventsForDate(dateStr: string) {
    return eventMap.get(dateStr) ?? [];
  }

  function openAdd() { setEditing(null); setError(null); setModalOpen(true); }

  function openEdit(ev: CalendarEvent) {
    setEditing(ev);
    setError(null);
    setModalOpen(true);
  }

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

    if (!title || !event_date) {
      setError("Judul dan tanggal harus diisi.");
      setIsSubmitting(false);
      return;
    }

    let result;
    if (editing) {
      result = await updateEvent(editing.id, title, description, event_date, end_date, tipe);
    } else {
      result = await addEvent(title, description, event_date, end_date, tipe);
    }

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message ?? "Gagal menyimpan.");
      return;
    }

    setModalOpen(false);
    setEditing(null);
    loadEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus event ini?")) return;
    await deleteEvent(id);
    loadEvents();
  }

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="min-h-[100px]" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = getEventsForDate(dateStr);
    const isToday = dateStr === todayStr;

    calendarCells.push(
      <div
        key={day}
        className={`min-h-[100px] rounded-xl border border-deep/6 p-1.5 transition-colors hover:border-deep/20 ${isToday ? "bg-blue-vibrant/5 border-blue-vibrant/30" : "bg-white"}`}
      >
        <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? "bg-blue-vibrant text-white" : "text-deep"}`}>
          {day}
        </div>
        <div className="space-y-0.5">
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              className={`group relative cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] font-medium ${EVENT_COLORS[ev.tipe].bg} ${EVENT_COLORS[ev.tipe].text}`}
            >
              <span className="truncate block">{ev.title}</span>
              <div className="absolute right-0.5 top-0.5 hidden gap-0.5 group-hover:flex">
                <button onClick={() => openEdit(ev)} className="rounded p-0.5 hover:bg-black/10"><Edit className="h-3 w-3" /></button>
                <button onClick={() => handleDelete(ev.id)} className="rounded p-0.5 hover:bg-black/10"><Trash2 className="h-3 w-3 text-danger" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-deep">Kalender PKL</h1>
          <p className="text-sm text-mist-dim">Atur hari libur dan event PKL.</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Event</Button>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
          <h3 className="font-display text-lg font-semibold text-deep">{MONTHS[month]} {year}</h3>
          <Button variant="ghost" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS.map((d) => (
            <div key={d} className="rounded-lg px-2 py-1.5 text-center text-xs font-semibold text-steel">{d}</div>
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
