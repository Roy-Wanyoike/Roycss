"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Flag,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high" | "critical";
type ColumnId = "backlog" | "todo" | "in-progress" | "done";

interface KanbanCard {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  dueDate: string; // ISO yyyy-mm-dd
  columnId: ColumnId;
}

interface ColumnMeta {
  id: ColumnId;
  title: string;
  dot: string; // tailwind classes for the status dot
}

// ─── Constants ───────────────────────────────────────────────────────

const COLUMNS: readonly ColumnMeta[] = [
  {
    id: "backlog",
    title: "Backlog",
    dot: "bg-foreground/40",
  },
  {
    id: "todo",
    title: "To Do",
    dot: "bg-primary",
  },
  {
    id: "in-progress",
    title: "In Progress",
    dot: "bg-amber-500",
  },
  {
    id: "done",
    title: "Done",
    dot: "bg-emerald-600",
  },
] as const;

const PRIORITY_META: Record<
  Priority,
  { label: string; badge: string; dot: string }
> = {
  low: {
    label: "Low",
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Medium",
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  high: {
    label: "High",
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  critical: {
    label: "Critical",
    badge:
      "border-rose-600 bg-rose-600 text-white dark:border-rose-700 dark:bg-rose-700",
    dot: "bg-rose-600",
  },
};

const PRIORITY_OPTIONS: readonly Priority[] = ["low", "medium", "high", "critical"] as const;

const COLUMN_OPTIONS: readonly { value: ColumnId; label: string }[] = COLUMNS.map((c) => ({
  value: c.id,
  label: c.title,
}));

const INITIAL_CARDS: KanbanCard[] = [
  // Backlog (4)
  {
    id: "card-1",
    title: "Research OKLCH color space",
    description:
      "Investigate the perceptual benefits of OKLCH and prototype a token pipeline that emits it.",
    priority: "low",
    assignee: "Amara Okafor",
    dueDate: "2025-02-12",
    columnId: "backlog",
  },
  {
    id: "card-2",
    title: "Audit current CSS variable usage",
    description:
      "Catalog every CSS custom property across the codebase and flag duplicates and dead tokens.",
    priority: "medium",
    assignee: "Lin Wei",
    dueDate: "2025-02-18",
    columnId: "backlog",
  },
  {
    id: "card-3",
    title: "Draft container query migration plan",
    description:
      "Outline phases for converting layout-critical media queries to container queries.",
    priority: "low",
    assignee: "Sofia Reyes",
    dueDate: "2025-02-24",
    columnId: "backlog",
  },
  {
    id: "card-4",
    title: "Collect design tokens from Figma",
    description:
      "Pull the latest token export from the design library and reconcile naming with code.",
    priority: "medium",
    assignee: "Jonas Berg",
    dueDate: "2025-02-20",
    columnId: "backlog",
  },

  // To Do (3)
  {
    id: "card-5",
    title: "Build token transform pipeline",
    description:
      "Stand up a Style Dictionary pipeline that outputs CSS, JSON, and TypeScript files.",
    priority: "high",
    assignee: "Priya Nair",
    dueDate: "2025-02-08",
    columnId: "todo",
  },
  {
    id: "card-6",
    title: "Migrate Button component to tokens",
    description:
      "Replace every hardcoded color in the Button primitive with semantic tokens.",
    priority: "medium",
    assignee: "Marcus Hale",
    dueDate: "2025-02-10",
    columnId: "todo",
  },
  {
    id: "card-7",
    title: "Write docs for new color system",
    description:
      "Document the OKLCH-based color system with usage examples for internal teams.",
    priority: "low",
    assignee: "Amara Okafor",
    dueDate: "2025-02-28",
    columnId: "todo",
  },

  // In Progress (3)
  {
    id: "card-8",
    title: "Ship dark mode pass for marketing site",
    description:
      "Complete the dark mode conversion for every page on the marketing site, including OG images.",
    priority: "critical",
    assignee: "Lin Wei",
    dueDate: "2025-02-05",
    columnId: "in-progress",
  },
  {
    id: "card-9",
    title: "Refactor Card primitives",
    description:
      "Split the monolithic Card component into composable sub-components with slot support.",
    priority: "high",
    assignee: "Sofia Reyes",
    dueDate: "2025-02-09",
    columnId: "in-progress",
  },
  {
    id: "card-10",
    title: "Add reduced-motion utilities",
    description:
      "Add a reduced-motion utility layer that respects user preferences at the component level.",
    priority: "medium",
    assignee: "Jonas Berg",
    dueDate: "2025-02-14",
    columnId: "in-progress",
  },

  // Done (4)
  {
    id: "card-11",
    title: "Define primary palette",
    description:
      "Locked the primary, secondary, accent, and destructive colors in OKLCH with light + dark variants.",
    priority: "high",
    assignee: "Priya Nair",
    dueDate: "2025-01-20",
    columnId: "done",
  },
  {
    id: "card-12",
    title: "Set up typography scale",
    description: "Established a fluid typography scale using clamp() across six steps.",
    priority: "medium",
    assignee: "Marcus Hale",
    dueDate: "2025-01-22",
    columnId: "done",
  },
  {
    id: "card-13",
    title: "Build base theme provider",
    description:
      "Created a theme provider that toggles light/dark via a class strategy and persists to localStorage.",
    priority: "low",
    assignee: "Amara Okafor",
    dueDate: "2025-01-18",
    columnId: "done",
  },
  {
    id: "card-14",
    title: "Inventory existing components",
    description:
      "Cataloged every current UI component with its props, variants, and accessibility status.",
    priority: "low",
    assignee: "Sofia Reyes",
    dueDate: "2025-01-15",
    columnId: "done",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function formatDue(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isOverdue(iso: string, columnId: ColumnId): boolean {
  if (columnId === "done" || !iso) return false;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

let cardIdCounter = 0;
function makeCardId(): string {
  cardIdCounter += 1;
  return `card-${Date.now().toString(36)}-${cardIdCounter}`;
}

function defaultDueDate(): string {
  const d = new Date(Date.now() + 7 * 86_400_000);
  return d.toISOString().slice(0, 10);
}

// Native <select> styled to match the shadcn Input look.
// Using a native select here (instead of Radix Select) avoids portal
// conflicts when nested inside the Radix Popover content.
const selectClass =
  "border-input dark:bg-input/30 flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

// ─── Sub-components ──────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <Badge variant="outline" className={cn("gap-1 px-1.5 text-[10px] font-medium", meta.badge)}>
      <Flag className="size-2.5" />
      {meta.label}
    </Badge>
  );
}

interface KanbanCardViewProps {
  card: KanbanCard;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, card: KanbanCard) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onEdit: (id: string, patch: Partial<KanbanCard>) => void;
  onDelete: (id: string) => void;
}

function KanbanCardView({
  card,
  isDragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: KanbanCardViewProps) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Partial<KanbanCard>>({});

  const overdue = isOverdue(card.dueDate, card.columnId);

  const startEdit = useCallback(() => {
    setDraft({
      title: card.title,
      description: card.description,
      priority: card.priority,
      assignee: card.assignee,
      dueDate: card.dueDate,
      columnId: card.columnId,
    });
    setEditMode(true);
  }, [card]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setDraft({});
  }, []);

  const saveEdit = useCallback(() => {
    const trimmedTitle = (draft.title ?? "").trim();
    if (!trimmedTitle) return;
    onEdit(card.id, {
      title: trimmedTitle,
      description: (draft.description ?? "").trim(),
      priority: draft.priority ?? card.priority,
      assignee: (draft.assignee ?? "").trim() || "Unassigned",
      dueDate: draft.dueDate ?? card.dueDate,
      columnId: draft.columnId ?? card.columnId,
    });
    setEditMode(false);
    setDraft({});
  }, [card, draft, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(card.id);
    setOpen(false);
  }, [card.id, onDelete]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        setEditMode(false);
        setDraft({});
      }
    },
    [],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Open details for ${card.title}`}
          draggable
          onDragStart={(e) => onDragStart(e, card)}
          onDragEnd={onDragEnd}
          className={cn(
            "group relative w-full cursor-grab rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-all",
            "hover:border-primary/40 hover:shadow-md active:cursor-grabbing",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isDragging && "rotate-1 opacity-40",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-sm font-medium leading-snug">
              {card.title}
            </h4>
            <GripVertical
              className="size-4 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          </div>
          {card.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {card.description}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-2">
            <PriorityBadge priority={card.priority} />
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  overdue
                    ? "font-medium text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground",
                )}
              >
                <Calendar className="size-3" aria-hidden />
                {formatDue(card.dueDate)}
              </span>
              <Avatar className="size-6" aria-hidden>
                <AvatarFallback className="bg-primary/15 text-[10px] font-medium text-primary">
                  {initialsOf(card.assignee)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
      >
        {editMode ? (
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Edit card</span>
              <Button
                size="icon"
                variant="ghost"
                className="size-6"
                onClick={cancelEdit}
                aria-label="Cancel edit"
              >
                <X className="size-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor={`edit-title-${card.id}`}>
                Title
              </label>
              <Input
                id={`edit-title-${card.id}`}
                value={draft.title ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor={`edit-desc-${card.id}`}>
                Description
              </label>
              <Textarea
                id={`edit-desc-${card.id}`}
                value={draft.description ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                className="min-h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground" htmlFor={`edit-priority-${card.id}`}>
                  Priority
                </label>
                <select
                  id={`edit-priority-${card.id}`}
                  className={selectClass}
                  value={draft.priority ?? "medium"}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as Priority }))}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground" htmlFor={`edit-column-${card.id}`}>
                  Column
                </label>
                <select
                  id={`edit-column-${card.id}`}
                  className={selectClass}
                  value={draft.columnId ?? "backlog"}
                  onChange={(e) => setDraft((d) => ({ ...d, columnId: e.target.value as ColumnId }))}
                >
                  {COLUMN_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground" htmlFor={`edit-due-${card.id}`}>
                  Due date
                </label>
                <Input
                  id={`edit-due-${card.id}`}
                  type="date"
                  value={draft.dueDate ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground" htmlFor={`edit-assignee-${card.id}`}>
                  Assignee
                </label>
                <Input
                  id={`edit-assignee-${card.id}`}
                  value={draft.assignee ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, assignee: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={!draft.title?.trim()}>
                <Check className="mr-1 size-3.5" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <PriorityBadge priority={card.priority} />
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={startEdit}
                  aria-label="Edit card"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                  onClick={handleDelete}
                  aria-label="Delete card"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <h3 className="mt-2 text-base font-semibold leading-tight">{card.title}</h3>
            {card.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">No description.</p>
            )}

            <Separator className="my-3" />

            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="size-3.5" aria-hidden /> Assignee
                </dt>
                <dd className="flex items-center gap-2 font-medium">
                  <Avatar className="size-5">
                    <AvatarFallback className="bg-primary/15 text-[9px] font-medium text-primary">
                      {initialsOf(card.assignee)}
                    </AvatarFallback>
                  </Avatar>
                  {card.assignee}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5" aria-hidden /> Due date
                </dt>
                <dd
                  className={cn(
                    "font-medium",
                    overdue && "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {formatDue(card.dueDate)}
                  {overdue ? " · overdue" : ""}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Flag className="size-3.5" aria-hidden /> Priority
                </dt>
                <dd className="flex items-center gap-1.5 font-medium">
                  <span
                    className={cn("size-2 rounded-full", PRIORITY_META[card.priority].dot)}
                    aria-hidden
                  />
                  {PRIORITY_META[card.priority].label}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface AddCardFormProps {
  onAdd: (title: string, priority: Priority) => void;
  onCancel: () => void;
}

function AddCardForm({ onAdd, onCancel }: AddCardFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, priority);
  }, [title, priority, onAdd]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-2.5">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Card title…"
        className="h-8 text-sm"
        aria-label="New card title"
      />
      <select
        className={cn(selectClass, "h-8 text-sm")}
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        aria-label="New card priority"
      >
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_META[p].label}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-1.5">
        <Button size="sm" variant="ghost" className="h-7" onClick={onCancel}>
          <X className="mr-1 size-3.5" />
          Cancel
        </Button>
        <Button size="sm" className="h-7" onClick={submit} disabled={!title.trim()}>
          <Plus className="mr-1 size-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}

interface ColumnProps {
  column: ColumnMeta;
  cards: KanbanCard[];
  draggingId: string | null;
  isDropTarget: boolean;
  onCardDragStart: (e: React.DragEvent<HTMLDivElement>, card: KanbanCard) => void;
  onCardDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onColumnDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onColumnDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onEditCard: (id: string, patch: Partial<KanbanCard>) => void;
  onDeleteCard: (id: string) => void;
  onAddCard: (columnId: ColumnId, title: string, priority: Priority) => void;
}

function Column({
  column,
  cards,
  draggingId,
  isDropTarget,
  onCardDragStart,
  onCardDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
  onEditCard,
  onDeleteCard,
  onAddCard,
}: ColumnProps) {
  const [adding, setAdding] = useState(false);

  const handleAdd = useCallback(
    (title: string, priority: Priority) => {
      onAddCard(column.id, title, priority);
      setAdding(false);
    },
    [column.id, onAddCard],
  );

  const handleCancelAdd = useCallback(() => setAdding(false), []);

  return (
    <section
      data-column-id={column.id}
      onDragOver={onColumnDragOver}
      onDragLeave={onColumnDragLeave}
      onDrop={onColumnDrop}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-muted/40",
        "max-[399px]:w-full",
      )}
      aria-label={`${column.title} column`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", column.dot)} aria-hidden />
          <h2 className="truncate text-sm font-semibold">{column.title}</h2>
          <Badge
            variant="secondary"
            className="h-4 min-w-4 justify-center rounded-full px-1.5 text-[10px]"
          >
            {cards.length}
          </Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          onClick={() => setAdding((a) => !a)}
          aria-label={`Add card to ${column.title}`}
        >
          <Plus className="size-3.5" />
        </Button>
      </header>

      <div
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors",
          isDropTarget && "bg-primary/5 ring-1 ring-inset ring-primary/30",
        )}
      >
        {cards.map((card) => (
          <KanbanCardView
            key={card.id}
            card={card}
            isDragging={draggingId === card.id}
            onDragStart={onCardDragStart}
            onDragEnd={onCardDragEnd}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
          />
        ))}

        {cards.length === 0 && !adding ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            Drop cards here
          </div>
        ) : null}

        {adding ? (
          <AddCardForm onAdd={handleAdd} onCancel={handleCancelAdd} />
        ) : null}
      </div>
    </section>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function ProKanbanBoard() {
  const [cards, setCards] = useState<KanbanCard[]>(INITIAL_CARDS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<ColumnId | null>(null);

  // ── Drag source handlers ──────────────────────────────────────────
  const handleCardDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, card: KanbanCard) => {
      setDraggingId(card.id);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        try {
          e.dataTransfer.setData("application/x-kanban-card", card.id);
          e.dataTransfer.setData("text/plain", card.title);
        } catch {
          // Best-effort: some browsers reject custom MIME types.
        }
      }
    },
    [],
  );

  const handleCardDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTargetColumn(null);
  }, []);

  // ── Drop target handlers (column) ─────────────────────────────────
  const handleColumnDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!draggingId) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
      const columnEl = e.currentTarget;
      const columnId = columnEl.dataset.columnId as ColumnId | undefined;
      if (columnId && dropTargetColumn !== columnId) {
        setDropTargetColumn(columnId);
      }
    },
    [draggingId, dropTargetColumn],
  );

  const handleColumnDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // Only clear the highlight when the pointer truly leaves the column
      // (i.e. the related target is not contained by this column).
      const related = e.relatedTarget as Node | null;
      if (!e.currentTarget.contains(related)) {
        const columnId = e.currentTarget.dataset.columnId as ColumnId | undefined;
        setDropTargetColumn((prev) => (prev === columnId ? null : prev));
      }
    },
    [],
  );

  const handleColumnDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const columnId = e.currentTarget.dataset.columnId as ColumnId | undefined;
      if (!draggingId || !columnId) return;
      setCards((prev) =>
        prev.map((c) => (c.id === draggingId ? { ...c, columnId } : c)),
      );
      setDraggingId(null);
      setDropTargetColumn(null);
    },
    [draggingId],
  );

  // ── Card CRUD ─────────────────────────────────────────────────────
  const handleEditCard = useCallback((id: string, patch: Partial<KanbanCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const handleDeleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleAddCard = useCallback(
    (columnId: ColumnId, title: string, priority: Priority) => {
      const newCard: KanbanCard = {
        id: makeCardId(),
        title,
        description: "",
        priority,
        assignee: "Unassigned",
        dueDate: defaultDueDate(),
        columnId,
      };
      setCards((prev) => [...prev, newCard]);
    },
    [],
  );

  // ── Derived data ──────────────────────────────────────────────────
  const cardsByColumn = useMemo(() => {
    const groups: Record<ColumnId, KanbanCard[]> = {
      backlog: [],
      todo: [],
      "in-progress": [],
      done: [],
    };
    for (const card of cards) {
      groups[card.columnId].push(card);
    }
    return groups;
  }, [cards]);

  const totalCards = cards.length;
  const doneCount = cardsByColumn.done.length;
  const progressPct =
    totalCards === 0 ? 0 : Math.round((doneCount / totalCards) * 100);

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Project board</h2>
          <p className="text-sm text-muted-foreground">
            {totalCards} {totalCards === 1 ? "task" : "tasks"}
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            {doneCount} done
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            {progressPct}% complete
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Click a card for details · drag between columns
        </p>
      </header>

      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-2",
          "max-[399px]:flex-col max-[399px]:overflow-x-visible",
        )}
      >
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={cardsByColumn[column.id]}
            draggingId={draggingId}
            isDropTarget={dropTargetColumn === column.id}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
            onColumnDragOver={handleColumnDragOver}
            onColumnDragLeave={handleColumnDragLeave}
            onColumnDrop={handleColumnDrop}
            onEditCard={handleEditCard}
            onDeleteCard={handleDeleteCard}
            onAddCard={handleAddCard}
          />
        ))}
      </div>
    </div>
  );
}
