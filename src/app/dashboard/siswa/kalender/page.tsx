"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { getEvents } from "@/actions/kalender";
import { formatDate } from "@/lib/utils";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

type CalendarEvent = { id: string; title: string; description: string | null; event_date: string; end_date: string | null; tipe: "libur" | "event" };
type AttendanceRecord = { scanned_at: string; status: string };
type LeaveRequest = { start_date: string; end_date: string; type: string; status: string };

function getDayStatus(dayStr: string, records: AttendanceRecord[], leaves: LeaveRequest[], events: CalendarEvent[]): { label: string; color: string; dot: string } | null {
  if (events.some((e) => e.event_date === dayStr && e.tipe === "libur")) {
    return { label: "Libur PKL", color: "bg-green-50 border-green-300", dot: "bg-green-500" };
  }

  const leave = leaves.find((l) => dayStr >= l.start_date && dayStr <= l.end_date);
  if (leave) {
    if (leave.type === "sakit") return { label: "Sakit", color: "bg-orange-50 border-orange-300", dot: "bg-orange-500" };
    if (leave.type === "izin") return { label: "Izin", color: "bg-yellow-50 border-yellow-300", dot: "bg-yellow-500" };
  }

  const record = records.find((r) => r.scanned_at.slice(0, 10) === dayStr);
  if (record) {
    return { label: "Masuk", color: "bg-green-50 border-green-300", dot: "bg-green-500" };
  }

  return null;
}

export default function SiswaKalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  function loadData() {
    setLoading(true);
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = new Date(year, month + 1, 0);
      const end = endDate.toISOString().slice(0, 10);

      Promise.all([
        getEvents(year, month + 1),
        supabase.from("attendance_records").select("scanned_at, status").eq("student_id", user.id).gte("scanned_at", start).lte("scanned_at", end),
        supabase.from("leave_requests").select("start_date, end_date, type, status").eq("student_id", user.id).eq("status", "disetujui"),
      ]).then(([evts, { data: recs }, { data: lvs }]) => {
        setEvents(evts as CalendarEvent[]);
        setRecords(recs ?? []);
        setLeaves(lvs ?? []);
        setLoading(false);
      });
    });
  }

  useEffect(() => { loadData(); }, [currentDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() { setCurrentDate(new Date(year, month - 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1)); }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="min-h-[80px]" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const status = getDayStatus(dateStr, records, leaves, events);
    const dayEvents = events.filter((e) => e.event_date === dateStr);

    calendarCells.push(
      <div
        key={day}
        className={`min-h-[80px] rounded-xl border p-1.5 transition-colors ${
          status?.color ?? (isToday ? "border-blue-vibrant/30 bg-blue-vibrant/5" : "border-deep/6 bg-white")
        }`}
      >
        <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? "bg-blue-vibrant text-white" : "text-deep"}`}>
          {day}
        </div>
        {status && (
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            <span className="text-[10px] font-medium text-deep">{status.label}</span>
          </div>
        )}
        {dayEvents.filter((e) => e.tipe === "event").map((ev) => (
          <div key={ev.id} className="mt-0.5 rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-800 truncate">
            {ev.title}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Kalender PKL</h1>
        <p className="text-sm text-mist-dim">Pantau status absensi harian kamu.</p>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={prevMonth} className="rounded-xl px-3 py-2 text-steel hover:bg-deep/5"><ChevronLeft className="h-5 w-5" /></button>
          <h3 className="font-display text-lg font-semibold text-deep">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="rounded-xl px-3 py-2 text-steel hover:bg-deep/5"><ChevronRight className="h-5 w-5" /></button>
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

      <div className="flex flex-wrap items-center gap-4 text-sm text-steel">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500" /> Masuk</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-yellow-500" /> Izin</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-orange-500" /> Sakit</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500" /> Alfa</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500" /> Libur PKL</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500" /> Event</span>
      </div>
    </div>
  );
}
