"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ─── Bar Chart ───────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  horizontal?: boolean;
  showLabels?: boolean;
  animate?: boolean;
}

export function BarChart({ data, height = 200, horizontal, showLabels = true, animate = true }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value));

  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {showLabels && <span className="text-xs text-muted-foreground w-20 shrink-0 text-end truncate">{item.label}</span>}
            <div className="flex-1 h-6 rounded-md bg-muted/30 overflow-hidden">
              <motion.div
                className={cn("h-full rounded-md", item.color || "bg-primary")}
                initial={animate ? { width: 0 } : { width: `${(item.value / max) * 100}%` }}
                animate={{ width: `${(item.value / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            </div>
            <span className="text-xs font-medium text-foreground w-10 shrink-0">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex-1 flex items-end">
            <motion.div
              className={cn("w-full rounded-t-md", item.color || "bg-primary")}
              initial={animate ? { height: 0 } : { height: `${(item.value / max) * 100}%` }}
              animate={{ height: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          {showLabels && <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.label}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Line Chart ──────────────────────────────────────────────

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  fill?: boolean;
  animate?: boolean;
}

export function LineChart({ data, height = 200, color = "var(--primary)", fill = true, animate = true }: LineChartProps) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const width = 100;
  const step = width / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * step,
    y: height - ((d.value - min) / range) * (height - 20) - 10,
  }));

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillPath = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {fill && <path d={fillPath} fill={color} fillOpacity={0.15} />}
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-muted-foreground">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  animate?: boolean;
}

export function DonutChart({ data, size = 160, thickness = 20, centerLabel, centerValue, animate = true }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pre-calculate offsets for each segment (no mutation)
  const segments = data.reduce(
    (acc, item, i) => {
      const fraction = item.value / total;
      const dash = fraction * circumference;
      const segmentOffset = acc.totalOffset;
      acc.result.push({ ...item, dash, segmentOffset, index: i });
      acc.totalOffset += dash;
      return acc;
    },
    { result: [] as Array<typeof data[0] & { dash: number; segmentOffset: number; index: number }>, totalOffset: 0 }
  ).result;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((seg) => (
          <motion.circle
            key={seg.index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.segmentOffset}
            initial={animate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: seg.index * 0.1 }}
          />
        ))}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-2xl font-bold text-foreground">{centerValue}</span>}
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label?: string };
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "warning" | "danger";
}

const statVariants = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function StatCard({ label, value, trend, icon: Icon, variant = "default" }: StatCardProps) {
  const isPositive = trend && trend.value > 0;
  return (
    <Card variant="default" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-bold mt-1", statVariants[variant])}>{value}</p>
        </div>
        {Icon && <Icon className="size-5 text-muted-foreground" />}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className={cn("font-medium", isPositive ? "text-success" : "text-danger")}>
            {isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
        </div>
      )}
    </Card>
  );
}

// Import Card at bottom to avoid circular deps issue
import { Card } from "../data-display/card";
