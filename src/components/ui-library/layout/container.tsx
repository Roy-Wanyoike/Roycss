"use client";

import { cn } from "@/lib/utils";

// ─── Container ───────────────────────────────────────────────

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  centered?: boolean;
}

const maxWidthMap = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-[90rem]",
  full: "max-w-none",
};

const paddingMap = {
  none: "",
  sm: "px-4",
  md: "px-4 sm:px-6",
  lg: "px-4 sm:px-6 lg:px-8",
};

export function Container({
  maxWidth = "xl",
  padding = "md",
  centered = true,
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(maxWidthMap[maxWidth], paddingMap[padding], centered && "mx-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Grid ────────────────────────────────────────────────────

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  responsive?: boolean;
}

const colsMap = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
};

const gapMap = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export function Grid({
  cols = 3,
  gap = "md",
  responsive = true,
  className,
  children,
  ...props
}: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        responsive ? `grid-cols-1 sm:grid-cols-2 lg:${colsMap[cols]}` : colsMap[cols],
        gapMap[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Stack ───────────────────────────────────────────────────

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
}

const alignMap = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };
const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export function Stack({
  direction = "column",
  gap = "md",
  align,
  justify,
  wrap = false,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        wrap && "flex-wrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  position?: "start" | "end";
  width?: "sm" | "md" | "lg";
  collapsible?: boolean;
}

const widthMap = { sm: "w-48", md: "w-64", lg: "w-80" };

export function Sidebar({
  position = "start",
  width = "md",
  collapsible = false,
  className,
  children,
  ...props
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "shrink-0 border-border/50 bg-card/50 backdrop-blur-sm",
        widthMap[width],
        position === "start" ? "border-e" : "border-s",
        collapsible && "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
