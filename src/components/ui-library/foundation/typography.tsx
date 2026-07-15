"use client";

import { tokens } from "./tokens";
import { cn } from "@/lib/utils";

type Scale = "display" | "heading" | "body" | "caption" | "code";
type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
type Weight = "normal" | "medium" | "semibold" | "bold";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  scale?: Scale;
  size?: Size;
  weight?: Weight;
  gradient?: boolean;
  balance?: boolean;
  children: React.ReactNode;
}

const scaleFontFamily: Record<Scale, string> = {
  display: tokens.typography.fontFamily.display,
  heading: tokens.typography.fontFamily.sans,
  body: tokens.typography.fontFamily.sans,
  caption: tokens.typography.fontFamily.sans,
  code: tokens.typography.fontFamily.mono,
};

const sizeMap: Record<Size, string> = tokens.typography.fontSize;
const weightMap: Record<Weight, string> = tokens.typography.fontWeight;

export function Typography({
  scale = "body",
  size = "base",
  weight = "normal",
  gradient = false,
  balance = false,
  className,
  style,
  children,
  ...props
}: TypographyProps) {
  return (
    <span
      className={cn(gradient && "roycss-animated-gradient-text", balance && "text-balance", className)}
      style={{
        fontFamily: scaleFontFamily[scale],
        fontSize: sizeMap[size],
        fontWeight: weightMap[weight],
        lineHeight: scale === "display" || scale === "heading" ? "1.25" : "1.5",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

export function Heading({
  level = 2,
  scale = "heading",
  size,
  weight = "bold",
  className,
  children,
  ...props
}: Omit<TypographyProps, "scale"> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const defaultSize: Record<number, Size> = { 1: "4xl", 2: "3xl", 3: "2xl", 4: "xl", 5: "lg", 6: "base" };
  const Tag = `h${level}` as const;
  return (
    <Typography
      as={Tag}
      scale={scale}
      size={size || defaultSize[level]}
      weight={weight}
      balance
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Text({ className, children, ...props }: TypographyProps) {
  return (
    <Typography scale="body" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function Caption({ className, children, ...props }: TypographyProps) {
  return (
    <Typography scale="caption" size="sm" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function Code({ className, children, ...props }: TypographyProps) {
  return (
    <Typography
      scale="code"
      size="sm"
      className={cn(
        "px-1.5 py-0.5 rounded-md bg-muted/80 border border-border/50",
        className
      )}
      {...props}
    >
      {children}
    </Typography>
  );
}
