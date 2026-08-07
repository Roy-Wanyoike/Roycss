"use client";

/**
 * RoyStorage — cloud storage browser for RoyCSS assets.
 *
 * Self-contained (no props). Layout:
 *   • Header with breadcrumb path + storage usage bar.
 *   • Search input + Upload button (mock).
 *   • File browser table — 8 mock files/folders with name, type icon,
 *     size, last modified.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. FileKind is a string-literal union; the
 *     `never` guard enforces exhaustiveness on the icon mapper.
 *   • Palette: emerald primary, sky/teal/amber accents. No indigo/blue.
 */

import { useMemo, useState } from "react";
import {
  ChevronRight,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FileJson,
  FileText,
  Folder,
  HardDrive,
  Home,
  Search,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type FileKind =
  | "folder"
  | "css"
  | "json"
  | "image"
  | "archive"
  | "text"
  | "code"
  | "file";

interface StorageItem {
  id: string;
  name: string;
  kind: FileKind;
  size: string;
  modified: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const ITEMS: readonly StorageItem[] = [
  { id: "f1", name: "tokens", kind: "folder", size: "—", modified: "2h ago" },
  { id: "f2", name: "themes", kind: "folder", size: "—", modified: "1d ago" },
  { id: "f3", name: "roycss.min.css", kind: "css", size: "82 KB", modified: "3h ago" },
  { id: "f4", name: "theme.emerald.json", kind: "json", size: "4.1 KB", modified: "5h ago" },
  { id: "f5", name: "bundle.zip", kind: "archive", size: "1.2 MB", modified: "1d ago" },
  { id: "f6", name: "preview.png", kind: "image", size: "640 KB", modified: "2d ago" },
  { id: "f7", name: "README.md", kind: "text", size: "12 KB", modified: "3d ago" },
  { id: "f8", name: "compiler.ts", kind: "code", size: "28 KB", modified: "5d ago" },
];

const KIND_META: Record<
  FileKind,
  { icon: LucideIcon; tone: string; label: string }
> = {
  folder: { icon: Folder, tone: "bg-primary/15 text-primary", label: "Folder" },
  css: { icon: FileCode2, tone: "bg-teal-500/15 text-teal-600 dark:text-teal-400", label: "CSS" },
  json: { icon: FileJson, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "JSON" },
  image: { icon: FileImage, tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400", label: "Image" },
  archive: { icon: FileArchive, tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400", label: "Archive" },
  text: { icon: FileText, tone: "bg-muted text-muted-foreground", label: "Text" },
  code: { icon: FileCode2, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", label: "Code" },
  file: { icon: File, tone: "bg-muted text-muted-foreground", label: "File" },
};

const PATH = ["acme-design", "roycss", "assets"] as const;

// ─── Component ───────────────────────────────────────────────────────────

export function RoyStorage() {
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter((i) => i.name.toLowerCase().includes(q));
  }, [query]);

  const upload = () =>
    toast({
      title: "Upload started",
      description: "Drop files anywhere to upload (mock).",
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Header + usage */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <HardDrive className="size-5" />
              </div>
              <div>
                <CardTitle>Cloud Storage</CardTitle>
                <CardDescription>2.3 GB used of 10 GB.</CardDescription>
              </div>
            </div>
            <Button onClick={upload} className="gap-1.5">
              <Upload className="size-4" /> Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium tabular-nums">2.3 GB / 10 GB</span>
            <span className="text-muted-foreground tabular-nums">23%</span>
          </div>
          <Progress value={23} className="h-2" />
        </CardContent>
      </Card>

      {/* Browser */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">File Browser</CardTitle>
              <CardDescription>Browse, search, and manage assets.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search files…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
            <Home className="size-3.5" />
            <ChevronRight className="size-3" />
            {PATH.map((seg, i) => (
              <span key={seg} className="flex items-center gap-1">
                <span
                  className={cn(
                    i === PATH.length - 1
                      ? "text-foreground font-medium"
                      : "hover:text-foreground cursor-pointer",
                  )}
                >
                  {seg}
                </span>
                {i < PATH.length - 1 && <ChevronRight className="size-3" />}
              </span>
            ))}
          </nav>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const meta = KIND_META[item.kind];
                const Icon = meta.icon;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <div className={cn("flex size-7 items-center justify-center rounded-md", meta.tone)}>
                          <Icon className="size-3.5" />
                        </div>
                        <span
                          className={cn(
                            "text-sm",
                            item.kind === "folder"
                              ? "font-medium"
                              : "font-normal",
                          )}
                        >
                          {item.name}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                      {item.size}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-xs">
                      {item.modified}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-6 text-center text-sm">
                    No files match &ldquo;{query}&rdquo;
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
