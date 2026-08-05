"use client";

import * as React from "react";
import {
  // ─── Navigation ───────────────────────────────────────────────
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ArrowDownRightIcon,
  ArrowLeftIcon,
  ArrowLeftRightIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  ChevronsDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  ChevronsUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CornerDownLeftIcon,
  CornerDownRightIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  ExpandIcon,
  ExternalLinkIcon,
  HomeIcon,
  MaximizeIcon,
  MinimizeIcon,
  MenuIcon,
  MoveIcon,
  MoveHorizontalIcon,
  MoveVerticalIcon,
  NavigationIcon,
  ShrinkIcon,
  XIcon,
  // ─── Action ──────────────────────────────────────────────────
  ArrowDownUpIcon,
  CheckIcon,
  ClipboardIcon,
  CopyIcon,
  DownloadIcon,
  EditIcon,
  FilterIcon,
  MinusIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  RedoIcon,
  RefreshCcwIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  RotateCwIcon,
  SaveIcon,
  SearchIcon,
  SettingsIcon,
  Settings2Icon,
  Share2Icon,
  ShareIcon,
  SlidersHorizontalIcon,
  SlidersIcon,
  SortAscIcon,
  SortDescIcon,
  Trash2Icon,
  TrashIcon,
  Undo2Icon,
  UndoIcon,
  UploadIcon,
  // ─── Communication ───────────────────────────────────────────
  ArchiveIcon,
  AtSignIcon,
  BellIcon,
  BellOffIcon,
  ForwardIcon,
  InboxIcon,
  MailIcon,
  MailOpenIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  PhoneCallIcon,
  PhoneIcon,
  PhoneIncomingIcon,
  PhoneMissedIcon,
  PhoneOutgoingIcon,
  ReplyAllIcon,
  ReplyIcon,
  SendIcon,
  VoicemailIcon,
  // ─── Media ───────────────────────────────────────────────────
  CameraIcon,
  CaptionsIcon,
  FilmIcon,
  HeadphonesIcon,
  ImageIcon,
  ImagesIcon,
  MicIcon,
  MicOffIcon,
  MonitorPlayIcon,
  Music2Icon,
  Music3Icon,
  Music4Icon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  VideoIcon,
  VideoOffIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeIcon,
  VolumeXIcon,
  // ─── Files ───────────────────────────────────────────────────
  FileArchiveIcon,
  FileCodeIcon,
  FileIcon,
  FileMinusIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderArchiveIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  // ─── User ────────────────────────────────────────────────────
  ContactIcon,
  LogInIcon,
  LogOutIcon,
  UserCheckIcon,
  UserCogIcon,
  UserIcon,
  UserMinusIcon,
  UserPlusIcon,
  UserXIcon,
  UsersIcon,
  // ─── Status ──────────────────────────────────────────────────
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  HelpCircleIcon,
  InfoIcon,
  KeyIcon,
  Loader2Icon,
  LoaderIcon,
  LockIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UnlockIcon,
  XCircleIcon,
  // ─── Extras (Objects / Misc) ─────────────────────────────────
  AnchorIcon,
  AwardIcon,
  BookmarkIcon,
  CompassIcon,
  FlagIcon,
  GiftIcon,
  HeartIcon,
  MapPinIcon,
  StarIcon,
  TagIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ─── Types ─────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}>;

interface IconEntry {
  /** Display + import name (matches lucide-react export). */
  name: string;
  /** Lowercase searchable token list, derived once. */
  keywords: string[];
  /** Underlying lucide-react component. */
  Component: IconComponent;
}

interface IconCategory {
  id: string;
  label: string;
  icons: IconEntry[];
}

type IconSize = "sm" | "md" | "lg" | "xl";
type IconColor = "foreground" | "primary";

// ─── Icon catalog (122 icons across 7 categories) ──────────────

const CATEGORIES: readonly IconCategory[] = [
  {
    id: "navigation",
    label: "Navigation",
    icons: [
      { name: "ArrowUp", Component: ArrowUpIcon, keywords: ["arrow", "up", "direction"] },
      { name: "ArrowDown", Component: ArrowDownIcon, keywords: ["arrow", "down", "direction"] },
      { name: "ArrowLeft", Component: ArrowLeftIcon, keywords: ["arrow", "left", "direction"] },
      { name: "ArrowRight", Component: ArrowRightIcon, keywords: ["arrow", "right", "direction"] },
      { name: "ArrowUpLeft", Component: ArrowUpLeftIcon, keywords: ["arrow", "up", "left", "diagonal"] },
      { name: "ArrowUpRight", Component: ArrowUpRightIcon, keywords: ["arrow", "up", "right", "diagonal"] },
      { name: "ArrowDownLeft", Component: ArrowDownLeftIcon, keywords: ["arrow", "down", "left", "diagonal"] },
      { name: "ArrowDownRight", Component: ArrowDownRightIcon, keywords: ["arrow", "down", "right", "diagonal"] },
      { name: "ArrowUpDown", Component: ArrowUpDownIcon, keywords: ["arrow", "up", "down", "vertical"] },
      { name: "ArrowLeftRight", Component: ArrowLeftRightIcon, keywords: ["arrow", "left", "right", "horizontal"] },
      { name: "ChevronUp", Component: ChevronUpIcon, keywords: ["chevron", "up", "collapse"] },
      { name: "ChevronDown", Component: ChevronDownIcon, keywords: ["chevron", "down", "expand"] },
      { name: "ChevronLeft", Component: ChevronLeftIcon, keywords: ["chevron", "left", "back"] },
      { name: "ChevronRight", Component: ChevronRightIcon, keywords: ["chevron", "right", "next"] },
      { name: "ChevronsUp", Component: ChevronsUpIcon, keywords: ["chevrons", "up", "double", "top"] },
      { name: "ChevronsDown", Component: ChevronsDownIcon, keywords: ["chevrons", "down", "double", "bottom"] },
      { name: "ChevronsLeft", Component: ChevronsLeftIcon, keywords: ["chevrons", "left", "double", "first"] },
      { name: "ChevronsRight", Component: ChevronsRightIcon, keywords: ["chevrons", "right", "double", "last"] },
      { name: "ChevronsUpDown", Component: ChevronsUpDownIcon, keywords: ["chevrons", "up", "down", "sort"] },
      { name: "CornerUpLeft", Component: CornerUpLeftIcon, keywords: ["corner", "up", "left", "reply"] },
      { name: "CornerUpRight", Component: CornerUpRightIcon, keywords: ["corner", "up", "right", "redirect"] },
      { name: "CornerDownLeft", Component: CornerDownLeftIcon, keywords: ["corner", "down", "left", "enter"] },
      { name: "CornerDownRight", Component: CornerDownRightIcon, keywords: ["corner", "down", "right"] },
      { name: "Menu", Component: MenuIcon, keywords: ["menu", "hamburger", "bars"] },
      { name: "X", Component: XIcon, keywords: ["x", "close", "cancel", "dismiss"] },
      { name: "ExternalLink", Component: ExternalLinkIcon, keywords: ["external", "link", "open"] },
      { name: "Maximize", Component: MaximizeIcon, keywords: ["maximize", "fullscreen", "expand"] },
      { name: "Minimize", Component: MinimizeIcon, keywords: ["minimize", "shrink", "collapse"] },
      { name: "Expand", Component: ExpandIcon, keywords: ["expand", "enlarge", "grow"] },
      { name: "Shrink", Component: ShrinkIcon, keywords: ["shrink", "reduce", "contract"] },
      { name: "Move", Component: MoveIcon, keywords: ["move", "drag", "translate"] },
      { name: "MoveHorizontal", Component: MoveHorizontalIcon, keywords: ["move", "horizontal"] },
      { name: "MoveVertical", Component: MoveVerticalIcon, keywords: ["move", "vertical"] },
      { name: "Home", Component: HomeIcon, keywords: ["home", "house", "dashboard"] },
      { name: "Compass", Component: CompassIcon, keywords: ["compass", "navigate", "north"] },
      { name: "Navigation", Component: NavigationIcon, keywords: ["navigation", "locate", "gps"] },
      { name: "MapPin", Component: MapPinIcon, keywords: ["map", "pin", "location", "place"] },
      { name: "Anchor", Component: AnchorIcon, keywords: ["anchor", "link", "moor"] },
    ],
  },
  {
    id: "action",
    label: "Action",
    icons: [
      { name: "Plus", Component: PlusIcon, keywords: ["plus", "add", "create", "new"] },
      { name: "Minus", Component: MinusIcon, keywords: ["minus", "subtract", "remove"] },
      { name: "Check", Component: CheckIcon, keywords: ["check", "done", "confirm", "tick"] },
      { name: "Edit", Component: EditIcon, keywords: ["edit", "modify", "pencil"] },
      { name: "Pencil", Component: PencilIcon, keywords: ["pencil", "write", "edit"] },
      { name: "Trash", Component: TrashIcon, keywords: ["trash", "delete", "bin"] },
      { name: "Trash2", Component: Trash2Icon, keywords: ["trash", "delete", "bin", "2"] },
      { name: "Copy", Component: CopyIcon, keywords: ["copy", "duplicate", "clone"] },
      { name: "Clipboard", Component: ClipboardIcon, keywords: ["clipboard", "paste", "copy"] },
      { name: "Download", Component: DownloadIcon, keywords: ["download", "save", "fetch"] },
      { name: "Upload", Component: UploadIcon, keywords: ["upload", "publish", "send"] },
      { name: "Share", Component: ShareIcon, keywords: ["share", "distribute"] },
      { name: "Share2", Component: Share2Icon, keywords: ["share", "social", "2"] },
      { name: "Save", Component: SaveIcon, keywords: ["save", "floppy", "store"] },
      { name: "RefreshCw", Component: RefreshCwIcon, keywords: ["refresh", "reload", "sync"] },
      { name: "RefreshCcw", Component: RefreshCcwIcon, keywords: ["refresh", "reload", "reverse"] },
      { name: "RotateCw", Component: RotateCwIcon, keywords: ["rotate", "clockwise", "spin"] },
      { name: "RotateCcw", Component: RotateCcwIcon, keywords: ["rotate", "counter", "counterclockwise"] },
      { name: "Undo", Component: UndoIcon, keywords: ["undo", "revert", "back"] },
      { name: "Undo2", Component: Undo2Icon, keywords: ["undo", "revert", "back", "2"] },
      { name: "Redo", Component: RedoIcon, keywords: ["redo", "repeat", "forward"] },
      { name: "Search", Component: SearchIcon, keywords: ["search", "find", "magnify"] },
      { name: "Filter", Component: FilterIcon, keywords: ["filter", "funnel", "narrow"] },
      { name: "SortAsc", Component: SortAscIcon, keywords: ["sort", "asc", "ascending", "az"] },
      { name: "SortDesc", Component: SortDescIcon, keywords: ["sort", "desc", "descending", "za"] },
      { name: "ArrowDownUp", Component: ArrowDownUpIcon, keywords: ["sort", "swap", "arrange"] },
      { name: "Settings", Component: SettingsIcon, keywords: ["settings", "gear", "config"] },
      { name: "Settings2", Component: Settings2Icon, keywords: ["settings", "sliders", "config", "2"] },
      { name: "Sliders", Component: SlidersIcon, keywords: ["sliders", "adjust", "equalizer"] },
      { name: "SlidersHorizontal", Component: SlidersHorizontalIcon, keywords: ["sliders", "horizontal", "adjust"] },
      { name: "MoreHorizontal", Component: MoreHorizontalIcon, keywords: ["more", "horizontal", "ellipsis", "menu"] },
      { name: "MoreVertical", Component: MoreVerticalIcon, keywords: ["more", "vertical", "ellipsis", "menu"] },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icons: [
      { name: "Mail", Component: MailIcon, keywords: ["mail", "email", "envelope"] },
      { name: "MailOpen", Component: MailOpenIcon, keywords: ["mail", "open", "read", "email"] },
      { name: "Phone", Component: PhoneIcon, keywords: ["phone", "call", "telephone"] },
      { name: "PhoneCall", Component: PhoneCallIcon, keywords: ["phone", "call", "ringing"] },
      { name: "PhoneIncoming", Component: PhoneIncomingIcon, keywords: ["phone", "incoming", "receive"] },
      { name: "PhoneOutgoing", Component: PhoneOutgoingIcon, keywords: ["phone", "outgoing", "dial"] },
      { name: "PhoneMissed", Component: PhoneMissedIcon, keywords: ["phone", "missed", "call"] },
      { name: "Voicemail", Component: VoicemailIcon, keywords: ["voicemail", "message", "tape"] },
      { name: "MessageSquare", Component: MessageSquareIcon, keywords: ["message", "chat", "comment"] },
      { name: "MessageCircle", Component: MessageCircleIcon, keywords: ["message", "chat", "bubble"] },
      { name: "Bell", Component: BellIcon, keywords: ["bell", "notification", "alert"] },
      { name: "BellOff", Component: BellOffIcon, keywords: ["bell", "off", "mute", "silent"] },
      { name: "Send", Component: SendIcon, keywords: ["send", "paper", "plane", "submit"] },
      { name: "Reply", Component: ReplyIcon, keywords: ["reply", "respond", "return"] },
      { name: "ReplyAll", Component: ReplyAllIcon, keywords: ["reply", "all", "group"] },
      { name: "Forward", Component: ForwardIcon, keywords: ["forward", "send", "relay"] },
      { name: "AtSign", Component: AtSignIcon, keywords: ["at", "sign", "mention", "email"] },
      { name: "Inbox", Component: InboxIcon, keywords: ["inbox", "tray", "receive"] },
      { name: "Archive", Component: ArchiveIcon, keywords: ["archive", "box", "store"] },
      { name: "Contact", Component: ContactIcon, keywords: ["contact", "card", "id"] },
    ],
  },
  {
    id: "media",
    label: "Media",
    icons: [
      { name: "Play", Component: PlayIcon, keywords: ["play", "start", "triangle"] },
      { name: "Pause", Component: PauseIcon, keywords: ["pause", "hold", "stop"] },
      { name: "SkipForward", Component: SkipForwardIcon, keywords: ["skip", "forward", "next"] },
      { name: "SkipBack", Component: SkipBackIcon, keywords: ["skip", "back", "previous"] },
      { name: "Volume", Component: VolumeIcon, keywords: ["volume", "sound", "audio"] },
      { name: "Volume1", Component: Volume1Icon, keywords: ["volume", "low", "sound", "1"] },
      { name: "Volume2", Component: Volume2Icon, keywords: ["volume", "high", "sound", "2"] },
      { name: "VolumeX", Component: VolumeXIcon, keywords: ["volume", "mute", "silent", "x"] },
      { name: "Camera", Component: CameraIcon, keywords: ["camera", "photo", "shoot"] },
      { name: "Image", Component: ImageIcon, keywords: ["image", "picture", "photo"] },
      { name: "Images", Component: ImagesIcon, keywords: ["images", "gallery", "photos"] },
      { name: "Video", Component: VideoIcon, keywords: ["video", "movie", "film"] },
      { name: "VideoOff", Component: VideoOffIcon, keywords: ["video", "off", "disable"] },
      { name: "Film", Component: FilmIcon, keywords: ["film", "movie", "reel", "strip"] },
      { name: "Mic", Component: MicIcon, keywords: ["mic", "microphone", "record"] },
      { name: "MicOff", Component: MicOffIcon, keywords: ["mic", "off", "mute", "microphone"] },
      { name: "Headphones", Component: HeadphonesIcon, keywords: ["headphones", "audio", "listen"] },
      { name: "Music", Component: MusicIcon, keywords: ["music", "note", "song"] },
      { name: "Music2", Component: Music2Icon, keywords: ["music", "note", "song", "2"] },
      { name: "Music3", Component: Music3Icon, keywords: ["music", "note", "song", "3"] },
      { name: "Music4", Component: Music4Icon, keywords: ["music", "note", "song", "4"] },
      { name: "Captions", Component: CaptionsIcon, keywords: ["captions", "subtitle", "cc"] },
      { name: "MonitorPlay", Component: MonitorPlayIcon, keywords: ["monitor", "play", "screen", "cast"] },
    ],
  },
  {
    id: "files",
    label: "Files",
    icons: [
      { name: "File", Component: FileIcon, keywords: ["file", "document", "page"] },
      { name: "FileText", Component: FileTextIcon, keywords: ["file", "text", "document"] },
      { name: "FilePlus", Component: FilePlusIcon, keywords: ["file", "plus", "add", "new"] },
      { name: "FileMinus", Component: FileMinusIcon, keywords: ["file", "minus", "remove"] },
      { name: "FileCode", Component: FileCodeIcon, keywords: ["file", "code", "source"] },
      { name: "FileArchive", Component: FileArchiveIcon, keywords: ["file", "archive", "zip"] },
      { name: "Folder", Component: FolderIcon, keywords: ["folder", "directory"] },
      { name: "FolderOpen", Component: FolderOpenIcon, keywords: ["folder", "open", "directory"] },
      { name: "FolderPlus", Component: FolderPlusIcon, keywords: ["folder", "plus", "add", "new"] },
      { name: "FolderArchive", Component: FolderArchiveIcon, keywords: ["folder", "archive", "zip"] },
    ],
  },
  {
    id: "user",
    label: "User",
    icons: [
      { name: "User", Component: UserIcon, keywords: ["user", "person", "account"] },
      { name: "Users", Component: UsersIcon, keywords: ["users", "group", "people", "team"] },
      { name: "UserPlus", Component: UserPlusIcon, keywords: ["user", "plus", "add", "invite"] },
      { name: "UserMinus", Component: UserMinusIcon, keywords: ["user", "minus", "remove"] },
      { name: "UserCheck", Component: UserCheckIcon, keywords: ["user", "check", "verified"] },
      { name: "UserX", Component: UserXIcon, keywords: ["user", "x", "remove", "block"] },
      { name: "UserCog", Component: UserCogIcon, keywords: ["user", "cog", "settings", "configure"] },
      { name: "LogIn", Component: LogInIcon, keywords: ["log", "in", "login", "signin"] },
      { name: "LogOut", Component: LogOutIcon, keywords: ["log", "out", "logout", "signout"] },
    ],
  },
  {
    id: "status",
    label: "Status",
    icons: [
      { name: "CheckCircle", Component: CheckCircleIcon, keywords: ["check", "circle", "success", "ok"] },
      { name: "CheckCircle2", Component: CheckCircle2Icon, keywords: ["check", "circle", "success", "ok", "2"] },
      { name: "XCircle", Component: XCircleIcon, keywords: ["x", "circle", "error", "fail"] },
      { name: "AlertTriangle", Component: AlertTriangleIcon, keywords: ["alert", "triangle", "warning"] },
      { name: "AlertCircle", Component: AlertCircleIcon, keywords: ["alert", "circle", "warning"] },
      { name: "Info", Component: InfoIcon, keywords: ["info", "information", "i"] },
      { name: "HelpCircle", Component: HelpCircleIcon, keywords: ["help", "question", "circle"] },
      { name: "Loader", Component: LoaderIcon, keywords: ["loader", "spinner", "loading"] },
      { name: "Loader2", Component: Loader2Icon, keywords: ["loader", "spinner", "loading", "2"] },
      { name: "Clock", Component: ClockIcon, keywords: ["clock", "time", "hour"] },
      { name: "Eye", Component: EyeIcon, keywords: ["eye", "view", "watch", "show"] },
      { name: "EyeOff", Component: EyeOffIcon, keywords: ["eye", "off", "hide", "invisible"] },
      { name: "Lock", Component: LockIcon, keywords: ["lock", "secure", "closed"] },
      { name: "Unlock", Component: UnlockIcon, keywords: ["unlock", "open", "unlocked"] },
      { name: "Key", Component: KeyIcon, keywords: ["key", "password", "token"] },
      { name: "Shield", Component: ShieldIcon, keywords: ["shield", "protect", "armor"] },
      { name: "ShieldCheck", Component: ShieldCheckIcon, keywords: ["shield", "check", "secure", "verified"] },
      { name: "Star", Component: StarIcon, keywords: ["star", "favorite", "rate"] },
      { name: "Heart", Component: HeartIcon, keywords: ["heart", "like", "love"] },
      { name: "Bookmark", Component: BookmarkIcon, keywords: ["bookmark", "save", "ribbon"] },
      { name: "Flag", Component: FlagIcon, keywords: ["flag", "report", "mark"] },
      { name: "Tag", Component: TagIcon, keywords: ["tag", "label", "price"] },
      { name: "Gift", Component: GiftIcon, keywords: ["gift", "present", "bonus"] },
      { name: "Award", Component: AwardIcon, keywords: ["award", "medal", "prize"] },
      { name: "Trophy", Component: TrophyIcon, keywords: ["trophy", "cup", "win", "champion"] },
      { name: "Zap", Component: ZapIcon, keywords: ["zap", "lightning", "fast", "energy"] },
    ],
  },
] as const;

// ─── Static counts (computed once at module load) ──────────────

const TOTAL_ICONS = CATEGORIES.reduce((sum, c) => sum + c.icons.length, 0);
const TOTAL_CATEGORIES = CATEGORIES.length;

// Flattened list for cross-category search. Built once, never mutated.
const ALL_ICONS: readonly IconEntry[] = CATEGORIES.flatMap((c) => c.icons);

// ─── Size tokens ───────────────────────────────────────────────

const SIZE_PX: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

const COLOR_CLASS: Record<IconColor, string> = {
  foreground: "text-foreground",
  primary: "text-primary",
} as const;

// ─── Sub-components ────────────────────────────────────────────

interface IconCardProps {
  entry: IconEntry;
  size: IconSize;
  color: IconColor;
  onCopy: (name: string) => void;
  copiedName: string | null;
}

const IconCard = React.memo(function IconCard({
  entry,
  size,
  color,
  onCopy,
  copiedName,
}: IconCardProps) {
  const isCopied = copiedName === entry.name;
  const handleCopy = React.useCallback(() => {
    onCopy(entry.name);
  }, [onCopy, entry.name]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Click to copy import statement for ${entry.name}`}
      aria-label={`Copy import for ${entry.name}`}
      className={cn(
        "group/card flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-4 text-center transition-[border-color,background-color,transform,box-shadow] duration-150",
        "hover:border-primary/40 hover:bg-accent/40 hover:-translate-y-0.5 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isCopied && "border-primary bg-primary/10 ring-1 ring-primary",
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-md transition-colors",
          "bg-muted/40 group-hover/card:bg-background",
          isCopied && "bg-primary/15",
        )}
      >
        <entry.Component
          size={SIZE_PX[size]}
          className={cn(COLOR_CLASS[color])}
          strokeWidth={2}
          aria-hidden="true"
        />
      </span>
      <span className="flex w-full flex-col items-center gap-1">
        <span className="truncate text-xs font-medium text-foreground">
          {entry.name}
        </span>
        <span
          className={cn(
            "text-[10px] font-mono text-muted-foreground transition-opacity",
            isCopied ? "text-primary opacity-100" : "opacity-0 group-hover/card:opacity-100",
          )}
        >
          {isCopied ? "copied!" : "click to copy"}
        </span>
      </span>
    </button>
  );
});

interface CategoryChipsProps {
  categories: readonly { id: string; label: string; count: number }[];
  active: string | "all";
  onChange: (id: string | "all") => void;
}

function CategoryChips({ categories, active, onChange }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <CategoryChip
        label="All"
        count={TOTAL_ICONS}
        isActive={active === "all"}
        onClick={() => onChange("all")}
      />
      {categories.map((c) => (
        <CategoryChip
          key={c.id}
          label={c.label}
          count={c.count}
          isActive={active === c.id}
          onClick={() => onChange(c.id)}
        />
      ))}
    </div>
  );
}

interface CategoryChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const CategoryChip = React.memo(function CategoryChip({
  label,
  count,
  isActive,
  onClick,
}: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
          isActive ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
});

// ─── Main component ────────────────────────────────────────────

export function IconPack() {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | "all">("all");
  const [size, setSize] = React.useState<IconSize>("md");
  const [color, setColor] = React.useState<IconColor>("foreground");
  const [copiedName, setCopiedName] = React.useState<string | null>(null);

  // Stable copy handler. Writes the lucide-react import statement to the
  // clipboard, sets the "copied!" state for 1.6s, and degrades gracefully
  // when the async clipboard API is unavailable.
  const handleCopy = React.useCallback(async (name: string) => {
    const statement = `import { ${name} } from "lucide-react"`;
    setCopiedName(name);
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(statement);
      } else if (typeof document !== "undefined") {
        // Legacy fallback for non-secure contexts.
        const textarea = document.createElement("textarea");
        textarea.value = statement;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch {
      // Silent: the UI already reflects the attempt via copiedName.
    }
    window.setTimeout(() => {
      setCopiedName((prev) => (prev === name ? null : prev));
    }, 1600);
  }, []);

  // Category chips with their per-category counts (stable, computed once).
  const categorySummaries = React.useMemo(
    () =>
      CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        count: c.icons.length,
      })),
    [],
  );

  // Search + category filter. Memoized so consumers don't recompute on
  // every unrelated state change (e.g. size / color toggles).
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "" && activeCategory === "all") {
      return ALL_ICONS;
    }
    return ALL_ICONS.filter((entry) => {
      const matchesCategory =
        activeCategory === "all" ||
        CATEGORIES.find((c) => c.id === activeCategory)?.icons.includes(entry);
      if (!matchesCategory) return false;
      if (q === "") return true;
      // Match against the canonical name and the keyword list.
      if (entry.name.toLowerCase().includes(q)) return true;
      return entry.keywords.some((k) => k.includes(q));
    });
  }, [query, activeCategory]);

  // When filtering by category, we still show all matching icons regardless
  // of order; the flat `filtered` list preserves catalog order which keeps
  // the grid stable across re-renders.

  const hasResults = filtered.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-primary">●</span>
          Icon Pack
        </CardTitle>
        <CardDescription>
          {TOTAL_ICONS} icons · {TOTAL_CATEGORIES} categories. Click any icon to
          copy its <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">lucide-react</code> import statement.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary" className="tabular-nums">
            {filtered.length} shown
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* ─── Controls row: search · size · color ─────────────── */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <SearchIcon
              size={16}
              className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons by name or keyword…"
              aria-label="Search icons"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Size selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Size</span>
              <ToggleGroup
                type="single"
                value={size}
                onValueChange={(v) => {
                  if (v) setSize(v as IconSize);
                }}
                variant="outline"
                size="sm"
                aria-label="Icon size"
              >
                <ToggleGroupItem value="sm">SM</ToggleGroupItem>
                <ToggleGroupItem value="md">MD</ToggleGroupItem>
                <ToggleGroupItem value="lg">LG</ToggleGroupItem>
                <ToggleGroupItem value="xl">XL</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Color toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Color</span>
              <ToggleGroup
                type="single"
                value={color}
                onValueChange={(v) => {
                  if (v) setColor(v as IconColor);
                }}
                variant="outline"
                size="sm"
                aria-label="Icon color preview"
              >
                <ToggleGroupItem value="foreground">Foreground</ToggleGroupItem>
                <ToggleGroupItem value="primary">Primary</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {(query !== "" || activeCategory !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* ─── Category chips ─────────────────────────────────── */}
        <CategoryChips
          categories={categorySummaries}
          active={activeCategory}
          onChange={setActiveCategory}
        />

        {/* ─── Grid ───────────────────────────────────────────── */}
        {hasResults ? (
          <div
            role="list"
            aria-label="Icons"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
          >
            {filtered.map((entry) => (
              <IconCard
                key={entry.name}
                entry={entry}
                size={size}
                color={color}
                onCopy={handleCopy}
                copiedName={copiedName}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
            <SearchIcon
              size={28}
              className="text-muted-foreground/60"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground">
              No icons match &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground">
              Try a different keyword or clear the filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* ─── Footer stats ───────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{filtered.length}</span>
            {" / "}
            <span className="font-medium text-foreground">{TOTAL_ICONS}</span> icons
            {" · "}
            <span className="font-medium text-foreground">
              {activeCategory === "all"
                ? TOTAL_CATEGORIES
                : 1}
            </span>{" "}
            {activeCategory === "all" ? "categories" : "category"}
          </span>
          <span className="font-mono">
            preview @ {SIZE_PX[size]}px · {color}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default IconPack;
