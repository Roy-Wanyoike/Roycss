"use client";

/**
 * InputModeExplorer — a self-contained explorer for the HTML
 * `inputmode` and `enterkeyhint` attributes.
 *
 * `inputmode` (HTML5, Baseline 2022) is a *hint* to the browser about which
 * virtual keyboard to show on touch devices. Unlike `type="number"`, it does
 * NOT change the value semantics — the input remains a text field, which
 * means no spinner, no invalid-state coercion, and full control over
 * formatting. `enterkeyhint` (Baseline 2021) lets you relabel the Enter key
 * to match the action the user is performing (Go, Search, Next, Send, …).
 *
 * Features:
 *   - Pick any of the 8 `inputmode` values (text, none, decimal, numeric,
 *     tel, search, email, url) and any of the 7 `enterkeyhint` values
 *     (enter, done, go, next, previous, search, send).
 *   - Pick an `autocomplete` token from a curated list.
 *   - See the live `<input>` rendered with the chosen attributes — on a
 *     phone, the real virtual keyboard appears.
 *   - See a *stylised* keyboard mock that previews which layout each
 *     `inputmode` triggers (desktop-friendly substitute for the real
 *     on-screen keyboard).
 *   - Copy the generated HTML fragment.
 *   - Read a reference table mapping each `inputmode` to its keyboard and
 *     best use case.
 *
 * TS strict, no `any`, no `console.log`. Self-contained (no props, no
 * external state, no network). Responsive within `max-w-2xl`.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
  Smartphone,
  Copy,
  Check,
  Sparkles,
  Info,
  Send,
  Search,
  CornerDownLeft,
  ArrowRight,
  ArrowLeft,
  Check as CheckIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const INPUT_MODES = [
  "text",
  "none",
  "decimal",
  "numeric",
  "tel",
  "search",
  "email",
  "url",
] as const;
type InputMode = (typeof INPUT_MODES)[number];

const ENTER_KEY_HINTS = [
  "enter",
  "done",
  "go",
  "next",
  "previous",
  "search",
  "send",
] as const;
type EnterKeyHint = (typeof ENTER_KEY_HINTS)[number];

const AUTOCOMPLETE_OPTIONS = [
  { value: "", label: "(none)" },
  { value: "on", label: "on" },
  { value: "off", label: "off" },
  { value: "name", label: "name" },
  { value: "given-name", label: "given-name" },
  { value: "family-name", label: "family-name" },
  { value: "email", label: "email" },
  { value: "username", label: "username" },
  { value: "current-password", label: "current-password" },
  { value: "new-password", label: "new-password" },
  { value: "tel", label: "tel" },
  { value: "tel-national", label: "tel-national" },
  { value: "street-address", label: "street-address" },
  { value: "address-line1", label: "address-line1" },
  { value: "address-line2", label: "address-line2" },
  { value: "postal-code", label: "postal-code" },
  { value: "country", label: "country" },
  { value: "organization", label: "organization" },
  { value: "cc-number", label: "cc-number" },
  { value: "cc-exp", label: "cc-exp" },
  { value: "cc-csc", label: "cc-csc" },
] as const;

interface InputModeMeta {
  value: InputMode;
  keyboard: string;
  useCase: string;
  rows: string[][];
  /** Extra "quick" keys row above the alpha/numeric rows (e.g. @, ., .com). */
  quickRow?: string[];
  /** Width of each key in CSS grid units (default 1). Numbers like "0" span 2. */
  wideKeys?: string[];
}

// ============================================================
// Keyboard layout definitions
// ============================================================

const KEYBOARD_LAYOUTS: Record<InputMode, InputModeMeta> = {
  text: {
    value: "text",
    keyboard: "Standard alphabetical (QWERTY)",
    useCase: "General text input — names, notes, prose.",
    rows: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["shift", "z", "x", "c", "v", "b", "n", "m", "backspace"],
      ["123", "emoji", "space", "enter"],
    ],
    wideKeys: ["space", "enter", "123", "emoji"],
  },
  none: {
    value: "none",
    keyboard: "No virtual keyboard",
    useCase:
      "Custom on-screen keyboards, games, signature pads — you handle input yourself.",
    rows: [],
  },
  decimal: {
    value: "decimal",
    keyboard: "Numeric keypad with decimal separator",
    useCase: "Quantities, prices, measurements — any signed decimal number.",
    rows: [
      ["-", "7", "8", "9"],
      [".", "4", "5", "6"],
      ["", "1", "2", "3"],
      ["", "0", "backspace"],
    ],
  },
  numeric: {
    value: "numeric",
    keyboard: "Numeric keypad (0-9 only)",
    useCase: "PINs, OTP codes, verification codes, simple integer inputs.",
    rows: [
      ["7", "8", "9"],
      ["4", "5", "6"],
      ["1", "2", "3"],
      ["0", "backspace"],
    ],
    wideKeys: ["0"],
  },
  tel: {
    value: "tel",
    keyboard: "Telephone keypad (0-9, *, #)",
    useCase: "Phone numbers — matches the system dialer layout.",
    rows: [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["*", "0", "#"],
    ],
  },
  search: {
    value: "search",
    keyboard: "QWERTY with a prominent Search key",
    useCase: "Search fields — usually paired with enterkeyhint=\"search\".",
    rows: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["shift", "z", "x", "c", "v", "b", "n", "m", "backspace"],
      ["123", "space", "search"],
    ],
    wideKeys: ["space", "search"],
  },
  email: {
    value: "email",
    keyboard: "QWERTY with @ and . quick keys",
    useCase: "Email addresses — @ and . are one tap away.",
    rows: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["shift", "z", "x", "c", "v", "b", "n", "m", "backspace"],
      ["@", ".", "space", "enter"],
    ],
    quickRow: ["@", "."],
    wideKeys: ["space", "enter"],
  },
  url: {
    value: "url",
    keyboard: "QWERTY with /, ., and .com quick keys",
    useCase: "URLs and domains — quick access to /, ., and .com.",
    rows: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["shift", "z", "x", "c", "v", "b", "n", "m", "backspace"],
      ["/", ".com", ".", "space", "go"],
    ],
    quickRow: ["/", ".com", "."],
    wideKeys: ["space", "go"],
  },
};

interface EnterKeyHintMeta {
  value: EnterKeyHint;
  label: string;
  description: string;
  icon: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
}

const ENTER_KEY_HINT_META: EnterKeyHintMeta[] = [
  {
    value: "enter",
    label: "Enter",
    description: "Default — generic carriage return.",
    icon: "enter",
  },
  {
    value: "done",
    label: "Done",
    description: "No more input expected — close the form.",
    icon: "done",
  },
  {
    value: "go",
    label: "Go",
    description: "Navigate to the target of the entered text (e.g. a URL).",
    icon: "go",
  },
  {
    value: "next",
    label: "Next",
    description: "Move to the next field in the form.",
    icon: "next",
  },
  {
    value: "previous",
    label: "Previous",
    description: "Move to the previous field in the form.",
    icon: "previous",
  },
  {
    value: "search",
    label: "Search",
    description: "Submit the entered text as a search query.",
    icon: "search",
  },
  {
    value: "send",
    label: "Send",
    description: "Send the entered text (e.g. a chat message).",
    icon: "send",
  },
];

// ============================================================
// Keyboard mock renderer
// ============================================================

function EnterKeyLabel({ hint }: { hint: EnterKeyHint }) {
  const meta = ENTER_KEY_HINT_META.find((m) => m.value === hint);
  if (!meta) return <span>{hint}</span>;
  const Icon =
    meta.icon === "enter"
      ? CornerDownLeft
      : meta.icon === "done"
        ? CheckIcon
        : meta.icon === "go"
          ? ArrowRight
          : meta.icon === "next"
            ? ArrowRight
            : meta.icon === "previous"
              ? ArrowLeft
              : meta.icon === "search"
                ? Search
                : Send;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3" />
      {meta.label}
    </span>
  );
}

function KeyboardMock({
  inputMode,
  enterKeyHint,
}: {
  inputMode: InputMode;
  enterKeyHint: EnterKeyHint;
}) {
  const layout = KEYBOARD_LAYOUTS[inputMode];

  if (inputMode === "none" || layout.rows.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 bg-background/60 text-center">
        <Keyboard className="size-6 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          No virtual keyboard shown.
        </p>
        <p className="max-w-[220px] text-[10px] text-muted-foreground/70">
          The page is expected to provide its own input method.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-md border border-border/60 bg-muted/40 p-2">
      {layout.quickRow && layout.quickRow.length > 0 && (
        <div className="flex gap-1">
          {layout.quickRow.map((k, i) => (
            <div
              key={`q-${i}`}
              className="grid h-7 flex-1 place-items-center rounded bg-background font-mono text-[11px] text-foreground/80"
            >
              {k}
            </div>
          ))}
        </div>
      )}
      {layout.rows.map((row, rowIdx) => (
        <div key={`r-${rowIdx}`} className="flex gap-1">
          {row.map((k, keyIdx) => {
            const isWide = layout.wideKeys?.includes(k);
            const isAction =
              k === "backspace" ||
              k === "shift" ||
              k === "enter" ||
              k === "search" ||
              k === "go" ||
              k === "done" ||
              k === "send" ||
              k === "next" ||
              k === "previous" ||
              k === "123" ||
              k === "emoji";
            const isEmpty = k === "";
            if (isEmpty) {
              return (
                <div
                  key={`k-${keyIdx}`}
                  className="h-7 flex-1 opacity-0"
                  aria-hidden
                />
              );
            }
            return (
              <div
                key={`k-${keyIdx}`}
                className={cn(
                  "grid h-7 place-items-center rounded font-mono text-[11px]",
                  isWide ? "flex-[3]" : "flex-1",
                  isAction
                    ? "bg-primary/15 text-primary font-semibold"
                    : "bg-background text-foreground/80",
                )}
              >
                {k === "enter" ? (
                  <EnterKeyLabel hint={enterKeyHint} />
                ) : k === "search" ? (
                  <EnterKeyLabel hint="search" />
                ) : k === "go" ? (
                  <EnterKeyLabel hint="go" />
                ) : k === "done" ? (
                  <EnterKeyLabel hint="done" />
                ) : k === "send" ? (
                  <EnterKeyLabel hint="send" />
                ) : k === "next" ? (
                  <EnterKeyLabel hint="next" />
                ) : k === "previous" ? (
                  <EnterKeyLabel hint="previous" />
                ) : (
                  k
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function InputModeExplorer() {
  const [inputMode, setInputMode] = useState<InputMode>("numeric");
  const [enterKeyHint, setEnterKeyHint] = useState<EnterKeyHint>("done");
  const [autocomplete, setAutocomplete] = useState<string>("");
  const [liveValue, setLiveValue] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // ── Generated HTML ─────────────────────────────────────────────────

  const generatedHtml = useMemo(() => {
    const attrs: string[] = [
      'type="text"',
      `inputmode="${inputMode}"`,
      `enterkeyhint="${enterKeyHint}"`,
    ];
    if (autocomplete) attrs.push(`autocomplete="${autocomplete}"`);
    if (liveValue) attrs.push(`value="${liveValue}"`);
    return `<input ${attrs.join(" ")} />`;
  }, [inputMode, enterKeyHint, autocomplete, liveValue]);

  // ── Copy ───────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [generatedHtml]);

  const layout = KEYBOARD_LAYOUTS[inputMode];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Keyboard className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            inputmode &amp; enterkeyhint Explorer
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Preview how{" "}
            <code className="font-mono text-foreground/80">inputmode</code> and{" "}
            <code className="font-mono text-foreground/80">enterkeyhint</code>{" "}
            shape mobile keyboards — without changing the value semantics.
          </p>
        </div>
      </div>

      {/* Attribute selectors */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="im-inputmode"
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            inputmode
          </Label>
          <Select
            value={inputMode}
            onValueChange={(v) => setInputMode(v as InputMode)}
          >
            <SelectTrigger id="im-inputmode" className="w-full font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INPUT_MODES.map((m) => (
                <SelectItem key={m} value={m} className="font-mono text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="im-enterkeyhint"
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            enterkeyhint
          </Label>
          <Select
            value={enterKeyHint}
            onValueChange={(v) => setEnterKeyHint(v as EnterKeyHint)}
          >
            <SelectTrigger
              id="im-enterkeyhint"
              className="w-full font-mono text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTER_KEY_HINT_META.map((m) => (
                <SelectItem key={m.value} value={m.value} className="font-mono text-xs">
                  {m.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="im-autocomplete"
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            autocomplete
          </Label>
          <Select
            value={autocomplete}
            onValueChange={(v) => setAutocomplete(v)}
          >
            <SelectTrigger id="im-autocomplete" className="w-full font-mono text-xs">
              <SelectValue placeholder="(none)" />
            </SelectTrigger>
            <SelectContent>
              {AUTOCOMPLETE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value || "none"}
                  value={opt.value}
                  className="font-mono text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live input + keyboard mock */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Phone frame with live input */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live input
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5">
              <Smartphone className="size-3.5 text-muted-foreground" />
              <Input
                type="text"
                inputMode={inputMode}
                enterKeyHint={enterKeyHint}
                autoComplete={autocomplete}
                value={liveValue}
                onChange={(e) => setLiveValue(e.target.value)}
                placeholder="Type here…"
                className="h-7 flex-1 border-0 bg-transparent px-0 font-mono text-sm shadow-none focus-visible:ring-0"
                aria-label="Live input field"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              On touch devices, the browser shows the matching virtual
              keyboard. On desktop, only the attributes change.
            </p>
          </div>
        </div>

        {/* Keyboard mock */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Keyboard preview
          </div>
          <KeyboardMock
            inputMode={inputMode}
            enterKeyHint={enterKeyHint}
          />
        </div>
      </div>

      {/* Mode description */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            inputmode=&quot;{inputMode}&quot;
          </Badge>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-xs text-foreground">{layout.keyboard}</span>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {layout.useCase}
        </p>
      </div>

      {/* Generated HTML */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated HTML
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2.5 text-xs"
            onClick={handleCopy}
            aria-label="Copy generated HTML"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground scrollbar-thin">
          <code>{generatedHtml}</code>
        </pre>
      </div>

      {/* Reference table */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5" />
          Reference — inputmode values
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Value</th>
                <th className="px-2.5 py-1.5 font-semibold">Keyboard</th>
                <th className="px-2.5 py-1.5 font-semibold">Best for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {INPUT_MODES.map((m) => {
                const meta = KEYBOARD_LAYOUTS[m];
                const isActive = m === inputMode;
                return (
                  <tr
                    key={m}
                    className={cn(
                      isActive ? "bg-primary/5" : "bg-card/30",
                    )}
                  >
                    <td className="px-2.5 py-1.5 font-mono text-foreground">
                      {m}
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground">
                      {meta.keyboard}
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground">
                      {meta.useCase}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterkeyhint reference */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <CornerDownLeft className="size-3.5" />
          Reference — enterkeyhint values
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {ENTER_KEY_HINT_META.map((m) => (
            <div
              key={m.value}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2.5 py-1.5",
                m.value === enterKeyHint
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-card/30",
              )}
            >
              <Badge variant="outline" className="font-mono text-[10px]">
                {m.value}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {m.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Educational note */}
      <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Info className="size-3.5" />
          Tips
        </div>
        <ul className="space-y-1 text-[11px] text-muted-foreground">
          <li>
            Prefer <code className="font-mono">inputmode=&quot;numeric&quot;</code>{" "}
            over <code className="font-mono">type=&quot;number&quot;</code> for
            codes (PINs, OTPs) — no spinner, no invalid coercion, easier to
            validate.
          </li>
          <li>
            <code className="font-mono">enterkeyhint</code> is purely a label —
            it does not change behaviour. You still handle the{" "}
            <code className="font-mono">Enter</code> keypress yourself.
          </li>
          <li>
            <code className="font-mono">autocomplete</code> helps password
            managers and browser autofill — provide it on every field that has
            a meaningful token.
          </li>
        </ul>
      </div>
    </div>
  );
}
