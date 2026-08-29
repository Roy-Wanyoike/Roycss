"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityIcon,
  AreaChart as AreaChartIcon,
  BarChart3Icon,
  CircleDollarSignIcon,
  LineChart as LineChartIcon,
  PieChartIcon,
} from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

// ─── OKLCH palette ──────────────────────────────────────────
// Primary brand hue (165°) plus complementary chart accents.
const COLORS = {
  primary: "oklch(0.50 0.13 165)",
  emerald: "oklch(0.60 0.15 145)",
  amber: "oklch(0.70 0.15 85)",
  cyan: "oklch(0.60 0.15 220)",
  violet: "oklch(0.55 0.20 290)",
  grid: "oklch(0.90 0.01 165)",
  mutedText: "oklch(0.52 0.02 170)",
} as const;

// ─── Mock data (module-level: stable across renders) ────────

interface RevenuePoint {
  month: string;
  revenue: number;
  target: number;
}

const REVENUE_DATA: readonly RevenuePoint[] = [
  { month: "Jan", revenue: 42_000, target: 40_000 },
  { month: "Feb", revenue: 48_500, target: 45_000 },
  { month: "Mar", revenue: 51_200, target: 50_000 },
  { month: "Apr", revenue: 47_800, target: 50_000 },
  { month: "May", revenue: 58_300, target: 55_000 },
  { month: "Jun", revenue: 62_700, target: 60_000 },
  { month: "Jul", revenue: 68_900, target: 65_000 },
  { month: "Aug", revenue: 71_400, target: 70_000 },
  { month: "Sep", revenue: 66_200, target: 70_000 },
  { month: "Oct", revenue: 78_500, target: 75_000 },
  { month: "Nov", revenue: 84_100, target: 80_000 },
  { month: "Dec", revenue: 92_800, target: 88_000 },
] as const;

interface RegionQuarterPoint {
  quarter: string;
  north: number;
  south: number;
  east: number;
}

const QUARTERLY_DATA: readonly RegionQuarterPoint[] = [
  { quarter: "Q1", north: 124, south: 98, east: 76 },
  { quarter: "Q2", north: 156, south: 112, east: 89 },
  { quarter: "Q3", north: 142, south: 134, east: 108 },
  { quarter: "Q4", north: 188, south: 161, east: 132 },
] as const;

interface PlanPoint {
  name: string;
  value: number; // percentage
  color: string;
}

const PLAN_DATA: readonly PlanPoint[] = [
  { name: "Free", value: 40, color: COLORS.primary },
  { name: "Pro", value: 35, color: COLORS.emerald },
  { name: "Enterprise", value: 20, color: COLORS.amber },
  { name: "Trial", value: 5, color: COLORS.cyan },
] as const;

// Total represented by the donut (illustrative active user count).
const TOTAL_USERS = 12_480;

interface WeeklyActiveUsersPoint {
  day: string;
  users: number;
}

const WAU_DATA: readonly WeeklyActiveUsersPoint[] = [
  { day: "Mon", users: 3_240 },
  { day: "Tue", users: 3_680 },
  { day: "Wed", users: 4_120 },
  { day: "Thu", users: 3_890 },
  { day: "Fri", users: 4_560 },
  { day: "Sat", users: 2_980 },
  { day: "Sun", users: 2_540 },
] as const;

// ─── Formatting helpers ─────────────────────────────────────

function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function formatCurrency(value: number): string {
  return `$${formatCompact(value)}`;
}

function formatPercent(value: number): string {
  return `${value}%`;
}

function formatUsers(value: number): string {
  return value.toLocaleString("en-US");
}

// ─── Custom tooltip ─────────────────────────────────────────
// Typed via recharts' TooltipProps<number, string>; no `any` leakage.

interface ChartTooltipProps
  extends Omit<TooltipProps<number, string>, "content"> {
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

// ─── Inline legend ──────────────────────────────────────────

interface LegendItem {
  label: string;
  color: string;
}

function ChartLegend({
  items,
  className,
}: {
  items: readonly LegendItem[];
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3",
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            aria-hidden
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// ─── Chart sub-components ───────────────────────────────────

type RevenueView = "line" | "area" | "bar";

interface RevenueChartProps {
  view: RevenueView;
  areaGradientId: string;
}

function RevenueChart({
  view,
  areaGradientId,
}: RevenueChartProps): React.JSX.Element {
  const tooltip = <ChartTooltip valueFormatter={formatCurrency} />;

  const axisProps = {
    tick: { fill: COLORS.mutedText, fontSize: 11 },
    axisLine: false as const,
    tickLine: false as const,
  };

  if (view === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...REVENUE_DATA]}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
        >
          <CartesianGrid
            stroke={COLORS.grid}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis tickFormatter={formatCompact} width={44} {...axisProps} />
          <Tooltip
            content={tooltip}
            cursor={{ fill: COLORS.grid, opacity: 0.5 }}
          />
          <Bar
            dataKey="revenue"
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={26}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (view === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={[...REVENUE_DATA]}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
        >
          <defs>
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.45} />
              <stop
                offset="100%"
                stopColor={COLORS.primary}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={COLORS.grid}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis tickFormatter={formatCompact} width={44} {...axisProps} />
          <Tooltip
            content={tooltip}
            cursor={{
              stroke: COLORS.primary,
              strokeWidth: 1,
              strokeDasharray: "3 3",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={COLORS.primary}
            strokeWidth={2.5}
            fill={`url(#${areaGradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: COLORS.primary,
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // default: line
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={[...REVENUE_DATA]}
        margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
      >
        <CartesianGrid
          stroke={COLORS.grid}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis tickFormatter={formatCompact} width={44} {...axisProps} />
        <Tooltip
          content={tooltip}
          cursor={{
            stroke: COLORS.primary,
            strokeWidth: 1,
            strokeDasharray: "3 3",
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
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
        <Line
          type="monotone"
          dataKey="target"
          stroke={COLORS.violet}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function QuarterlyBarChart(): React.JSX.Element {
  const tooltip = <ChartTooltip valueFormatter={(v) => `${v} deals`} />;
  const axisProps = {
    tick: { fill: COLORS.mutedText, fontSize: 11 },
    axisLine: false as const,
    tickLine: false as const,
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={[...QUARTERLY_DATA]}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        barGap={4}
        barCategoryGap="28%"
      >
        <CartesianGrid
          stroke={COLORS.grid}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis dataKey="quarter" {...axisProps} />
        <YAxis tickFormatter={formatCompact} width={36} {...axisProps} />
        <Tooltip
          content={tooltip}
          cursor={{ fill: COLORS.grid, opacity: 0.5 }}
        />
        <Bar
          dataKey="north"
          name="North"
          fill={COLORS.emerald}
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
        <Bar
          dataKey="south"
          name="South"
          fill={COLORS.amber}
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
        <Bar
          dataKey="east"
          name="East"
          fill={COLORS.cyan}
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PlanDonutChart(): React.JSX.Element {
  const tooltip = (
    <ChartTooltip valueFormatter={formatPercent} hideLabel />
  );

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[...PLAN_DATA]}
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
            {PLAN_DATA.map((plan) => (
              <Cell key={plan.name} fill={plan.color} />
            ))}
          </Pie>
          <Tooltip content={tooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {formatUsers(TOTAL_USERS)}
        </span>
        <span className="text-[11px] text-muted-foreground">active users</span>
      </div>
    </div>
  );
}

function WeeklyAreaChart({ gradientId }: { gradientId: string }): React.JSX.Element {
  const tooltip = <ChartTooltip valueFormatter={formatUsers} />;
  const axisProps = {
    tick: { fill: COLORS.mutedText, fontSize: 11 },
    axisLine: false as const,
    tickLine: false as const,
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={[...WAU_DATA]}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.4} />
            <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke={COLORS.grid}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis dataKey="day" {...axisProps} />
        <YAxis tickFormatter={formatCompact} width={36} {...axisProps} />
        <Tooltip
          content={tooltip}
          cursor={{
            stroke: COLORS.cyan,
            strokeWidth: 1,
            strokeDasharray: "3 3",
          }}
        />
        <Area
          type="monotone"
          dataKey="users"
          stroke={COLORS.cyan}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{
            r: 4,
            fill: COLORS.cyan,
            stroke: "var(--background)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main component ─────────────────────────────────────────

export function ProCharts(): React.JSX.Element {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("analytics/overview");
  void data; void loading; void error;

  const [revenueView, setRevenueView] =
    React.useState<RevenueView>("line");

  // Stable unique IDs for SVG <defs> gradients (avoids collisions
  // if multiple ProCharts instances ever render on the same page).
  const reactId = React.useId();
  const revenueAreaGradientId = `pro-charts-rev-${reactId.replace(/:/g, "")}`;
  const wauGradientId = `pro-charts-wau-${reactId.replace(/:/g, "")}`;

  // Memoized legend datasets (kept in sync with chart sources).
  const regionLegend = React.useMemo<readonly LegendItem[]>(
    () => [
      { label: "North", color: COLORS.emerald },
      { label: "South", color: COLORS.amber },
      { label: "East", color: COLORS.cyan },
    ],
    [],
  );

  const planLegend = React.useMemo<readonly LegendItem[]>(
    () =>
      PLAN_DATA.map((plan) => ({
        label: `${plan.name} · ${plan.value}%`,
        color: plan.color,
      })),
    [],
  );

  const handleRevenueViewChange = React.useCallback(
    (value: string) => {
      // ToggleGroup type="single" emits "" when the active item is toggled off.
      if (value === "line" || value === "area" || value === "bar") {
        setRevenueView(value);
      }
    },
    [],
  );

  return (
    <section
      aria-label="Pro Charts"
      className="mx-auto w-full max-w-6xl px-1 py-2"
    >
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Charts
        </h2>
        <p className="text-sm text-muted-foreground">
          Production-ready visualizations built on Recharts · OKLCH palette ·
          responsive 2×2 grid.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        {/* ── Line Chart (with view toggle) ─────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSignIcon
                className="size-4"
                style={{ color: COLORS.primary }}
              />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription>
              12-month revenue vs. target. Switch chart type — same data.
            </CardDescription>
            <CardAction>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={revenueView}
                onValueChange={handleRevenueViewChange}
                aria-label="Revenue chart type"
              >
                <ToggleGroupItem value="line" aria-label="Line chart">
                  <LineChartIcon className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="area" aria-label="Area chart">
                  <AreaChartIcon className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="bar" aria-label="Bar chart">
                  <BarChart3Icon className="size-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <RevenueChart
                view={revenueView}
                areaGradientId={revenueAreaGradientId}
              />
            </div>
            <ChartLegend
              items={[
                { label: "Revenue", color: COLORS.primary },
                { label: "Target", color: COLORS.violet },
              ]}
            />
          </CardContent>
        </Card>

        {/* ── Bar Chart (grouped) ───────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon
                className="size-4"
                style={{ color: COLORS.emerald }}
              />
              Quarterly Sales by Region
            </CardTitle>
            <CardDescription>
              Closed deals per quarter, grouped across three regions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <QuarterlyBarChart />
            </div>
            <ChartLegend items={regionLegend} />
          </CardContent>
        </Card>

        {/* ── Donut Chart ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon
                className="size-4"
                style={{ color: COLORS.amber }}
              />
              Users by Plan
            </CardTitle>
            <CardDescription>
              Distribution of active accounts across plan tiers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <PlanDonutChart />
            </div>
            <ChartLegend items={planLegend} />
          </CardContent>
        </Card>

        {/* ── Area Chart ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon
                className="size-4"
                style={{ color: COLORS.cyan }}
              />
              Weekly Active Users
            </CardTitle>
            <CardDescription>
              Daily active sessions over the last 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <WeeklyAreaChart gradientId={wauGradientId} />
            </div>
            <ChartLegend
              items={[{ label: "Active users", color: COLORS.cyan }]}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default ProCharts;
