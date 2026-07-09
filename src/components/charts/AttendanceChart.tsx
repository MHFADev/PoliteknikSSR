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

export interface AttendanceTrendPoint {
  date: string; // label pendek, misal "12 Jul"
  hadir: number;
  telat: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/60 bg-white/90 backdrop-blur px-3 py-2 shadow-glass text-xs">
      <p className="font-medium text-deep mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "hadir" ? "Hadir" : "Telat"}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function AttendanceChart({ data }: { data: AttendanceTrendPoint[] }) {
  return (
    <div className="h-64 w-full">
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
