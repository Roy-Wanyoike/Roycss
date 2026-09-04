"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ClockIcon,
  GaugeIcon,
  Globe2Icon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── OKLCH palette (no indigo / blue) ───────────────────────
// Primary hue 165° (brand emerald). Complementary accents stay
// in the warm / cyan / amber range — never indigo or blue.
const COLORS = {
  primary: "oklch(0.55 0.13 165)",
  emerald: "oklch(0.60 0.15 145)",
  amber: "oklch(0.70 0.15 85)",
  cyan: "oklch(0.60 0.15 200)",
  rose: "oklch(0.62 0.18 25)",
  grid: "oklch(0.90 0.01 165)",
  mutedText: "oklch(0.52 0.02 170)",
} as const;

// ─── Types ──────────────────────────────────────────────────

type TimeRange = "24h" | "7d" | "30d" | "90d";

interface KpiCard {
  id: string;
  title: string;
  value: string;
  trendPct: number; // positive = up, negative = down
  invertTrend?: boolean; // when true, "down" is good (e.g. response time)
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // OKLCH color
  iconBg: string; // OKLCH color (light tint)
}

interface TrafficPoint {
  day: string; // short label
  visitors: number;
}

interface EffectRow {
  id: string;
  name: string;
  category: string;
  usage: number;
  trendPct: number;
}

interface GeoRow {
  country: string;
  flag: string; // emoji
  users: number;
  percent: number;
}

interface DeviceSlice {
  name: string;
  value: number; // percentage
  color: string;
}

type SortDirection = "asc" | "desc";

// ─── Time-range mock datasets ───────────────────────────────
// Each range produces a stable, deterministic series (no Math.random
// at render time) so memoization is reliable.

const RANGE_DAYS: Readonly<Record<TimeRange, number>> = Object.freeze({
  "24h": 24,
  "7d": 7,
  "30d": 30,
  "90d": 90,
});

function makeTrafficSeries(range: TimeRange): readonly TrafficPoint[] {
  const points = RANGE_DAYS[range];
  const out: TrafficPoint[] = [];
  // Deterministic pseudo-wave — same inputs → same outputs.
  // 24h shows hourly buckets; longer ranges show day buckets.
  if (range === "24h") {
    for (let i = 0; i < points; i++) {
      const base = 540;
      const wave = Math.sin((i / points) * Math.PI * 2) * 180;
      // Morning ramp (hours 6–18 get a bump)
      const dayBoost = i >= 6 && i <= 18 ? 220 : 0;
      const noise = Math.sin(i * 1.7) * 22;
      const visitors = Math.max(
        120,
        Math.round(base + wave + dayBoost + noise),
      );
      out.push({
        day: `${i.toString().padStart(2, "0")}:00`,
        visitors,
      });
    }
    return out;
  }

  // 7d / 30d / 90d — day buckets. The 24h branch returns above so this
  // object only needs the day-based ranges, but `Record<TimeRange, …>`
  // requires every key — give 24h a placeholder that is never read.
  const baseLevels: Readonly<Record<TimeRange, number>> = Object.freeze({
    "24h": 0,
    "7d": 4_200,
    "30d": 4_650,
    "90d": 4_900,
  });
  const base = baseLevels[range];
  for (let i = 0; i < points; i++) {
    const wave = Math.sin((i / points) * Math.PI * 4) * 1_100;
    const trend = (i / points) * 1_400; // gentle upward slope
    const noise = Math.sin(i * 0.9) * 280 + Math.cos(i * 0.43) * 160;
    const weekendDip =
      range === "7d" && i >= 5 ? -900 : range === "30d" && i % 7 >= 5 ? -700 : 0;
    const visitors = Math.max(
      800,
      Math.round(base + wave + trend + noise + weekendDip),
    );
    // Date labels — use Day N for brevity
    out.push({ day: `D${i + 1}`, visitors });
  }
  return out;
}

// KPIs are scaled per-range so the dashboard reacts visibly to range changes.
const KPI_MULTIPLIERS: Readonly<Record<TimeRange, number>> = Object.freeze({
  "24h": 0.05,
  "7d": 0.32,
  "30d": 1,
  "90d": 2.6,
});

function buildKpiCards(range: TimeRange): readonly KpiCard[] {
  const m = KPI_MULTIPLIERS[range];
  const totalUsers = Math.round(12_480 * m);
  const activeEffects = Math.round(1_569 * m);
  const apiCallsRaw = 2_400_000 * m;
  const avgResponse = Math.round(45 * (1 + (1 - m) * 0.1));

  return [
    {
      id: "total-users",
      title: "Total Users",
      value: totalUsers.toLocaleString("en-US"),
      trendPct: 12,
      icon: UsersIcon,
      accent: COLORS.primary,
      iconBg: "oklch(0.95 0.04 165)",
    },
    {
      id: "active-effects",
      title: "Active Effects",
      value: activeEffects.toLocaleString("en-US"),
      trendPct: 4,
      icon: ZapIcon,
      accent: COLORS.amber,
      iconBg: "oklch(0.95 0.05 85)",
    },
    {
      id: "api-calls",
      title: "API Calls",
      value: formatCompact(apiCallsRaw),
      trendPct: 8,
      icon: ActivityIcon,
      accent: COLORS.cyan,
      iconBg: "oklch(0.95 0.04 200)",
    },
    {
      id: "avg-response",
      title: "Avg Response",
      value: `${avgResponse}ms`,
      trendPct: 15,
      invertTrend: true,
      icon: GaugeIcon,
      accent: COLORS.emerald,
      iconBg: "oklch(0.95 0.04 145)",
    },
  ];
}

// Top effects — usage scales per range so the table feels alive.
const BASE_EFFECTS: readonly EffectRow[] = [
  { id: "fx-1", name: "Glassmorphism Card", category: "Background", usage: 18_240, trendPct: 14 },
  { id: "fx-2", name: "Magnetic Button", category: "Interaction", usage: 15_120, trendPct: 9 },
  { id: "fx-3", name: "Scroll Reveal", category: "Animation", usage: 13_870, trendPct: 22 },
  { id: "fx-4", name: "Conic Gradient Border", category: "Border", usage: 12_040, trendPct: 6 },
  { id: "fx-5", name: "Tilt Card 3D", category: "Transform", usage: 11_320, trendPct: 18 },
  { id: "fx-6", name: "Neon Glow Pulse", category: "Shadow", usage: 9_870, trendPct: 11 },
  { id: "fx-7", name: "Stagger Fade", category: "Animation", usage: 8_640, trendPct: -4 },
  { id: "fx-8", name: "Marquee Track", category: "Layout", usage: 7_510, trendPct: 3 },
  { id: "fx-9", name: "Spotlight Hover", category: "Interaction", usage: 6_290, trendPct: 7 },
  { id: "fx-10", name: "Aurora Background", category: "Background", usage: 5_840, trendPct: -2 },
];

function buildEffects(range: TimeRange): readonly EffectRow[] {
  const m = KPI_MULTIPLIERS[range];
  return BASE_EFFECTS.map((row) => ({
    ...row,
    usage: Math.max(1, Math.round(row.usage * m)),
  }));
}

// Geography — stable, only counts scale modestly per range.
const BASE_GEO: readonly GeoRow[] = [
  { country: "United States", flag: "🇺🇸", users: 4_120, percent: 33 },
  { country: "Germany", flag: "🇩🇪", users: 2_180, percent: 17 },
  { country: "Brazil", flag: "🇧🇷", users: 1_640, percent: 13 },
  { country: "Japan", flag: "🇯🇵", users: 1_210, percent: 10 },
  { country: "India", flag: "🇮🇳", users: 980, percent: 8 },
];

function buildGeo(range: TimeRange): readonly GeoRow[] {
  const m = KPI_MULTIPLIERS[range];
  // Keep percentages stable; scale user counts.
  return BASE_GEO.map((row) => ({
    ...row,
    users: Math.max(1, Math.round(row.users * m)),
  }));
}

const DEVICE_SLICES: readonly DeviceSlice[] = [
  { name: "Desktop", value: 55, color: COLORS.primary },
  { name: "Mobile", value: 35, color: COLORS.cyan },
  { name: "Tablet", value: 10, color: COLORS.amber },
];

// ─── Formatting helpers ─────────────────────────────────────

function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

function formatUsers(value: number): string {
  return value.toLocaleString("en-US");
}

// ─── Custom tooltip ─────────────────────────────────────────
// recharts 3 no longer exposes `payload`/`label` on TooltipProps
// (they are injected into custom content elements at runtime), so
// the injected props this component consumes are declared explicitly.

interface ChartTooltipPayloadItem {
  name?: string | number;
  value?: number | string | ReadonlyArray<number | string>;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<ChartTooltipPayloadItem>;
  label?: string | number;
  valueFormatter: (value: number) => string;
  /** When true, hides the top-level label (e.g. for the donut where label === name). */
  hideLabel?: boolean;
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  hideLabel,
}: ChartTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null;
  const labelText = typeof label === "string" ? label : "";
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      {hideLabel !== true && labelText ? (
        <p className="mb-1.5 font-medium text-foreground">{labelText}</p>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const raw = item.value;
          const numericValue: number = Array.isArray(raw)
            ? Number(raw[0] ?? 0)
            : typeof raw === "number"
              ? raw
              : Number(raw ?? 0);
          const name = typeof item.name === "string" ? item.name : "";
          const color =
            typeof item.color === "string" ? item.color : COLORS.primary;
          return (
            <div
              key={`${String(item.dataKey ?? "key")}-${index}`}
              className="flex items-center justify-between gap-6"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
                {name}
              </span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {valueFormatter(numericValue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────

interface KpiCardViewProps {
  card: KpiCard;
}

function KpiCardView({ card }: KpiCardViewProps): React.JSX.Element {
  const { icon: Icon, title, value, trendPct, invertTrend, accent, iconBg } = card;
  // Determine "good" vs "bad" direction.
  const isUp = trendPct >= 0;
  const isGood = invertTrend ? !isUp : isUp;
  const TrendIcon = isUp ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="gap-2 px-5 pt-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div
            aria-hidden
            className="flex size-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBg, color: accent }}
          >
            <Icon className="size-5" />
          </div>
          <Badge
            variant="outline"
            className={cn(
              "gap-0.5 px-1.5 py-0 text-[11px] font-medium tabular-nums",
              isGood
                ? "border-transparent bg-[oklch(0.95_0.04_145)] text-[oklch(0.40_0.13_145)]"
                : "border-transparent bg-[oklch(0.95_0.04_25)] text-[oklch(0.45_0.18_25)]",
            )}
            aria-label={`Trend ${isUp ? "up" : "down"} ${Math.abs(trendPct)} percent`}
          >
            <TrendIcon className="size-3" />
            {Math.abs(trendPct)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-3 pb-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Traffic Chart (LineChart + gradient area) ──────────────

interface TrafficChartProps {
  data: readonly TrafficPoint[];
  gradientId: string;
}

function TrafficChart({
  data,
  gradientId,
}: TrafficChartProps): React.JSX.Element {
  const tooltip = <ChartTooltip valueFormatter={formatUsers} />;
  const axisProps = {
    tick: { fill: COLORS.mutedText, fontSize: 11 },
    axisLine: false as const,
    tickLine: false as const,
  };

  // Pick ~8 ticks on the X axis to avoid label crowding on the 90d range.
  const tickInterval = Math.max(
    0,
    Math.floor(data.length / 8) - 1,
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={[...data]}
        margin={{ top: 8, right: 12, bottom: 0, left: -8 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4} />
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke={COLORS.grid}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          interval={tickInterval}
          minTickGap={8}
          {...axisProps}
        />
        <YAxis tickFormatter={formatCompact} width={42} {...axisProps} />
        <Tooltip
          content={tooltip}
          cursor={{
            stroke: COLORS.primary,
            strokeWidth: 1,
            strokeDasharray: "3 3",
          }}
        />
        {/* Gradient area beneath the line — drawn via a stacked Area
            isn&apos;t needed; we use a transparent Line + an Area
            shape by overlaying. Recharts&apos; Line alone has no
            fill, so we add an Area without a stroke to provide the
            gradient wash. */}
        <Area
          type="monotone"
          dataKey="visitors"
          stroke="none"
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="visitors"
          name="Visitors"
          stroke={COLORS.primary}
          strokeWidth={2.5}
          dot={false}
          activeDot={{
            r: 4,
            fill: COLORS.primary,
            stroke: "var(--background)",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Device Donut ───────────────────────────────────────────

function DeviceDonut(): React.JSX.Element {
  const tooltip = <ChartTooltip valueFormatter={(v) => `${v}%`} hideLabel />;
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[...DEVICE_SLICES]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
            cornerRadius={4}
          >
            {DEVICE_SLICES.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip content={tooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="flex items-center gap-1 text-2xl font-bold tabular-nums text-foreground">
          <MonitorIcon className="size-5 text-primary" />
          55%
        </span>
        <span className="text-[11px] text-muted-foreground">Desktop lead</span>
      </div>
    </div>
  );
}

// ─── Top Effects Table ──────────────────────────────────────

interface TopEffectsTableProps {
  rows: readonly EffectRow[];
}

function TopEffectsTable({
  rows,
}: TopEffectsTableProps): React.JSX.Element {
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc");

  const sorted = React.useMemo<readonly EffectRow[]>(() => {
    const copy = [...rows];
    copy.sort((a, b) =>
      sortDir === "desc" ? b.usage - a.usage : a.usage - b.usage,
    );
    return copy;
  }, [rows, sortDir]);

  const maxUsage = React.useMemo(
    () => sorted.reduce((max, r) => Math.max(max, r.usage), 0) || 1,
    [sorted],
  );

  const toggleSort = React.useCallback(() => {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[42%] text-xs uppercase tracking-wider text-muted-foreground">
            Effect
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
            Category
          </TableHead>
          <TableHead
            aria-sort={sortDir === "desc" ? "descending" : "ascending"}
          >
            <button
              type="button"
              onClick={toggleSort}
              aria-label={`Sort by usage, currently ${sortDir === "desc" ? "descending" : "ascending"}`}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Usage
              <span aria-hidden className="text-[10px]">
                {sortDir === "desc" ? "▼" : "▲"}
              </span>
            </button>
          </TableHead>
          <TableHead className="w-[26%] text-right text-xs uppercase tracking-wider text-muted-foreground">
            Trend
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => {
          const isUp = row.trendPct >= 0;
          const barPct = Math.max(4, Math.round((row.usage / maxUsage) * 100));
          return (
            <TableRow key={row.id}>
              <TableCell className="font-medium text-foreground">
                {row.name}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {row.category}
                </Badge>
              </TableCell>
              <TableCell className="tabular-nums text-foreground">
                {formatUsers(row.usage)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    aria-hidden
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: COLORS.primary,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "inline-flex w-12 shrink-0 justify-end gap-0.5 text-xs font-medium tabular-nums",
                      isUp ? "text-[oklch(0.40_0.13_145)]" : "text-[oklch(0.45_0.18_25)]",
                    )}
                  >
                    {isUp ? (
                      <ArrowUpRightIcon className="size-3 self-center" />
                    ) : (
                      <ArrowDownRightIcon className="size-3 self-center" />
                    )}
                    {Math.abs(row.trendPct)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Geographic Distribution ────────────────────────────────

interface GeoListProps {
  rows: readonly GeoRow[];
}

function GeoList({ rows }: GeoListProps): React.JSX.Element {
  const maxUsers = React.useMemo(
    () => rows.reduce((max, r) => Math.max(max, r.users), 0) || 1,
    [rows],
  );
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const barPct = Math.max(6, Math.round((row.users / maxUsers) * 100));
        return (
          <li
            key={row.country}
            className="flex items-center gap-3"
          >
            <span aria-hidden className="text-lg leading-none">
              {row.flag}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {row.country}
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatUsers(row.users)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div
                  aria-hidden
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${barPct}%`,
                      backgroundColor: COLORS.primary,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  {row.percent}%
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Time Range Selector ────────────────────────────────────

const RANGES: readonly { value: TimeRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

function TimeRangeSelector({
  value,
  onChange,
}: TimeRangeSelectorProps): React.JSX.Element {
  return (
    <div
      role="group"
      aria-label="Time range"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
    >
      {RANGES.map((range) => {
        const active = range.value === value;
        return (
          <Button
            key={range.value}
            type="button"
            variant={active ? "default" : "ghost"}
            size="sm"
            aria-pressed={active}
            onClick={() => onChange(range.value)}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {range.label}
          </Button>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function AnalyticsDashboard(): React.JSX.Element {
  const [range, setRange] = React.useState<TimeRange>("30d");

  // Unique gradient IDs (SSR-safe via React.useId).
  const reactId = React.useId();
  const trafficGradientId = `analytics-traffic-${reactId.replace(/:/g, "")}`;

  // Memoize per-range derived datasets — recompute only when range changes.
  const trafficData = React.useMemo(
    () => makeTrafficSeries(range),
    [range],
  );
  const kpiCards = React.useMemo(() => buildKpiCards(range), [range]);
  const effectRows = React.useMemo(() => buildEffects(range), [range]);
  const geoRows = React.useMemo(() => buildGeo(range), [range]);

  const handleRangeChange = React.useCallback((next: TimeRange) => {
    setRange(next);
  }, []);

  return (
    <section
      aria-label="Analytics dashboard"
      className="mx-auto w-full max-w-6xl px-1 py-2"
    >
      {/* ── Header row ─────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Analytics Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Live product metrics · OKLCH palette · mock data for the selected
            range.
          </p>
        </div>
        <TimeRangeSelector value={range} onChange={handleRangeChange} />
      </div>

      {/* ── KPI row (4 cards, stack on mobile) ────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <KpiCardView key={card.id} card={card} />
        ))}
      </div>

      {/* ── Traffic + Device row ──────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon
                className="size-4"
                style={{ color: COLORS.primary }}
              />
              Daily Visitors
            </CardTitle>
            <CardDescription>
              Unique visitors over the last {RANGE_DAYS[range]}{" "}
              {range === "24h" ? "hours" : "days"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72">
              <TrafficChart
                data={trafficData}
                gradientId={trafficGradientId}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorIcon
                className="size-4"
                style={{ color: COLORS.cyan }}
              />
              Device Breakdown
            </CardTitle>
            <CardDescription>
              Sessions split by form factor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <DeviceDonut />
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
              {DEVICE_SLICES.map((slice) => {
                const Icon =
                  slice.name === "Desktop"
                    ? MonitorIcon
                    : slice.name === "Mobile"
                      ? SmartphoneIcon
                      : TabletIcon;
                return (
                  <li key={slice.name} className="flex flex-col items-center gap-1">
                    <span
                      aria-hidden
                      className="inline-flex size-7 items-center justify-center rounded-md"
                      style={{ backgroundColor: "color-mix(in oklch, " + slice.color + " 14%, transparent)", color: slice.color }}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      {slice.value}%
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {slice.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Top effects table + Geo list ──────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ZapIcon
                className="size-4"
                style={{ color: COLORS.amber }}
              />
              Top Effects
            </CardTitle>
            <CardDescription>
              Most-used effects in the selected range. Click{" "}
              <span className="font-medium text-foreground">Usage</span> to
              sort.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopEffectsTable rows={effectRows} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2Icon
                className="size-4"
                style={{ color: COLORS.emerald }}
              />
              Geographic Distribution
            </CardTitle>
            <CardDescription>
              Top 5 countries by active users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeoList rows={geoRows} />
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              <ClockIcon className="size-3.5 shrink-0 text-primary" />
              <span>
                Updated {range === "24h" ? "hourly" : "daily"} · last sync
                just now.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default AnalyticsDashboard;
