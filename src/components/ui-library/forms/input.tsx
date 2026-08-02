"use client";

import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";

// ─── Input ───────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: "outline" | "filled" | "underline";
  size?: "sm" | "md" | "lg";
  error?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const inputVariants = {
  outline: "border border-border/50 bg-background focus:border-primary",
  filled: "border border-transparent bg-muted/60 focus:bg-muted",
  underline: "border-0 border-b-2 border-border/50 bg-transparent rounded-none focus:border-primary",
};

const inputSizes = { sm: "h-8 text-xs px-2.5", md: "h-10 text-sm px-3", lg: "h-12 text-base px-4" };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "outline", size = "md", error, icon: Icon, className, ...props }, ref) => (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/30",
          inputVariants[variant],
          inputSizes[size],
          Icon && "pl-9",
          error && "border-danger focus:border-danger focus-visible:ring-danger/30",
          className
        )}
        aria-invalid={error}
        {...props}
      />
    </div>
  )
);
Input.displayName = "Input";

// ─── Select ──────────────────────────────────────────────────

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  variant?: "outline" | "filled";
  size?: "sm" | "md" | "lg";
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ variant = "outline", size = "md", options, className, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full rounded-lg appearance-none outline-none transition-all cursor-pointer pe-9",
          variant === "outline" ? "border border-border/50 bg-background focus:border-primary" : "bg-muted/60",
          inputSizes[size],
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
    </div>
  )
);
Select.displayName = "Select";

// ─── Checkbox ────────────────────────────────────────────────

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, indeterminate, className, ...props }, ref) => (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <span className="relative inline-flex">
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "size-5 rounded-md border-2 border-border/50 transition-all",
            "peer-checked:bg-primary peer-checked:border-primary",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30",
            "flex items-center justify-center",
            className
          )}
        >
          {indeterminate ? (
            <span className="size-2.5 bg-primary-foreground rounded-sm" />
          ) : (
            <Check className="size-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
          )}
        </span>
      </span>
      {label && <span className="text-sm text-foreground select-none">{label}</span>}
    </label>
  )
);
Checkbox.displayName = "Checkbox";

// ─── Toggle ──────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: "ios" | "material" | "square";
  size?: "sm" | "md" | "lg";
  label?: string;
  disabled?: boolean;
}

const toggleSizes = {
  sm: { track: "w-8 h-4", thumb: "size-3", translate: "translate-x-4" },
  md: { track: "w-11 h-6", thumb: "size-5", translate: "translate-x-5" },
  lg: { track: "w-14 h-7", thumb: "size-6", translate: "translate-x-7" },
};

export function Toggle({ checked, onChange, variant = "ios", size = "md", label, disabled }: ToggleProps) {
  const s = toggleSizes[size];
  return (
    <label className={cn("inline-flex items-center gap-2", disabled && "opacity-50 cursor-not-allowed")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex items-center transition-colors",
          s.track,
          variant === "square" ? "rounded-md" : "rounded-full",
          checked ? "bg-primary" : "bg-muted-foreground/30",
          !disabled && "cursor-pointer"
        )}
      >
        <span
          className={cn(
            "absolute start-0.5 rounded-full bg-white shadow-sm transition-transform",
            s.thumb,
            variant === "square" && "rounded-sm",
            checked && s.translate
          )}
        />
      </button>
      {label && <span className="text-sm text-foreground select-none">{label}</span>}
    </label>
  );
}

// ─── FormField ───────────────────────────────────────────────

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, hint, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
