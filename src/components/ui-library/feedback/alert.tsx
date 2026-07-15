"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useState, useEffect } from "react";

// ─── Alert ───────────────────────────────────────────────────

interface AlertProps {
  severity: "success" | "warning" | "danger" | "info";
  title?: string;
  children?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const severityConfig = {
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  danger: { icon: AlertCircle, color: "text-danger", bg: "bg-danger/10", border: "border-danger/30" },
  info: { icon: Info, color: "text-info", bg: "bg-info/10", border: "border-info/30" },
};

export function Alert({ severity, title, children, dismissible, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(true);
  const config = severityConfig[severity];
  const Icon = config.icon;

  if (!visible) return null;

  return (
    <div
      className={cn("flex items-start gap-3 p-4 rounded-xl border", config.bg, config.border)}
      role="alert"
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", config.color)} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm text-foreground">{title}</p>}
        {children && <div className="text-sm text-muted-foreground mt-0.5">{children}</div>}
      </div>
      {dismissible && (
        <button
          onClick={() => { setVisible(false); onDismiss?.(); }}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

// ─── Progress ────────────────────────────────────────────────

interface ProgressProps {
  value: number; // 0-100
  variant?: "bar" | "circular";
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger";
  label?: boolean;
}

const progressColors = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Progress({ value, variant = "bar", size = "md", color = "primary", label }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  if (variant === "circular") {
    const dim = { sm: 32, md: 48, lg: 64 }[size];
    const stroke = { sm: 3, md: 4, lg: 5 }[size];
    const radius = (dim - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted/30" />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-300"
            stroke="currentColor"
            style={{ color: `var(--${color === "primary" ? "primary" : color})` }}
          />
        </svg>
        {label && (
          <span className="absolute text-xs font-medium text-foreground">
            {Math.round(clamped)}%
          </span>
        )}
      </div>
    );
  }

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
  return (
    <div className="w-full">
      <div className={cn("w-full rounded-full bg-muted/50 overflow-hidden", heights[size])}>
        <motion.div
          className={cn("h-full rounded-full", progressColors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {label && <p className="mt-1 text-xs text-muted-foreground">{Math.round(clamped)}%</p>}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────

interface SkeletonProps {
  variant?: "text" | "rect" | "circle" | "card";
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export function Skeleton({ variant = "rect", width, height, lines = 3, className }: SkeletonProps) {
  if (variant === "text") {
    return (
      <div className={cn("space-y-2", className)} style={{ width }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-muted/50 animate-pulse"
            style={{ width: i === lines - 1 ? "70%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  const shape = {
    rect: "rounded-lg",
    circle: "rounded-full",
    card: "rounded-xl",
  }[variant];

  return (
    <div
      className={cn(shape, "bg-muted/50 animate-pulse", className)}
      style={{ width: width || (variant === "circle" ? 40 : "100%"), height: height || (variant === "circle" ? 40 : 20) }}
    />
  );
}

// ─── Spinner ─────────────────────────────────────────────────

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "muted" | "white";
}

const spinnerSizes = { xs: "size-3", sm: "size-4", md: "size-6", lg: "size-8", xl: "size-12" };

export function Spinner({ size = "md", color = "primary" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "rounded-full border-2 border-muted/30 animate-spin",
        spinnerSizes[size],
        color === "primary" && "border-t-primary",
        color === "muted" && "border-t-muted-foreground",
        color === "white" && "border-t-white"
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

// ─── Toast ───────────────────────────────────────────────────

interface ToastItem {
  id: string;
  message: string;
  severity: "success" | "warning" | "danger" | "info";
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
}

export function ToastContainer({ toasts, onDismiss, position = "top-right" }: ToastContainerProps) {
  const posClass = {
    "top-right": "top-4 right-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  }[position];

  return (
    <div className={cn("fixed z-[100] flex flex-col gap-2", posClass)}>
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = severityConfig[toast.severity];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-72", config.bg, config.border)}
            >
              <Icon className={cn("size-5 shrink-0", config.color)} />
              <p className="text-sm text-foreground flex-1">{toast.message}</p>
              <button onClick={() => onDismiss(toast.id)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── useToast hook ───────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));
  const toast = (message: string, severity: ToastItem["severity"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, severity }]);
    setTimeout(() => dismiss(id), 4000);
  };

  return { toasts, dismiss, toast };
}
