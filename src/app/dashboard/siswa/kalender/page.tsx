"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarCheck, FileClock, NotebookPen, AlertCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { createClient } from "@/lib/supabase/client";
import { getEvents, getStudentAttendanceByMonth } from "@/actions/kalender";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

type CalendarEvent = { id: string; title: string; description: string | null; event_date: string; end_date: string | null; tipe: "libur" | "event"; student_id: string | null };
type AttendanceRecord = { scanned_at: string; status: string };
type LeaveRequest = { start_date: string; end_date: string; type: string; status: string };

function getDayStatus(dayStr: string, records: AttendanceRecord[], leaves: LeaveRequest[], events: CalendarEvent[]): { label: string; color: string; dot: string } | null {
  if (events.some((e) => e.event_date === dayStr && e.tipe === "libur")) {
    return { label: "Libur PKL", color: "bg-flip7-coral-light/20 border-flip7-coral", dot: "bg-flip7-coral" };
  }
  const leave = leaves.find((l) => dayStr >= l.start_date && dayStr <= l.end_date);
  if (leave) {
    if (leave.type === "sakit") return { label: "Sakit", color: "bg-coral-soft border-coral", dot: "bg-coral" };
    if (leave.type === "izin") return { label: "Izin", color: "bg-sun-soft border-sun", dot: "bg-sun" };
  }
  const record = records.find((r) => r.scanned_at.slice(0, 10) === dayStr);
  if (record) return { label: "Masuk", color: "bg-leaf-soft border-leaf", dot: "bg-leaf" };
  return null;
}

export default function SiswaKalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  function loadData() {
    setLoading(true);
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      Promise.all([
        getEvents(year, month + 1, user.id),
        getStudentAttendanceByMonth(user.id, year, month + 1),
      ]).then(([evts, data]) => {
        setEvents(evts as CalendarEvent[]);
        setRecords(data.records);
        setLeaves(data.leaves);

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let hadir = 0, sakit = 0, izin = 0, alfa = 0;

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          if (dateStr > todayStr) break;
          const status = getDayStatus(dateStr, data.records, data.leaves, evts as CalendarEvent[]);
          if (!status) alfa++;
          else if (status.label === "Masuk" || status.label === "Libur PKL") hadir++;
          else if (status.label === "Sakit") sakit++;
          else if (status.label === "Izin") izin++;
        }

        setStats({ hadir, sakit, izin, alfa, total: hadir + sakit + izin + alfa });
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
    calendarCells.push(<div key={`empty-${i}`} className="min-h-[50px] sm:min-h-[80px]" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const status = getDayStatus(dateStr, records, leaves, events);
    const isLibur = events.some((e) => e.event_date === dateStr && e.tipe === "libur");
    const isPast = dateStr < todayStr;

    calendarCells.push(
      <div
        key={day}
        className={`min-h-[50px] sm:min-h-[80px] rounded-lg sm:rounded-xl border p-1 transition-colors sm:p-1.5 ${
          status?.color ?? (isToday ? "border-blue-vibrant/30 bg-blue-vibrant/5" : isPast && !isLibur ? "border-red-200 bg-red-50/50" : "border-deep/6 bg-white")
        }`}
      >
        <div className={`mb-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium sm:h-6 sm:w-6 sm:text-xs ${isToday ? "bg-blue-vibrant text-white" : "text-deep"}`}>
          {day}
        </div>
        {status && (
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${status.dot}`} />
            <span className="text-[8px] font-medium text-deep sm:text-[10px]">{status.label}</span>
          </div>
        )}
        {isPast && !status && !isLibur && (
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 sm:h-2 sm:w-2" />
            <span className="text-[8px] font-medium text-deep sm:text-[10px]">Alfa</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-deep sm:text-2xl">Kalender PKL</h1>
        <p className="text-xs text-mist-dim sm:text-sm">Pantau status absensi harian kamu.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Hadir" value={stats.hadir} icon={<CalendarCheck className="h-5 w-5" />} accent="leaf" />
        <StatCard label="Sakit" value={stats.sakit} icon={<AlertCircle className="h-5 w-5" />} accent="coral" />
        <StatCard label="Izin" value={stats.izin} icon={<FileClock className="h-5 w-5" />} accent="sun" />
        <StatCard label="Alfa" value={stats.alfa} icon={<NotebookPen className="h-5 w-5" />} accent="berry" />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={prevMonth} className="rounded-xl px-3 py-2 text-steel hover:bg-deep/5"><ChevronLeft className="h-5 w-5" /></button>
          <h3 className="font-display text-lg font-semibold text-deep">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="rounded-xl px-3 py-2 text-steel hover:bg-deep/5"><ChevronRight className="h-5 w-5" /></button>
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
