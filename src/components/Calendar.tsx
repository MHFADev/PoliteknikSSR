"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import styles from "@/styles/components/shared/Calendar.module.css";

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

  const monthEvents = events.filter(
    (e) =>
      e.event_date.slice(0, 7) ===
      `${year}-${String(month + 1).padStart(2, "0")}`,
  );
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

    let cellClass =
      "min-h-[50px] sm:min-h-[70px] md:min-h-[90px] rounded-flip7-lg border border-outline p-1.5 transition-all hover:border-oce hover:shadow-flip7-card bg-surface flex flex-col gap-1";
    if (isToday) {
      cellClass +=
        " border-ocean-light bg-ocean-light/25  shadow-flip7-ocean-glow hover:border-ocean hover:shadow-flip7-card";
    }

    // Apply status color with clear visual feedback
    if (status?.color) {
      cellClass = `min-h-[50px] sm:min-h-[70px] md:min-h-[90px] rounded-flip7-lg border p-1.5 transition-all flex flex-col gap-1 ${status.color}`;
    }

    // Holiday styling override for prominent display
    if (isLibur) {
      cellClass = `min-h-[50px] sm:min-h-[70px] md:min-h-[90px] rounded-flip7-lg border-2 border-flip7-coral p-1.5 transition-all flex flex-col gap-1 bg-flip7-coral-light/20`;
    }

    calendarCells.push(
      <div key={day} className={cellClass}>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold sm:h-7 sm:w-7 sm:text-sm ${
            isToday
              ? "bg-ocean-light text-white shadow-flip7-gold-glow"
              : isLibur
                ? "bg-flip7-coral text-white shadow-flip7-coral-glow"
                : "bg-surface-elevated text-ink border border-outline"
          }`}
        >
          {day}
        </div>

        {status && !isLibur && (
          <div className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${status.dot}`}
            />
            <span className="text-[9px] font-semibold text-ink sm:text-[10px]">
              {status.label}
            </span>
          </div>
        )}

        {dayEvents.map((ev) => (
          <div
            key={ev.id}
            className={`mt-auto rounded-flip7-sm px-1.5 py-0.5 text-[8px] font-bold leading-tight sm:text-[10px] ${
              ev.tipe === "libur"
                ? "bg-flip7-coral text-white shadow-flip7-coral-glow"
                : "bg-teal text-white shadow-flip7-teal-glow"
            } truncate`}
          >
            {ev.title}
          </div>
        ))}
      </div>,
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
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
          {calendarCells}
        </div>

        {/* Legend below calendar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-ocean-light/10 rounded-flip7-lg">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-leaf"></div>
            <span className="text-[11px] sm:text-sm text-ink font-medium">
              Hadir
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-[#6B7280]"></div>
            <span className="text-[11px] sm:text-sm text-ink font-medium">
              Telat
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-sun"></div>
            <span className="text-[11px] sm:text-sm text-ink font-medium">
              Izin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-[#EC4899]"></div>
            <span className="text-[11px] sm:text-sm text-ink font-medium">
              Sakit
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-coral1"></div>
            <span className="text-[11px] sm:text-sm text-ink font-medium">
              Alfa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-merah"></div>
            <span className="text-[11px] sm:text-sm text-ink font-medium">
              Libur PKL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-ocean-light"></div>
            <span className="text-[11px] sm:text-sm text-ink font-medium">
              Hari Ini
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
