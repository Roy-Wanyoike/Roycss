"use client";

import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronRight, MoreHorizontal } from "lucide-react";

// ─── Tabs ────────────────────────────────────────────────────

interface TabsProps {
  items: { id: string; label: string; content?: React.ReactNode }[];
  variant?: "underline" | "pills" | "segmented";
  defaultTab?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ items, variant = "underline", defaultTab, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab || items[0]?.id);

  const handleTabChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div>
      <div
        className={cn(
          "flex gap-1",
          variant === "underline" && "border-b border-border/50",
          variant === "pills" && "gap-2",
          variant === "segmented" && "p-1 rounded-xl bg-muted/50"
        )}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-all cursor-pointer",
              variant === "underline" && "pb-3",
              active === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
              variant === "pills" && "rounded-full",
              variant === "pills" && active === item.id && "bg-primary text-primary-foreground",
              variant === "segmented" && "rounded-lg",
              variant === "segmented" && active === item.id && "bg-card shadow-sm"
            )}
          >
            {item.label}
            {variant === "underline" && active === item.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
        ))}
      </div>
      {items.find((i) => i.id === active)?.content && (
        <div className="pt-4">{items.find((i) => i.id === active)?.content}</div>
      )}
    </div>
  );
}

// ─── Breadcrumb ──────────────────────────────────────────────

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  separator?: React.ReactNode;
}

export function Breadcrumb({ items, separator }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {item.href ? (
              <a href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </a>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && (separator || <ChevronRight className="size-3.5 text-muted-foreground/50" />)}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ─── Pagination ──────────────────────────────────────────────

interface PaginationProps {
  total: number;
  current: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({ total, current, onPageChange, siblingCount = 1 }: PaginationProps) {
  const range: (number | string)[] = [];
  const left = Math.max(1, current - siblingCount);
  const right = Math.min(total, current + siblingCount);

  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) if (i !== 1 && i !== total) range.push(i);
  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      {range.map((item, i) =>
        typeof item === "number" ? (
          <button
            key={i}
            onClick={() => onPageChange(item)}
            className={cn(
              "size-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer",
              item === current
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            aria-current={item === current ? "page" : undefined}
          >
            {item}
          </button>
        ) : (
          <span key={i} className="px-2 text-muted-foreground">
            {item}
          </span>
        )
      )}
    </nav>
  );
}

// ─── Menu (Dropdown) ─────────────────────────────────────────

interface MenuItem {
  label: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  separator?: boolean;
}

interface MenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
}

export function Menu({ trigger, items, align = "start" }: MenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute z-50 mt-2 min-w-48 rounded-xl border border-border/50 bg-popover shadow-lg p-1.5",
              align === "end" ? "end-0" : "start-0"
            )}
          >
            {items.map((item, i) =>
              item.separator ? (
                <div key={i} className="h-px bg-border/30 my-1" />
              ) : (
                <button
                  key={i}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer",
                    item.danger
                      ? "text-danger hover:bg-danger/10"
                      : "text-foreground hover:bg-muted/50"
                  )}
                >
                  {item.icon && <item.icon className="size-4" />}
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
