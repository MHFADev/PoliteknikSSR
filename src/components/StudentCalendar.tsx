"use client";

import { Calendar } from "./Calendar";

interface StudentCalendarProps {
  events: any[];
  records: any[];
  leaves: any[];
}

export default function StudentCalendar({ events, records, leaves }: StudentCalendarProps) {
  function getDayStatus(dayStr: string) {
    if (events.some((e: any) => e.event_date === dayStr && e.tipe === "libur")) {
      return { label: "Libur PKL", color: "bg-red-50 border-red-400", dot: "bg-red-600" };
    }
    const leave = leaves.find((l: any) => dayStr >= l.start_date && dayStr <= l.end_date);
    if (leave) {
      if (leave.type === "sakit") return { label: "Sakit", color: "bg-orange-100 border-orange-400", dot: "bg-orange-500" };
      if (leave.type === "izin") return { label: "Izin", color: "bg-yellow-100 border-yellow-400", dot: "bg-yellow-500" };
    }
    const record = records.find((r: any) => r.scanned_at.slice(0, 10) === dayStr);
    if (record) {
      if (record.status === "hadir" || record.status === "telat") {
        return { label: record.status === "hadir" ? "Hadir" : "Telat", color: "bg-green-100 border-green-400", dot: "bg-green-500" };
      } else {
        return { label: record.status.charAt(0).toUpperCase() + record.status.slice(1), color: record.status === "alfa" ? "bg-red-100/70 border-red-400/70" : "bg-blue-100 border-blue-400", dot: record.status === "alfa" ? "bg-red-500/70" : "bg-blue-500" };
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    if (dayStr < today) {
      return { label: "Alfa", color: "bg-red-100/70 border-red-400/70", dot: "bg-red-500/70" };
    }
    return null;
  }

  return <Calendar events={events} getDayStatus={getDayStatus} />;
}
