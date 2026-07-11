"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import styles from "@/styles/components/shared/Calendar.module.css";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  tipe: "libur" | "event";
};

type DayStatus = {
  label: string;
  color: string;
  dot: string;
};

interface CalendarProps {
  events?: CalendarEvent[];
  getDayStatus?: (dayStr: string) => DayStatus | null;
}

export function Calendar({ events = [], getDayStatus }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthEvents = events.filter((e) => e.event_date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`);
  const eventMap = new Map<string, CalendarEvent[]>();
  monthEvents.forEach((e) => {
    if (!eventMap.has(e.event_date)) eventMap.set(e.event_date, []);
    eventMap.get(e.event_date)!.push(e);
  });

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1));
  }

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className={styles.emptyCell} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const dayEvents = eventMap.get(dateStr) || [];
    const status = getDayStatus?.(dateStr);
    const isLibur = dayEvents.some((e) => e.tipe === "libur");

    const cellClass = cn(
      styles.cell,
      isToday && styles.cellToday,
      status?.color && styles.cellStatus,
      status?.color && status.color,
      isLibur && styles.cellLibur
    );

    calendarCells.push(
      <div key={day} className={cellClass}>
        <div className={cn(styles.dayNumber, isToday ? styles.dayNumberToday : isLibur ? styles.dayNumberLibur : styles.dayNumberDefault)}>
          {day}
        </div>
        
        {status && !isLibur && (
          <div className="flex items-center gap-1">
            <span className={cn(styles.statusDot, status.dot)} />
            <span className={styles.statusLabel}>{status.label}</span>
          </div>
        )}
        
        {dayEvents.map((ev) => (
          <div
            key={ev.id}
            className={cn(styles.eventBadge, ev.tipe === "libur" ? styles.eventLibur : styles.eventDefault)}
          >
            {ev.title}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <div className={styles.headerRow}>
          <button onClick={prevMonth} className={styles.navButton}>
            <ChevronLeft />
          </button>
          <h3 className={styles.title}>
            {MONTHS[month]} {year}
          </h3>
          <button onClick={nextMonth} className={styles.navButton}>
            <ChevronRight />
          </button>
        </div>
        
        <div className={styles.dayHeader}>
          {DAYS.map((d) => (
            <div key={d} className={styles.dayHeaderText}>
              {d}
            </div>
          ))}
        </div>
        <div className={styles.grid}>{calendarCells}</div>

        {/* Legenda di bawah kalender */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={cn(styles.legendDot, "bg-leaf")}></div>
            <span className={styles.legendText}>Hadir</span>
          </div>
          <div className={styles.legendItem}>
            <div className={cn(styles.legendDot, "bg-sun")}></div>
            <span className={styles.legendText}>Izin</span>
          </div>
          <div className={styles.legendItem}>
            <div className={cn(styles.legendDot, "bg-flip7-coral")}></div>
            <span className={styles.legendText}>Sakit</span>
          </div>
          <div className={styles.legendItem}>
            <div className={cn(styles.legendDot, "bg-coral")}></div>
            <span className={styles.legendText}>Alfa</span>
          </div>
          <div className={styles.legendItem}>
            <div className={cn(styles.legendDot, "bg-flip7-coral")}></div>
            <span className={styles.legendText}>Libur PKL</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
