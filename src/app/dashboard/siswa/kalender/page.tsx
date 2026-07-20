"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarCheck,
  FileClock,
  NotebookPen,
  AlertCircle,
  CalendarDays,
  Clock,
  TrendingUp,
  CalendarOff,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { getEvents, getStudentAttendanceByMonth } from "@/actions/kalender";
import styles from "@/styles/pages/dashboard/siswa/Kalender.module.css";

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

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  tipe: "libur" | "event";
  studentId: string | null;
};
type AttendanceRecord = { scannedAt: string; status: string };
type LeaveRequest = {
  startDate: string;
  endDate: string;
  type: string;
  status: string;
};

function getDayStatus(
  dayStr: string,
  records: AttendanceRecord[],
  leaves: LeaveRequest[],
  events: CalendarEvent[],
): { label: string; color: string; dot: string } | null {
  if (events.some((e) => e.eventDate === dayStr && e.tipe === "libur")) {
    return {
      label: "Libur PKL",
      color: "bg-flip7-coral-light/20 border-flip7-coral",
      dot: "bg-flip7-coral",
    };
  }
  const leave = leaves.find(
    (l) => dayStr >= l.startDate && dayStr <= l.endDate,
  );
  if (leave) {
    if (leave.type === "sakit")
      return {
        label: "Sakit",
        color: "bg-coral-soft border-coral",
        dot: "bg-coral",
      };
    if (leave.type === "izin")
      return { label: "Izin", color: "bg-sun-soft border-sun", dot: "bg-sun" };
  }
  const record = records.find((r) => r.scannedAt.slice(0, 10) === dayStr);
  if (record)
    return {
      label: "Masuk",
      color: "bg-leaf-soft border-leaf",
      dot: "bg-leaf",
    };
  return null;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function SiswaKalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [studentSince, setStudentSince] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    hadir: 0,
    sakit: 0,
    izin: 0,
    alfa: 0,
    total: 0,
    persentase: 0,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);
  const joinDate = studentSince
    ? new Date(studentSince).toISOString().slice(0, 10)
    : null;

  const loadData = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      const supabase = createClient();

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;

        Promise.all([
          getEvents(year, month + 1, user.id),
          getStudentAttendanceByMonth(user.id, year, month + 1),
        ]).then(([evts, data]) => {
          setEvents(evts as unknown as CalendarEvent[]);
          setRecords(data.records as unknown as AttendanceRecord[]);
          setLeaves(data.leaves as unknown as LeaveRequest[]);
          setStudentSince(data.studentSince || null);

          const joinDate = data.studentSince
            ? new Date(data.studentSince).toISOString().slice(0, 10)
            : null;

          const daysInMonth = new Date(year, month + 1, 0).getDate();
          let hadir = 0,
            sakit = 0,
            izin = 0,
            alfa = 0;

          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            if (dateStr > todayStr) break;
            if (joinDate && dateStr < joinDate) continue;
            const status = getDayStatus(
              dateStr,
              data.records,
              data.leaves,
              evts as unknown as CalendarEvent[],
            );
            if (!status) alfa++;
            else if (status.label === "Masuk" || status.label === "Libur PKL")
              hadir++;
            else if (status.label === "Sakit") sakit++;
            else if (status.label === "Izin") izin++;
          }

          const total = hadir + sakit + izin + alfa;
          setStats({
            hadir,
            sakit,
            izin,
            alfa,
            total,
            persentase: total > 0 ? Math.round((hadir / total) * 100) : 0,
          });
          if (!silent) setLoading(false);
        });
      });
    },
    [year, month],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("calendar-changes-siswa")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events" },
        () => loadData(true),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1));
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1));
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get upcoming events (next 7 days)
  const upcomingEvents = events
    .filter((ev) => {
      const evDate = new Date(ev.eventDate);
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return evDate >= now && evDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 5);

  // Get today's status
  const todayStatus = getDayStatus(todayStr, records, leaves, events);

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(
      <div
        key={`empty-${i}`}
        className={`${styles.calendarCell} ${styles.calendarCellDefault}`}
      />,
    );
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const status = getDayStatus(dateStr, records, leaves, events);
    const isLibur = events.some(
      (e) => e.eventDate === dateStr && e.tipe === "libur",
    );
    const isPast = dateStr < todayStr;
    const isBeforeJoin = joinDate ? dateStr < joinDate : false;
    const isFuture = dateStr > todayStr;

    let cellClass = styles.calendarCellDefault;
    if (status?.color) {
      cellClass = status.color;
    } else if (isToday) {
      cellClass = styles.calendarCellToday;
    } else if (isPast && !isLibur) {
      cellClass = styles.calendarCellPast;
    }

    calendarCells.push(
      <div key={day} className={`${styles.calendarCell} ${cellClass}`}>
        <div
          className={`${styles.calendarDayNumber} ${isToday ? styles.calendarDayToday : styles.calendarDayNormal}`}
        >
          {day}
        </div>
        {status && (
          <div className={styles.calendarStatus}>
            <span className={`${styles.calendarStatusDot} ${status.dot}`} />
            <span className={styles.calendarStatusLabel}>{status.label}</span>
          </div>
        )}
        {isPast && !status && !isLibur && !isBeforeJoin && (
          <div className={styles.calendarStatus}>
            <span
              className={styles.calendarStatusDot}
              style={{ background: "#EF4444" }}
            />
            <span className={styles.calendarStatusLabel}>Alfa</span>
          </div>
        )}
        {isPast && !status && !isLibur && isBeforeJoin && (
          <div className={styles.calendarStatus}>
            <span
              className={styles.calendarStatusDot}
              style={{ background: "#9CA3AF" }}
            />
            <span className={styles.calendarStatusLabel}>—</span>
          </div>
        )}
        {isFuture && events.some((e) => e.eventDate === dateStr) && (
          <div className={styles.calendarStatus}>
            <span
              className={styles.calendarStatusDot}
              style={{ background: "#3B82F6" }}
            />
            <span className={styles.calendarStatusLabel}>Event</span>
          </div>
        )}
      </div>,
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Kalender PKL</h1>
          <p>Pantau status absensi harian kamu.</p>
        </div>
        {todayStatus && (
          <div className={styles.todayBadge}>
            <span className={styles.todayBadgeDot} style={{ background: todayStatus.dot === "bg-leaf" ? "#22C55E" : todayStatus.dot === "bg-coral" ? "#F97316" : "#FBBF24" }} />
            <span>Hari ini: {todayStatus.label}</span>
          </div>
        )}
      </div>

      <div className={styles.statGrid} data-tour="kalender-stats">
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.hadir}</span>
            <span className={styles.statLabel}>Hadir</span>
          </div>
          {stats.total > 0 && (
            <div className={styles.statProgress}>
              <div
                className={styles.statProgressBar}
                style={{
                  width: `${(stats.hadir / stats.total) * 100}%`,
                  background: "#22C55E",
                }}
              />
            </div>
          )}
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.sakit}</span>
            <span className={styles.statLabel}>Sakit</span>
          </div>
          {stats.total > 0 && (
            <div className={styles.statProgress}>
              <div
                className={styles.statProgressBar}
                style={{
                  width: `${(stats.sakit / stats.total) * 100}%`,
                  background: "#F97316",
                }}
              />
            </div>
          )}
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconYellow}`}>
            <FileClock className="h-5 w-5" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.izin}</span>
            <span className={styles.statLabel}>Izin</span>
          </div>
          {stats.total > 0 && (
            <div className={styles.statProgress}>
              <div
                className={styles.statProgressBar}
                style={{
                  width: `${(stats.izin / stats.total) * 100}%`,
                  background: "#FBBF24",
                }}
              />
            </div>
          )}
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconRed}`}>
            <NotebookPen className="h-5 w-5" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.alfa}</span>
            <span className={styles.statLabel}>Alfa</span>
          </div>
          {stats.total > 0 && (
            <div className={styles.statProgress}>
              <div
                className={styles.statProgressBar}
                style={{
                  width: `${(stats.alfa / stats.total) * 100}%`,
                  background: "#EF4444",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Attendance Percentage */}
      {stats.total > 0 && (
        <div className={styles.percentageCard}>
          <div className={styles.percentageInfo}>
            <TrendingUp className="h-5 w-5" style={{ color: stats.persentase >= 80 ? "#22C55E" : stats.persentase >= 60 ? "#FBBF24" : "#EF4444" }} />
            <span className={styles.percentageLabel}>Persentase Kehadiran</span>
          </div>
          <div className={styles.percentageBar}>
            <div
              className={styles.percentageFill}
              style={{
                width: `${stats.persentase}%`,
                background: stats.persentase >= 80 ? "#22C55E" : stats.persentase >= 60 ? "#FBBF24" : "#EF4444",
              }}
            />
          </div>
          <span className={styles.percentageValue}>{stats.persentase}%</span>
        </div>
      )}

      <div className={styles.contentLayout}>
        <div className={styles.calendarSection}>
          <Card data-tour="kalender-grid">
            <div className={styles.calendarNav}>
              <button onClick={prevMonth} className={styles.calendarNavBtn}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className={styles.calendarNavTitle}>
                {MONTHS[month]} {year}
              </h3>
              <button onClick={nextMonth} className={styles.calendarNavBtn}>
                <ChevronRight className="h-5 w-5" />
              </button>
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
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#64748B" }} />
              </div>
            ) : (
              <div className={styles.calendarGrid}>{calendarCells}</div>
            )}
          </Card>

          <div className={styles.legendContainer}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#22C55E" }} />
              Masuk
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#FBBF24" }} />
              Izin
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#F97316" }} />
              Sakit
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#EF4444" }} />
              Alfa
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#22C55E" }} />
              Libur
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#3B82F6" }} />
              Event
            </span>
          </div>
        </div>

        <div className={styles.sidebar}>
          {/* Upcoming Events */}
          <Card className={styles.sidebarCard} data-tour="kalender-events">
            <CardHeader
              title="Event Mendatang"
              action={
                <Badge tone="sky" className="text-xs">
                  {upcomingEvents.length}
                </Badge>
              }
            />
            <div className={styles.eventList}>
              {upcomingEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <CalendarOff className="h-8 w-8" style={{ color: "#94A3B8" }} />
                  <p>Tidak ada event mendatang</p>
                </div>
              ) : (
                upcomingEvents.map((ev) => {
                  const daysUntil = getDaysUntil(ev.eventDate);
                  return (
                    <div key={ev.id} className={styles.eventItem}>
                      <div
                        className={styles.eventDot}
                        style={{
                          background: ev.tipe === "libur" ? "#22C55E" : "#3B82F6",
                        }}
                      />
                      <div className={styles.eventInfo}>
                        <span className={styles.eventTitle}>{ev.title}</span>
                        <span className={styles.eventDate}>
                          {formatDateShort(ev.eventDate)}
                          {ev.endDate && ` — ${formatDateShort(ev.endDate)}`}
                        </span>
                      </div>
                      <Badge
                        tone={ev.tipe === "libur" ? "success" : "sky"}
                        className="text-xs"
                      >
                        {daysUntil === 0
                          ? "Hari ini"
                          : daysUntil === 1
                            ? "Besok"
                            : `${daysUntil} hari`}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className={styles.sidebarCard} data-tour="kalender-summary">
            <CardHeader title="Ringkasan Bulan" />
            <div className={styles.quickStats}>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Total Hari Efektif</span>
                <span className={styles.quickStatValue}>{stats.total}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Hari Libur</span>
                <span className={styles.quickStatValue}>
                  {events.filter((e) => e.tipe === "libur").length}
                </span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Total Event</span>
                <span className={styles.quickStatValue}>
                  {events.filter((e) => e.tipe === "event").length}
                </span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Tingkat Kehadiran</span>
                <span
                  className={styles.quickStatHighlight}
                  style={{
                    color: stats.persentase >= 80 ? "#22C55E" : stats.persentase >= 60 ? "#FBBF24" : "#EF4444",
                  }}
                >
                  {stats.persentase}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
