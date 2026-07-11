"use client";

import { Calendar } from "./Calendar";
import styles from "@/styles/components/shared/StudentCalendar.module.css";

interface StudentCalendarProps {
  events: any[];
  records: any[];
  leaves: any[];
}

export default function StudentCalendar({ events, records, leaves }: StudentCalendarProps) {
  function getDayStatus(dayStr: string) {
    if (events.some((e: any) => e.event_date === dayStr && e.tipe === "libur")) {
      return { label: "Libur PKL", color: "bg-flip7-coral-light/20 border-flip7-coral", dot: "bg-flip7-coral" };
    }
    const leave = leaves.find((l: any) => dayStr >= l.start_date && dayStr <= l.end_date);
    if (leave) {
      if (leave.type === "sakit") return { label: "Sakit", color: "bg-flip7-coral-light/10 border-flip7-coral", dot: "bg-flip7-coral" };
      if (leave.type === "izin") return { label: "Izin", color: "bg-sun-soft border-sun", dot: "bg-sun" };
    }
    const record = records.find((r: any) => r.scanned_at.slice(0, 10) === dayStr);
    if (record) {
      if (record.status === "hadir" || record.status === "telat") {
        return { label: record.status === "hadir" ? "Hadir" : "Telat", color: "bg-leaf-soft border-leaf", dot: "bg-leaf" };
      } else {
        return { label: record.status.charAt(0).toUpperCase() + record.status.slice(1), color: record.status === "alfa" ? "bg-coral-soft border-coral" : "bg-teal-bg border-teal", dot: record.status === "alfa" ? "bg-coral" : "bg-teal" };
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    if (dayStr < today) {
      return { label: "Alfa", color: "bg-coral-soft border-coral", dot: "bg-coral" };
    }
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Calendar events={events} getDayStatus={getDayStatus} />
    </div>
  );
}
