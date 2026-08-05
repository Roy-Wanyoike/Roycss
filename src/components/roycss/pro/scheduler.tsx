"use client";

/**
 * ProScheduler — a production-ready Calendar / Scheduler component.
 *
 * Self-contained (no props, mock events generated from the current month).
 * Ships two views:
 *   • Month — 7-col × 6-row grid with prev/next/today nav, colored event
 *     badges (max 3 visible + "+N more"), weekend tinting, today highlight.
 *   • Week  — 7-day grid with 24 hourly slots (0:00–23:00), events
 *     absolutely positioned by start minute, overlap-aware column layout,
 *     and a live "now" indicator on today's column.
 *
 * Interactions:
 *   • Day click   → inline detail panel listing every event for that day.
 *   • Event click → dialog with full event details (title, date, time,
 *     duration, location, description).
 *
 * Responsive: defaults to Week on mobile / Month on desktop (via the
 * `useIsMobile` hook) until the user manually toggles. All date math uses
 * native `Date` — no date library. TS strict, zero `any`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  Clock,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// ═══════════════════════════════════════════════════════════════════════
// useMounted — SSR-safe mount detection via useSyncExternalStore.
// Returns `false` during SSR + first client render (hydration), then `true`.
// Avoids both hydration mismatches and the `setState-in-effect` anti-pattern.
// ═══════════════════════════════════════════════════════════════════════

const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type EventColor = "emerald" | "amber" | "rose" | "cyan" | "violet";
type ViewMode = "month" | "week";

interface SchedulerEvent {
  id: string;
  title: string;
  date: Date;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: EventColor;
  description: string;
  location?: string;
}

interface PositionedEvent {
  event: SchedulerEvent;
  column: number;
  columns: number;
}

interface MockEventTemplate
  extends Omit<SchedulerEvent, "date"> {
  day: number;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** 1px per minute — keeps event positioning math trivial. */
const HOUR_HEIGHT_PX = 60;
const MAX_VISIBLE_EVENTS = 3;
const DAY_COUNT = 42; // 6 weeks × 7 days

const COLOR_STYLES: Record<
  EventColor,
  { badge: string; block: string; dot: string; text: string; label: string }
> = {
  emerald: {
    label: "Emerald",
    badge:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20",
    block:
      "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/25",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    label: "Amber",
    badge:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20",
    block:
      "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/40 hover:bg-amber-500/25",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  rose: {
    label: "Rose",
    badge:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25 hover:bg-rose-500/20",
    block:
      "bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/40 hover:bg-rose-500/25",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-300",
  },
  cyan: {
    label: "Cyan",
    badge:
      "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25 hover:bg-cyan-500/20",
    block:
      "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 border-cyan-500/40 hover:bg-cyan-500/25",
    dot: "bg-cyan-500",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  violet: {
    label: "Violet",
    badge:
      "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25 hover:bg-violet-500/20",
    block:
      "bg-violet-500/15 text-violet-800 dark:text-violet-200 border-violet-500/40 hover:bg-violet-500/25",
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
  },
};

const MOCK_TEMPLATES: MockEventTemplate[] = [
  {
    id: "e1",
    day: 3,
    startHour: 9, startMinute: 0,
    endHour: 10, endMinute: 0,
    color: "emerald",
    title: "Team Standup",
    description:
      "Weekly sync with the engineering team to review sprint progress, surface blockers, and align on priorities for the week ahead.",
    location: "Zoom — Engineering",
  },
  {
    id: "e2",
    day: 5,
    startHour: 14, startMinute: 30,
    endHour: 15, endMinute: 30,
    color: "amber",
    title: "Design Review",
    description:
      "Walk through the new dashboard mockups with the design team and gather feedback for the next iteration before handoff.",
    location: "Figma — Room 2",
  },
  {
    id: "e3",
    day: 7,
    startHour: 11, startMinute: 0,
    endHour: 12, endMinute: 0,
    color: "rose",
    title: "1:1 with Sarah",
    description:
      "Monthly career check-in with Sarah to discuss recent wins, growth opportunities, and goals for the next quarter.",
    location: "Coffee Bar",
  },
  {
    id: "e4",
    day: 10,
    startHour: 16, startMinute: 0,
    endHour: 17, endMinute: 0,
    color: "cyan",
    title: "Product Demo",
    description:
      "Live demo of the new analytics features for the customer advisory board. Prepare the staging environment beforehand.",
    location: "Main Stage",
  },
  {
    id: "e5",
    day: 12,
    startHour: 9, startMinute: 30,
    endHour: 11, endMinute: 0,
    color: "violet",
    title: "Architecture Workshop",
    description:
      "Deep-dive session on the new service-oriented architecture, ownership boundaries, and the phased migration plan.",
    location: "Whiteboard Room",
  },
  {
    id: "e6",
    day: 15,
    startHour: 13, startMinute: 0,
    endHour: 14, endMinute: 0,
    color: "emerald",
    title: "Lunch with Roy",
    description:
      "Casual lunch to discuss the open-source roadmap, upcoming conference talks, and potential collaborations.",
    location: "Café Nero",
  },
  {
    id: "e7",
    day: 18,
    startHour: 10, startMinute: 0,
    endHour: 11, endMinute: 30,
    color: "amber",
    title: "Sprint Planning",
    description:
      "Plan the upcoming two-week sprint: review the backlog, assign owners, and estimate story points for the top candidates.",
    location: "Boardroom A",
  },
  {
    id: "e8",
    day: 22,
    startHour: 15, startMinute: 0,
    endHour: 16, endMinute: 0,
    color: "rose",
    title: "Customer QBR",
    description:
      "Quarterly business review with our largest enterprise customer. Walk through usage metrics, roadmap, and renewal terms.",
    location: "Google Meet",
  },
  {
    id: "e9",
    day: 25,
    startHour: 9, startMinute: 0,
    endHour: 9, endMinute: 45,
    color: "cyan",
    title: "Bug Triage",
    description:
      "Review and prioritize the open bug backlog with QA. Assign severity levels and target the fix release for each item.",
    location: "Linear",
  },
  {
    id: "e10",
    day: 27,
    startHour: 18, startMinute: 30,
    endHour: 20, endMinute: 0,
    color: "violet",
    title: "Community Meetup",
    description:
      "Online meetup with the RoyCSS community — Q&A session, live coding, and a sneak peek at the next major release.",
    location: "Discord — Stage",
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Date utilities — pure functions, native Date only
// ═══════════════════════════════════════════════════════════════════════

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - out.getDay()); // Sunday-based
  return out;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function eventStartMinutes(e: SchedulerEvent): number {
  return e.startHour * 60 + e.startMinute;
}

function eventDurationMinutes(e: SchedulerEvent): number {
  return e.endHour * 60 + e.endMinute - (e.startHour * 60 + e.startMinute);
}

function formatTime(hour: number, minute: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatTimeRange(e: SchedulerEvent): string {
  return `${formatTime(e.startHour, e.startMinute)} – ${formatTime(e.endHour, e.endMinute)}`;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startStr = weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${startStr} – ${endStr}, ${weekEnd.getFullYear()}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ═══════════════════════════════════════════════════════════════════════
// Overlap layout — assign side-by-side columns to overlapping events
// ═══════════════════════════════════════════════════════════════════════

function layoutDayEvents(events: SchedulerEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) =>
      eventStartMinutes(a) - eventStartMinutes(b) ||
      eventDurationMinutes(b) - eventDurationMinutes(a),
  );

  // Cluster events whose time-ranges chain together (transitive overlap).
  const clusters: SchedulerEvent[][] = [];
  let currentCluster: SchedulerEvent[] = [];
  let clusterEnd = -1;

  for (const ev of sorted) {
    const start = eventStartMinutes(ev);
    const end = start + eventDurationMinutes(ev);
    if (currentCluster.length > 0 && start >= clusterEnd) {
      clusters.push(currentCluster);
      currentCluster = [];
    }
    currentCluster.push(ev);
    clusterEnd = Math.max(clusterEnd, end);
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const result: PositionedEvent[] = [];
  for (const cluster of clusters) {
    // Greedily pack each event into the first column whose last event
    // finishes before this one starts.
    const columns: SchedulerEvent[][] = [];
    for (const ev of cluster) {
      const start = eventStartMinutes(ev);
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const last = columns[c][columns[c].length - 1];
        const lastEnd =
          eventStartMinutes(last) + eventDurationMinutes(last);
        if (lastEnd <= start) {
          columns[c].push(ev);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([ev]);
    }
    const totalColumns = columns.length;
    for (let c = 0; c < totalColumns; c++) {
      for (const ev of columns[c]) {
        result.push({ event: ev, column: c, columns: totalColumns });
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// Mock events — derived from the current month so they're always relevant
// ═══════════════════════════════════════════════════════════════════════

function buildMockEvents(today: Date): SchedulerEvent[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const maxDay = lastDayOfMonth(year, month);
  const todayDay = today.getDate();

  const base: SchedulerEvent[] = MOCK_TEMPLATES.map(({ day, ...rest }) => ({
    ...rest,
    date: new Date(year, month, Math.min(day, maxDay)),
  }));

  // Always include one event landing on today, so the "Today" cell and the
  // current week in Week view are guaranteed to have content.
  const todayEvent: SchedulerEvent = {
    id: "e-today",
    title: "Focus Block",
    date: new Date(year, month, todayDay),
    startHour: 13,
    startMinute: 0,
    endHour: 14,
    endMinute: 30,
    color: "emerald",
    description:
      "Deep-work block reserved for code review, PR merges, and focused engineering. No meetings during this window.",
    location: "Focus Room",
  };

  return [...base, todayEvent];
}

// ═══════════════════════════════════════════════════════════════════════
// MonthGrid — 7-col × 6-row calendar grid
// ═══════════════════════════════════════════════════════════════════════

interface MonthGridProps {
  days: Date[];
  viewDate: Date;
  today: Date;
  selectedDay: Date | null;
  eventsByDay: Map<string, SchedulerEvent[]>;
  onDayClick: (day: Date) => void;
  onEventClick: (event: SchedulerEvent) => void;
}

function MonthGrid({
  days,
  viewDate,
  today,
  selectedDay,
  eventsByDay,
  onDayClick,
  onEventClick,
}: MonthGridProps) {
  const handleKey =
    (day: Date) => (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onDayClick(day);
      }
    };

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide",
              i === 0 || i === 6
                ? "text-muted-foreground/70"
                : "text-muted-foreground",
            )}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden" aria-hidden>
              {label.charAt(0)}
            </span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const col = i % 7;
          const row = Math.floor(i / 7);
          const isLastRow = row === 5;
          const isLastCol = col === 6;
          const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
          const isToday = isSameDay(day, today);
          const inMonth =
            day.getMonth() === viewDate.getMonth() &&
            day.getFullYear() === viewDate.getFullYear();
          const weekend = isWeekend(day);
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const overflow = Math.max(
            0,
            dayEvents.length - MAX_VISIBLE_EVENTS,
          );

          return (
            <div
              key={dayKey(day)}
              role="button"
              tabIndex={0}
              aria-label={`${formatLongDate(day)}, ${dayEvents.length} event${
                dayEvents.length === 1 ? "" : "s"
              }`}
              onClick={() => onDayClick(day)}
              onKeyDown={handleKey(day)}
              className={cn(
                "group relative flex min-h-[76px] flex-col gap-1 p-1.5 outline-none transition-colors sm:min-h-[96px]",
                "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                !isLastRow && "border-b",
                !isLastCol && "border-r",
                !inMonth && "bg-muted/25",
                inMonth && weekend && "bg-muted/15",
                isToday && "bg-primary/8",
                isSelected && "ring-2 ring-inset ring-primary",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-medium tabular-nums text-muted-foreground/70">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    className={cn(
                      "flex items-center gap-1 rounded border px-1 py-0.5 text-left text-[10px] font-medium transition-colors sm:text-[11px]",
                      COLOR_STYLES[ev.color].badge,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        COLOR_STYLES[ev.color].dot,
                      )}
                    />
                    <span className="truncate">{ev.title}</span>
                  </button>
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(day);
                    }}
                    className="px-1 text-left text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// WeekGrid — 7-day week with 24 hourly slots, events positioned by time
// ═══════════════════════════════════════════════════════════════════════

interface WeekGridProps {
  weekDays: Date[];
  today: Date;
  nowMinutes: number;
  eventsByDay: Map<string, SchedulerEvent[]>;
  onEventClick: (event: SchedulerEvent) => void;
  onDayClick: (day: Date) => void;
}

function WeekGrid({
  weekDays,
  today,
  nowMinutes,
  eventsByDay,
  onEventClick,
  onDayClick,
}: WeekGridProps) {
  return (
    <div
      className="overflow-auto rounded-lg border bg-card"
      style={{ maxHeight: 600 }}
    >
      <div className="min-w-[640px]">
        {/* Header row */}
        <div className="sticky top-0 z-20 grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b bg-card">
          <div className="border-r" />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            const weekend = isWeekend(day);
            return (
              <button
                key={dayKey(day)}
                type="button"
                onClick={() => onDayClick(day)}
                className={cn(
                  "border-r px-2 py-2 text-center transition-colors last:border-r-0 hover:bg-accent/50",
                  weekend && "bg-muted/15",
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {WEEKDAY_LABELS[day.getDay()]}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-0.5 inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {day.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Body: time gutter + 7 day columns */}
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          {/* Time gutter */}
          <div className="relative">
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className={cn(
                  "border-r pr-1.5 pt-0.5 text-right text-[10px] font-medium tabular-nums text-muted-foreground/80",
                  hour < 23 && "border-b",
                )}
                style={{ height: HOUR_HEIGHT_PX }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
            const positioned = layoutDayEvents(dayEvents);
            const isToday = isSameDay(day, today);
            const weekend = isWeekend(day);
            return (
              <div
                key={dayKey(day)}
                className={cn(
                  "relative border-r last:border-r-0",
                  weekend && "bg-muted/10",
                )}
              >
                {/* Hour grid lines */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div
                    key={hour}
                    className={cn("border-b", hour === 23 && "border-b-0")}
                    style={{ height: HOUR_HEIGHT_PX }}
                  />
                ))}

                {/* Now indicator */}
                {isToday && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-10"
                    style={{ top: nowMinutes }}
                    aria-hidden
                  >
                    <div className="relative h-px bg-primary">
                      <span className="absolute -left-1 -top-1 size-2 rounded-full bg-primary" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {positioned.map(({ event, column, columns }) => {
                  const start = eventStartMinutes(event);
                  const dur = eventDurationMinutes(event);
                  const widthPct = 100 / columns;
                  const leftPct = column * widthPct;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={cn(
                        "absolute overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors",
                        COLOR_STYLES[event.color].block,
                      )}
                      style={{
                        top: start + 1,
                        height: Math.max(dur - 2, 18),
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    >
                      <div className="truncate font-semibold">{event.title}</div>
                      {dur >= 30 && (
                        <div className="truncate opacity-80">
                          {formatTime(event.startHour, event.startMinute)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DayDetailPanel — inline panel listing every event for the selected day
// ═══════════════════════════════════════════════════════════════════════

interface DayDetailPanelProps {
  selectedDay: Date | null;
  events: SchedulerEvent[];
  onClose: () => void;
  onEventClick: (event: SchedulerEvent) => void;
}

function DayDetailPanel({
  selectedDay,
  events,
  onClose,
  onEventClick,
}: DayDetailPanelProps) {
  if (!selectedDay) return null;

  return (
    <div className="mt-4 rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">
            {formatLongDate(selectedDay)}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {events.length === 0
              ? "No events scheduled"
              : `${events.length} event${events.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close detail panel"
        >
          <X className="size-4" />
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          Nothing on the books for this day. Enjoy the breathing room.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onEventClick(ev)}
                className="flex w-full items-start gap-3 rounded-md border bg-card p-2.5 text-left transition-colors hover:bg-accent"
              >
                <span
                  className={cn(
                    "mt-1 size-2.5 shrink-0 rounded-full",
                    COLOR_STYLES[ev.color].dot,
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{ev.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatTimeRange(ev)}
                  </div>
                  {ev.location && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// EventDetailDialog — full details for a clicked event
// ═══════════════════════════════════════════════════════════════════════

interface EventDetailDialogProps {
  event: SchedulerEvent | null;
  onClose: () => void;
}

function EventDetailDialog({ event, onClose }: EventDetailDialogProps) {
  return (
    <Dialog
      open={!!event}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {event && (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    COLOR_STYLES[event.color].dot,
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    COLOR_STYLES[event.color].text,
                  )}
                >
                  {COLOR_STYLES[event.color].label}
                </span>
              </div>
              <DialogTitle>{event.title}</DialogTitle>
              <DialogDescription>
                {formatLongDate(event.date)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{formatTimeRange(event)}</span>
                </div>
                <span className="text-muted-foreground">
                  · {eventDurationMinutes(event)} min
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}

              <p className="border-t pt-3 text-sm leading-relaxed text-muted-foreground">
                {event.description}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ProScheduler — main export
// ═══════════════════════════════════════════════════════════════════════

export function ProScheduler() {
  const [today] = useState<Date>(() => new Date());
  const [now, setNow] = useState<Date>(() => new Date());
  const [viewDate, setViewDate] = useState<Date>(() => startOfDay(today));
  // `userMode` is `null` until the user explicitly picks a view, after which
  // it wins over the viewport-derived default. Derived during render (no
  // effect) per React's "adjust state when props change" guidance.
  const [userMode, setUserMode] = useState<ViewMode | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SchedulerEvent | null>(
    null,
  );

  const isMobile = useIsMobile();
  const mounted = useMounted();
  const mode: ViewMode = userMode ?? (isMobile ? "week" : "month");

  // Tick the "now" indicator every minute.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const events = useMemo(() => buildMockEvents(today), [today]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, SchedulerEvent[]>();
    for (const ev of events) {
      const key = dayKey(ev.date);
      const arr = map.get(key);
      if (arr) arr.push(ev);
      else map.set(key, [ev]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => eventStartMinutes(a) - eventStartMinutes(b));
    }
    return map;
  }, [events]);

  const monthDays = useMemo(() => {
    const first = startOfMonth(viewDate);
    const start = startOfWeek(first);
    return Array.from({ length: DAY_COUNT }, (_, i) => addDays(start, i));
  }, [viewDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(viewDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [viewDate]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const headerLabel = useMemo(() => {
    if (mode === "month") return formatMonthYear(startOfMonth(viewDate));
    return formatWeekRange(startOfWeek(viewDate));
  }, [mode, viewDate]);

  const goPrev = useCallback(() => {
    setViewDate((d) =>
      mode === "month" ? addMonths(d, -1) : addDays(d, -7),
    );
  }, [mode]);

  const goNext = useCallback(() => {
    setViewDate((d) =>
      mode === "month" ? addMonths(d, 1) : addDays(d, 7),
    );
  }, [mode]);

  const goToday = useCallback(() => {
    setViewDate(startOfDay(today));
    setSelectedDay(startOfDay(today));
  }, [today]);

  const handleModeChange = useCallback((next: ViewMode) => {
    setUserMode(next);
  }, []);

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDay(startOfDay(day));
  }, []);

  const handleEventClick = useCallback((event: SchedulerEvent) => {
    setSelectedEvent(event);
  }, []);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDay.get(dayKey(selectedDay)) ?? [];
  }, [selectedDay, eventsByDay]);

  // ─── SSR / pre-mount skeleton (no date-dependent content) ──────────
  if (!mounted) {
    return (
      <div className="w-full rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted/60" />
            </div>
          </div>
          <div className="h-9 w-48 rounded bg-muted" />
        </div>
        <div className="p-4">
          <div className="h-80 rounded-lg bg-muted/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* ─── Header / toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarRange className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold leading-none">
              Pro Scheduler
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {headerLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              aria-label={
                mode === "month" ? "Previous month" : "Previous week"
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goNext}
              aria-label={mode === "month" ? "Next month" : "Next week"}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* View toggle */}
          <div
            role="tablist"
            aria-label="Calendar view"
            className="inline-flex h-9 items-center rounded-md border bg-muted/40 p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "month"}
              onClick={() => handleModeChange("month")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded px-3 text-sm font-medium transition-colors",
                mode === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarDays className="size-3.5" />
              <span className="hidden xs:inline sm:inline">Month</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "week"}
              onClick={() => handleModeChange("week")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded px-3 text-sm font-medium transition-colors",
                mode === "week"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarRange className="size-3.5" />
              <span className="hidden xs:inline sm:inline">Week</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Calendar body ────────────────────────────────────────────── */}
      <div className="p-4">
        {mode === "month" ? (
          <MonthGrid
            days={monthDays}
            viewDate={viewDate}
            today={today}
            selectedDay={selectedDay}
            eventsByDay={eventsByDay}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        ) : (
          <WeekGrid
            weekDays={weekDays}
            today={today}
            nowMinutes={nowMinutes}
            eventsByDay={eventsByDay}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        )}

        {/* Day detail panel */}
        <DayDetailPanel
          selectedDay={selectedDay}
          events={selectedDayEvents}
          onClose={() => setSelectedDay(null)}
          onEventClick={handleEventClick}
        />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3">
          <span className="text-xs font-medium text-muted-foreground">
            Categories:
          </span>
          {(Object.keys(COLOR_STYLES) as EventColor[]).map((color) => (
            <div key={color} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  COLOR_STYLES[color].dot,
                )}
              />
              <span className="text-xs text-muted-foreground">
                {COLOR_STYLES[color].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Event detail dialog */}
      <EventDetailDialog
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
