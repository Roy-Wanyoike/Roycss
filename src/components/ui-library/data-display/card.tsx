"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ─── Card ────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "outline" | "elevated";
  hover?: "none" | "lift" | "glow" | "scale";
  padding?: "none" | "sm" | "md" | "lg";
}

const cardVariants = {
  default: "bg-card border border-border/50",
  glass: "bg-white/5 backdrop-blur-md border border-white/10",
  outline: "bg-transparent border-2 border-border",
  elevated: "bg-card border border-border/30 shadow-lg",
};

const cardHover = {
  none: "",
  lift: "hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
  glow: "hover:shadow-[0_0_20px_var(--primary)] transition-shadow duration-300",
  scale: "hover:scale-[1.02] transition-transform duration-300",
};

const cardPadding = { none: "", sm: "p-3", md: "p-4", lg: "p-6" };

export function Card({ variant = "default", hover = "none", padding = "md", className, children, ...props }: CardProps) {
  return (
    <div className={cn("rounded-xl", cardVariants[variant], cardHover[hover], cardPadding[padding], className)} {...props}>
      {children}
    </div>
  );
}

Card.Header = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-3", className)} {...props}>{children}</div>
);

Card.Body = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>{children}</div>
);

Card.Footer = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-3 pt-3 border-t border-border/30 flex items-center gap-2", className)} {...props}>{children}</div>
);

// ─── Badge ───────────────────────────────────────────────────

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  pulse?: boolean;
}

const badgeVariants = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary border border-primary/20",
  success: "bg-success/10 text-success border border-success/20",
  warning: "bg-warning/10 text-warning border border-warning/20",
  danger: "bg-danger/10 text-danger border border-danger/20",
  info: "bg-info/10 text-info border border-info/20",
  outline: "border border-border text-foreground",
};

const badgeSizes = { sm: "text-[9px] px-1.5 py-0", md: "text-[10px] px-2 py-0.5", lg: "text-xs px-2.5 py-1" };

export function Badge({ variant = "default", size = "md", dot, pulse, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-md font-medium", badgeVariants[variant], badgeSizes[size], className)}
      {...props}
    >
      {dot && (
        <span className={cn("size-1.5 rounded-full bg-current", pulse && "animate-pulse")} />
      )}
      {children}
    </span>
  );
}

// ─── Avatar ──────────────────────────────────────────────────

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  status?: "online" | "offline" | "away" | "busy";
}

const avatarSizes = {
  xs: "size-6 text-xs",
  sm: "size-8 text-sm",
  md: "size-10 text-base",
  lg: "size-12 text-lg",
  xl: "size-16 text-2xl",
};

const statusColors = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  away: "bg-warning",
  busy: "bg-danger",
};

export function Avatar({ src, alt, fallback, size = "md", ring, status }: AvatarProps) {
  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "rounded-full overflow-hidden flex items-center justify-center bg-muted text-muted-foreground font-medium",
          avatarSizes[size],
          ring && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        {src ? (
          <img src={src} alt={alt || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <span>{fallback || "?"}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
            statusColors[status],
            size === "xs" || size === "sm" ? "size-2" : "size-3"
          )}
        />
      )}
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortable?: boolean;
  hover?: boolean;
  emptyState?: React.ReactNode;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  sortable,
  hover = true,
  emptyState,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key: string) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (data.length === 0 && emptyState) {
    return <div className="py-12 text-center">{emptyState}</div>;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "text-start py-2.5 px-3 font-medium text-muted-foreground",
                  sortable && col.sortable !== false && "cursor-pointer hover:text-foreground transition-colors",
                  col.width
                )}
                onClick={() => handleSort(String(col.key))}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {sortKey === col.key && <span className="text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-border/30 transition-colors",
                hover && "hover:bg-muted/30"
              )}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="py-2.5 px-3 text-foreground">
                  {col.render ? col.render(row) : String(row[col.key as string] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState } from "react";
