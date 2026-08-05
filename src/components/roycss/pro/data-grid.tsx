"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  EyeOffIcon,
  FilterIcon,
  Rows3Icon,
  SearchIcon,
  Settings2Icon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ───────────────────────────────────────────────────

type EmployeeStatus = "Active" | "On Leave" | "Terminated";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  salary: number;
  startDate: string; // ISO date
}

type SortDirection = "asc" | "desc";

type ColumnKey =
  | "id"
  | "name"
  | "email"
  | "role"
  | "department"
  | "status"
  | "salary"
  | "startDate";

interface ColumnDef {
  key: ColumnKey;
  header: string;
  sortable: boolean;
  className?: string;
  align?: "left" | "right";
}

// ─── Mock data (50 rows) ─────────────────────────────────────

const FIRST_NAMES = [
  "Amani", "Brian", "Carol", "David", "Eliza", "Felix", "Grace", "Hassan",
  "Imani", "Jane", "Kevin", "Leila", "Moses", "Nadia", "Oscar", "Priya",
  "Quincy", "Rachel", "Samuel", "Tina", "Umar", "Vera", "Walter", "Xena",
  "Yusuf", "Zara",
];

const LAST_NAMES = [
  "Ochieng", "Wanjiru", "Kiprop", "Mwangi", "Achieng", "Kamau", "Njoroge",
  "Otieno", "Wekesa", "Chebet", "Mutua", "Auma", "Maina", "Karanja",
  "Onyango", "Wanyoike",
];

const ROLES = [
  "Software Engineer", "Senior Engineer", "Staff Engineer", "Engineering Manager",
  "Product Designer", "Senior Designer", "Design Lead", "Product Manager",
  "Data Analyst", "Data Scientist", "DevOps Engineer", "Site Reliability Engineer",
  "QA Engineer", "Tech Lead", "Engineering Director",
];

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Data", "Infrastructure", "Quality",
  "Platform",
];

const STATUSES: EmployeeStatus[] = ["Active", "On Leave", "Terminated"];

// Tiny deterministic LCG so the dataset is stable across renders.
function makeData(count: number): Employee[] {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;

  const rows: Employee[] = [];
  for (let i = 1; i <= count; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const role = pick(ROLES);
    const dept = pick(DEPARTMENTS);
    const status = pick(STATUSES);

    // Salary roughly correlates with seniority in the role string.
    const seniority = /Senior|Staff|Lead|Director/.test(role) ? 1 : 0;
    const base = 55000 + seniority * 35000;
    const salary = Math.round((base + rand() * 45000) / 500) * 500;

    const year = 2016 + Math.floor(rand() * 9);
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 27);
    const startDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    rows.push({
      id: i,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@roycss.io`,
      role,
      department: dept,
      status,
      salary,
      startDate,
    });
  }
  return rows;
}

const DATA: Employee[] = makeData(50);

const COLUMNS: ColumnDef[] = [
  { key: "id", header: "ID", sortable: true, className: "tabular-nums" },
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "role", header: "Role", sortable: true },
  { key: "department", header: "Department", sortable: true },
  { key: "status", header: "Status", sortable: true },
  {
    key: "salary",
    header: "Salary",
    sortable: true,
    align: "right",
    className: "tabular-nums",
  },
  {
    key: "startDate",
    header: "Start Date",
    sortable: true,
    className: "tabular-nums",
  },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

const SEARCHABLE_KEYS: ColumnKey[] = [
  "name",
  "email",
  "role",
  "department",
  "status",
];

// ─── Helpers ─────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatCell(col: ColumnKey, row: Employee): React.ReactNode {
  switch (col) {
    case "salary":
      return currencyFormatter.format(row.salary);
    case "startDate":
      return dateFormatter.format(new Date(row.startDate));
    case "status":
      return <StatusBadge status={row.status} />;
    default:
      return row[col];
  }
}

function compareValues(
  a: Employee,
  b: Employee,
  key: ColumnKey,
): number {
  const av = a[key];
  const bv = b[key];
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  // For dates, compare parsed timestamps.
  if (key === "startDate") {
    return new Date(av as string).getTime() - new Date(bv as string).getTime();
  }
  return String(av).localeCompare(String(bv));
}

// ─── Status badge ────────────────────────────────────────────

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "On Leave":
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Terminated:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", STATUS_STYLES[status])}
    >
      <span
        className={cn("size-1.5 rounded-full", {
          "bg-emerald-500": status === "Active",
          "bg-amber-500": status === "On Leave",
          "bg-rose-500": status === "Terminated",
        })}
      />
      {status}
    </Badge>
  );
}

// ─── Component ───────────────────────────────────────────────

export function ProDataGrid() {
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<ColumnKey | null>("id");
  const [sortDir, setSortDir] = React.useState<SortDirection>("asc");
  const [pageSize, setPageSize] = React.useState<PageSize>(10);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [hiddenColumns, setHiddenColumns] = React.useState<Set<ColumnKey>>(
    new Set(),
  );
  const [striped, setStriped] = React.useState(false);

  const visibleColumns = React.useMemo(
    () => COLUMNS.filter((c) => !hiddenColumns.has(c.key)),
    [hiddenColumns],
  );

  // Filtered rows (memoized on search).
  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DATA;
    return DATA.filter((row) =>
      SEARCHABLE_KEYS.some((key) =>
        String(row[key]).toLowerCase().includes(q),
      ),
    );
  }, [search]);

  // Sorted rows (memoized on filteredRows + sort state).
  const sortedRows = React.useMemo(() => {
    if (!sortKey) return filteredRows;
    const sorted = [...filteredRows].sort((a, b) =>
      compareValues(a, b, sortKey),
    );
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [filteredRows, sortKey, sortDir]);

  // Pagination derived values.
  const totalRows = sortedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const start = safePageIndex * pageSize;
  const end = Math.min(start + pageSize, totalRows);
  const pageRows = React.useMemo(
    () => sortedRows.slice(start, end),
    [sortedRows, start, end],
  );

  // Reset page when filter/pageSize shrinks below current page.
  React.useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount]);

  // Selection handlers.
  const pageRowIds = React.useMemo(
    () => pageRows.map((r) => r.id),
    [pageRows],
  );

  const allOnPageSelected =
    pageRowIds.length > 0 && pageRowIds.every((id) => selected.has(id));
  const someOnPageSelected =
    pageRowIds.some((id) => selected.has(id)) && !allOnPageSelected;

  const selectedCount = selected.size;

  const toggleRow = React.useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectPage = React.useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageRowIds.every((id) => next.has(id))) {
        for (const id of pageRowIds) next.delete(id);
      } else {
        for (const id of pageRowIds) next.add(id);
      }
      return next;
    });
  }, [pageRowIds]);

  const clearSelection = React.useCallback(() => {
    setSelected(new Set());
  }, []);

  // Sort handler.
  const handleSort = React.useCallback(
    (key: ColumnKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPageIndex(0);
    },
    [sortKey],
  );

  // Column visibility toggle.
  const toggleColumn = React.useCallback((key: ColumnKey) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Reset to first page whenever the search query changes.
  const onSearchChange = React.useCallback(
    (value: string) => {
      setSearch(value);
      setPageIndex(0);
    },
    [],
  );

  const onPageSizeChange = React.useCallback((value: PageSize) => {
    setPageSize(value);
    setPageIndex(0);
  }, []);

  return (
    <div className="bg-card text-foreground w-full rounded-xl border shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-foreground text-base font-semibold tracking-tight">
              Employee Directory
            </h3>
            <p className="text-muted-foreground text-xs">
              {totalRows.toLocaleString()} records
              {selectedCount > 0 ? ` · ${selectedCount} selected` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search records..."
                aria-label="Search records"
                className="h-9 w-full pl-8 sm:w-64"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 transition-colors"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant={striped ? "default" : "outline"}
              size="sm"
              onClick={() => setStriped((s) => !s)}
              aria-pressed={striped}
              title="Toggle striped rows"
            >
              <Rows3Icon />
              <span className="hidden sm:inline">Striped</span>
            </Button>

            <ColumnVisibilityDropdown
              columns={COLUMNS}
              hiddenColumns={hiddenColumns}
              onToggle={toggleColumn}
            />
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedCount > 0 && (
          <div className="bg-primary/5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/20 px-3 py-2">
            <div className="text-foreground flex items-center gap-2 text-sm font-medium">
              <span className="bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold">
                {selectedCount}
              </span>
              {selectedCount === 1 ? "row" : "rows"} selected
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <DownloadIcon />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button size="sm" variant="outline">
                <Trash2Icon />
                <span className="hidden sm:inline">Delete</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <XIcon />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 px-3">
                <Checkbox
                  aria-label={
                    allOnPageSelected
                      ? "Deselect all on page"
                      : "Select all on page"
                  }
                  checked={
                    allOnPageSelected
                      ? true
                      : someOnPageSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={toggleSelectPage}
                />
              </TableHead>
              {visibleColumns.map((col) => {
                const isActive = sortKey === col.key;
                return (
                  <TableHead
                    key={col.key}
                    aria-sort={
                      isActive
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={cn(
                      "select-none",
                      col.align === "right" && "text-right",
                      col.sortable && "cursor-pointer",
                      col.className,
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        col.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {col.header}
                      {col.sortable && (
                        <span className="text-muted-foreground inline-flex">
                          {isActive ? (
                            sortDir === "asc" ? (
                              <ArrowUpIcon className="size-3.5" />
                            ) : (
                              <ArrowDownIcon className="size-3.5" />
                            )
                          ) : (
                            <ChevronsUpDownIcon className="size-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="text-muted-foreground py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FilterIcon className="size-6 opacity-40" />
                    <span>No records match your filters.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, idx) => {
                const isSelected = selected.has(row.id);
                const isStriped = striped && idx % 2 === 1;
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      isStriped && "bg-muted/20",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    <TableCell className="w-10 px-3">
                      <Checkbox
                        aria-label={`Select row ${row.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(row.id)}
                      />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          col.align === "right" && "text-right",
                          col.className,
                        )}
                      >
                        {formatCell(col.key, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination */}
      <div className="text-muted-foreground flex flex-col gap-3 border-t p-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-3">
          <span>
            {totalRows === 0
              ? "0"
              : `${start + 1}–${end} of ${totalRows.toLocaleString()}`}
          </span>
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="pro-data-grid-page-size"
              className="hidden sm:inline"
            >
              Rows per page
            </label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) =>
                onPageSizeChange(Number(v) as PageSize)
              }
            >
              <SelectTrigger
                id="pro-data-grid-page-size"
                size="sm"
                className="h-8 w-[5rem]"
                aria-label="Rows per page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            Page {safePageIndex + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPageIndex(0)}
              disabled={safePageIndex === 0}
              aria-label="First page"
            >
              <span className="sr-only">First page</span>
              <ChevronsLeftIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={safePageIndex === 0}
              aria-label="Previous page"
            >
              <span className="sr-only">Previous page</span>
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() =>
                setPageIndex((p) => Math.min(pageCount - 1, p + 1))
              }
              disabled={safePageIndex >= pageCount - 1}
              aria-label="Next page"
            >
              <span className="sr-only">Next page</span>
              <ChevronRightIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={safePageIndex >= pageCount - 1}
              aria-label="Last page"
            >
              <span className="sr-only">Last page</span>
              <ChevronsRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Column visibility dropdown ──────────────────────────────

interface ColumnVisibilityDropdownProps {
  columns: ColumnDef[];
  hiddenColumns: Set<ColumnKey>;
  onToggle: (key: ColumnKey) => void;
}

function ColumnVisibilityDropdown({
  columns,
  hiddenColumns,
  onToggle,
}: ColumnVisibilityDropdownProps) {
  const visibleCount = columns.length - hiddenColumns.size;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Toggle column visibility">
          <Settings2Icon />
          <span className="hidden sm:inline">Columns</span>
          <span className="text-muted-foreground">({visibleCount}/{columns.length})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-2">
          <EyeOffIcon className="size-3.5" />
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={!hiddenColumns.has(col.key)}
            onCheckedChange={() => onToggle(col.key)}
            onSelect={(e) => e.preventDefault()}
          >
            {col.header}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProDataGrid;
