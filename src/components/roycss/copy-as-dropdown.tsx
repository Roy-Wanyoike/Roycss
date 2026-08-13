"use client";

import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  ChevronDown,
  Code2,
  Braces,
  Wind,
  FileCode,
  Code,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { COPY_FORMATS, formatCss, type CopyFormat } from "@/lib/copy-formats";

const ICON_MAP: Record<string, LucideIcon> = {
  Code2,
  Braces,
  Wind,
  FileCode,
  Code,
};

interface CopyAsDropdownProps {
  /** Raw CSS to be formatted & copied. */
  css: string;
  /** Effect ID — used to locate the main `.roycss-<id>` rule and build framework identifiers. */
  effectId: string;
  /** Visual style of the trigger button. Defaults to the compact card style. */
  variant?: "compact" | "primary";
  /** Optional className merged onto the trigger button. */
  className?: string;
}

/**
 * "Copy as" dropdown — replaces the single Copy button on effect cards.
 *
 * Lets users copy CSS in 7 formats: CSS class, inline style, Tailwind config,
 * SCSS mixin, CSS-in-JS object, Vue SFC scoped style, and HTML snippet.
 *
 * Defaults to the same visual style as the old Copy button but adds a chevron
 * to signal it's now a dropdown. Clicking an item formats the CSS via
 * `formatCss`, writes to the clipboard, fires a success toast, and briefly
 * shows a check on the chosen item.
 */
export function CopyAsDropdown({
  css,
  effectId,
  variant = "compact",
  className,
}: CopyAsDropdownProps) {
  const [copiedFormat, setCopiedFormat] = useState<CopyFormat | null>(null);

  const handleCopy = useCallback(
    async (format: CopyFormat) => {
      const formatted = formatCss(css, effectId, format);
      const label =
        COPY_FORMATS.find((f) => f.id === format)?.label ?? format;
      try {
        await navigator.clipboard.writeText(formatted);
        setCopiedFormat(format);
        toast.success(`Copied as ${label}!`);
        setTimeout(() => setCopiedFormat(null), 2000);
      } catch {
        toast.error("Failed to copy — please try again");
      }
    },
    [css, effectId]
  );

  const triggerClass =
    variant === "primary"
      ? "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
      : "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background transition-all cursor-pointer";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={className ? `${triggerClass} ${className}` : triggerClass}
          aria-label="Copy CSS in different formats"
          aria-haspopup="menu"
        >
          {copiedFormat ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
          <span>{copiedFormat ? "Copied!" : "Copy"}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Copy as…
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COPY_FORMATS.map((opt) => {
          const Icon = ICON_MAP[opt.icon] ?? Code2;
          const isCopied = copiedFormat === opt.id;
          return (
            <DropdownMenuItem
              key={opt.id}
              onSelect={() => void handleCopy(opt.id)}
              className="flex items-start gap-2.5 py-2 cursor-pointer"
            >
              <Icon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-foreground">
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {opt.description}
                </span>
              </div>
              {isCopied && (
                <Check className="size-3.5 text-emerald-500 ml-auto shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
