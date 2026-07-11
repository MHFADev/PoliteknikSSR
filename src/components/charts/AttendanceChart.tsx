"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import styles from "@/styles/components/charts/AttendanceChart.module.css";

export interface AttendanceTrendPoint {
  date: string; // label pendek, misal "12 Jul"
  hadir: number;
  telat: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className={styles.tooltipItem} style={{ color: p.color }}>
          {p.dataKey === "hadir" ? "Hadir" : "Telat"}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function AttendanceChart({ data }: { data: AttendanceTrendPoint[] }) {
  return (
    <div className={styles.chartWrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="fillHadir" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#234C6A" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#234C6A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillTelat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#456882" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#456882" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1B3C5314" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#456882" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#456882" }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="hadir"
            stroke="#234C6A"
            strokeWidth={2}
            fill="url(#fillHadir)"
          />
          <Area
            type="monotone"
            dataKey="telat"
            stroke="#456882"
            strokeWidth={2}
            fill="url(#fillTelat)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
