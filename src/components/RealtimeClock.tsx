"use client";

import { useState, useEffect } from "react";

export function RealtimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const dayName = days[time.getDay()];
  const date = time.getDate();
  const month = months[time.getMonth()];
  const year = time.getFullYear();
  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginLeft: "auto",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "10px",
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          color: "#475569",
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span style={{ color: "#64748B" }}>{dayName}, {date} {month} {year}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          borderRadius: "10px",
          background: "#DBEAFE",
          border: "1px solid #BFDBFE",
          color: "#1D4ED8",
          fontSize: "15px",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {hours}:{minutes}:{seconds}
      </div>
    </div>
  );
}
