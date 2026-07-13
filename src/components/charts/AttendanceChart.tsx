"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import styles from "@/styles/components/charts/AttendanceChart.module.css";

export interface AttendanceTrendPoint {
  date: string; // label pendek, misal "12 Jul"
  hadir: number;
  telat: number;
  izin: number;
  alfa: number;
}

const COLORS = {
  hadir: "#22c55e",
  telat: "#f59e0b",
  izin: "#3b82f6",
  alfa: "#ef4444",
};

const LABELS = {
  hadir: "Hadir",
  telat: "Telat",
  izin: "Izin / Sakit",
  alfa: "Alfa",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span
            className={styles.tooltipDot}
            style={{ background: COLORS[p.dataKey as keyof typeof COLORS] }}
          />
          <span className={styles.tooltipLabel}>
            {LABELS[p.dataKey as keyof typeof LABELS]}:
          </span>
          <span className={styles.tooltipValue} style={{ color: COLORS[p.dataKey as keyof typeof COLORS] }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <div className={styles.legend}>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: entry.color }}
          />
          <span className={styles.legendLabel}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AttendanceChart({ data }: { data: AttendanceTrendPoint[] }) {
  return (
    <div className={styles.chartWrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
          barCategoryGap="28%"
          barGap={2}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(27,60,83,0.08)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)", radius: 6 }} />
          <Legend
            content={<CustomLegend />}
            wrapperStyle={{ paddingTop: "12px" }}
          />

          <Bar
            dataKey="hadir"
            name={LABELS.hadir}
            fill={COLORS.hadir}
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="telat"
            name={LABELS.telat}
            fill={COLORS.telat}
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="izin"
            name={LABELS.izin}
            fill={COLORS.izin}
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="alfa"
            name={LABELS.alfa}
            fill={COLORS.alfa}
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
