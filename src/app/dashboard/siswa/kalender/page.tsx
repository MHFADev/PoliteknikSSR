"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarCheck, FileClock, NotebookPen, AlertCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { createClient } from "@/lib/supabase/client";
import { getEvents, getStudentAttendanceByMonth } from "@/actions/kalender";
import styles from "@/styles/pages/dashboard/siswa/Kalender.module.css";

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
    calendarCells.push(<div key={`empty-${i}`} className={styles.calendarCell + ' ' + styles.calendarCellDefault} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const status = getDayStatus(dateStr, records, leaves, events);
    const isLibur = events.some((e) => e.event_date === dateStr && e.tipe === "libur");
    const isPast = dateStr < todayStr;

    let cellClass = styles.calendarCellDefault;
    if (status?.color) {
      cellClass = status.color;
    } else if (isToday) {
      cellClass = styles.calendarCellToday;
    } else if (isPast && !isLibur) {
      cellClass = styles.calendarCellPast;
    }

    calendarCells.push(
      <div
        key={day}
        className={`${styles.calendarCell} ${cellClass}`}
      >
        <div className={`${styles.calendarDayNumber} ${isToday ? styles.calendarDayToday : styles.calendarDayNormal}`}>
          {day}
        </div>
        {status && (
          <div className={styles.calendarStatus}>
            <span className={`${styles.calendarStatusDot} ${status.dot}`} />
            <span className={styles.calendarStatusLabel}>{status.label}</span>
          </div>
        )}
        {isPast && !status && !isLibur && (
          <div className={styles.calendarStatus}>
            <span className={styles.calendarStatusDot} style={{ background: '#EF4444' }} />
            <span className={styles.calendarStatusLabel}>Alfa</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Kalender PKL</h1>
        <p>Pantau status absensi harian kamu.</p>
      </div>

      <div className={styles.statGrid}>
        <StatCard label="Hadir" value={stats.hadir} icon={<CalendarCheck className="h-5 w-5" />} accent="leaf" />
        <StatCard label="Sakit" value={stats.sakit} icon={<AlertCircle className="h-5 w-5" />} accent="coral" />
        <StatCard label="Izin" value={stats.izin} icon={<FileClock className="h-5 w-5" />} accent="sun" />
        <StatCard label="Alfa" value={stats.alfa} icon={<NotebookPen className="h-5 w-5" />} accent="berry" />
      </div>

      <Card>
        <div className={styles.calendarNav}>
          <button onClick={prevMonth} className={styles.calendarNavBtn}><ChevronLeft className="h-5 w-5" /></button>
          <h3 className={styles.calendarNavTitle}>{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className={styles.calendarNavBtn}><ChevronRight className="h-5 w-5" /></button>
        </div>

        <div className={styles.dayHeaders}>
          {DAYS.map((d) => (
            <div key={d} className={styles.dayHeader}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div className={styles.loadingSpinner}><Loader2 className="h-6 w-6 animate-spin text-steel" /></div>
        ) : (
          <div className={styles.calendarGrid}>{calendarCells}</div>
        )}
      </Card>

      <div className={styles.legendContainer}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#22C55E' }} /> Masuk</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#FBBF24' }} /> Izin</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#F97316' }} /> Sakit</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#EF4444' }} /> Alfa</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#22C55E' }} /> Libur PKL</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#3B82F6' }} /> Event</span>
      </div>
    </div>
  );
}
