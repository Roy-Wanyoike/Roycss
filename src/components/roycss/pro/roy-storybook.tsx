"use client";

/**
 * RoyStorybook — a self-contained component documentation platform.
 *
 * Showcases ten shadcn/ui components (Button, Card, Badge, Input, Avatar,
 * Alert, Tabs, Tooltip, Progress, Switch) with live previews, variant grids,
 * state simulations, a props table, copyable JSX snippets, and accessibility
 * notes (role / aria-* / keyboard interactions).
 *
 * Features:
 *   • Sidebar tree — components grouped by category; each component node is
 *     expandable to reveal its variants. Click a component to load its
 *     showcase in the main panel.
 *   • Live preview canvas with a scoped light/dark theme toggle. The toggle
 *     only affects the preview canvas (a `.dark` wrapper), never the
 *     surrounding storybook chrome — so docs stay legible in both modes.
 *   • Variants grid — renders every variant of the selected component using
 *     the real shadcn/ui primitives (no mocks).
 *   • States grid — default / hover / focus / disabled, simulated by applying
 *     the equivalent shadcn utility classes directly (so they render without
 *     any user interaction).
 *   • Props table — name, type, default, description.
 *   • Code snippet — JSX usage example with a one-click Copy button.
 *   • Accessibility notes — role, aria-* attributes, keyboard interactions.
 *   • Search box — filters the sidebar tree by component name (case-insensitive
 *     substring match). Empty query shows the full tree.
 *   • Responsive — the sidebar collapses into a Radix Sheet on viewports
 *     below the `md` breakpoint; a hamburger button in the header opens it.
 *
 * Self-contained: no props, no external stores, no `any`. TS strict.
 */

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Accessibility,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  LayoutGrid,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Category = "Forms" | "Display" | "Feedback" | "Navigation";

interface PropRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

interface VariantSpec {
  label: string;
  render: () => React.ReactNode;
}

interface StateSpec {
  label: string;
  description: string;
  render: () => React.ReactNode;
}

interface A11ySpec {
  role: string;
  aria: string[];
  keyboard: string[];
}

interface ComponentDoc {
  id: string;
  name: string;
  category: Category;
  tagline: string;
  description: string;
  variants: VariantSpec[];
  sizes?: VariantSpec[];
  states: StateSpec[];
  props: PropRow[];
  code: string;
  a11y: A11ySpec;
}

// ═══════════════════════════════════════════════════════════════════════
// Component catalog — ten shadcn/ui components, fully documented.
// ═══════════════════════════════════════════════════════════════════════

const COMPONENTS: readonly ComponentDoc[] = [
  // ── Button ──────────────────────────────────────────────────────────
  {
    id: "button",
    name: "Button",
    category: "Forms",
    tagline: "Trigger an action or event.",
    description:
      "Displays a button or a component that looks like a button. Supports six visual variants, four sizes, and an asChild slot pattern for polymorphic rendering.",
    variants: [
      { label: "default", render: () => <Button>Button</Button> },
      { label: "secondary", render: () => <Button variant="secondary">Secondary</Button> },
      { label: "destructive", render: () => <Button variant="destructive">Destructive</Button> },
      { label: "outline", render: () => <Button variant="outline">Outline</Button> },
      { label: "ghost", render: () => <Button variant="ghost">Ghost</Button> },
      { label: "link", render: () => <Button variant="link">Link</Button> },
    ],
    sizes: [
      { label: "sm", render: () => <Button size="sm">Small</Button> },
      { label: "default", render: () => <Button size="default">Default</Button> },
      { label: "lg", render: () => <Button size="lg">Large</Button> },
      { label: "icon", render: () => <Button size="icon" aria-label="Toggle"><Check /></Button> },
    ],
    states: [
      { label: "Default", description: "Resting state.", render: () => <Button>Button</Button> },
      {
        label: "Hover",
        description: "Slightly darkened primary surface.",
        render: () => <Button className="bg-primary/90">Button</Button>,
      },
      {
        label: "Focus",
        description: "Visible 3px ring for keyboard users.",
        render: () => (
          <Button className="ring-[3px] ring-ring/50 border-ring outline-none">
            Button
          </Button>
        ),
      },
      {
        label: "Disabled",
        description: "50% opacity, pointer events removed.",
        render: () => <Button disabled>Button</Button>,
      },
    ],
    props: [
      { name: "variant", type: "\"default\" | \"secondary\" | \"destructive\" | \"outline\" | \"ghost\" | \"link\"", default: "\"default\"", description: "Visual style of the button." },
      { name: "size", type: "\"default\" | \"sm\" | \"lg\" | \"icon\"", default: "\"default\"", description: "Button height & padding scale." },
      { name: "asChild", type: "boolean", default: "false", description: "Render as the child element via Radix Slot — useful for <a> or Next.js <Link>." },
      { name: "className", type: "string", default: "—", description: "Extra Tailwind classes merged with cva output." },
      { name: "...props", type: "ButtonHTMLAttributes<HTMLButtonElement>", default: "—", description: "All native button attributes (onClick, type, disabled, …)." },
    ],
    code: `import { Button } from "@/components/ui/button";

export function Example() {
  return (
    <div className="flex gap-2">
      <Button variant="default">Save</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive" size="sm">
        Delete
      </Button>
    </div>
  );
}`,
    a11y: {
      role: "button",
      aria: ["aria-label when icon-only (size=\"icon\").", "aria-disabled reflects the disabled state."],
      keyboard: ["Enter — activates the button.", "Space — activates the button.", "Tab — moves focus to / from the button."],
    },
  },

  // ── Card ────────────────────────────────────────────────────────────
  {
    id: "card",
    name: "Card",
    category: "Display",
    tagline: "A grouped content container.",
    description:
      "Composes a header, title, description, action, content, and footer slot into a single surfaced panel. All sub-components are composable and accept className.",
    variants: [
      {
        label: "default",
        render: () => (
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>You have 3 unread messages.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage how you receive updates about your account activity.
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Review</Button>
              <Button size="sm" variant="ghost">Dismiss</Button>
            </CardFooter>
          </Card>
        ),
      },
      {
        label: "minimal",
        render: () => (
          <Card className="w-full max-w-sm py-4">
            <CardHeader>
              <CardTitle>Quick stats</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">12,480</CardContent>
          </Card>
        ),
      },
    ],
    states: [
      { label: "Default", description: "Resting card.", render: () => (
        <Card className="w-full max-w-xs">
          <CardHeader><CardTitle>Card title</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Card content goes here.</CardContent>
        </Card>
      ) },
      { label: "Hover", description: "Elevated shadow + ring.", render: () => (
        <Card className="w-full max-w-xs shadow-md ring-1 ring-ring/30">
          <CardHeader><CardTitle>Card title</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Card content goes here.</CardContent>
        </Card>
      ) },
      { label: "Focus-within", description: "Ring when a child is focused.", render: () => (
        <Card className="w-full max-w-xs ring-2 ring-ring/50">
          <CardHeader><CardTitle>Card title</CardTitle></CardHeader>
          <CardContent><Input placeholder="Focus me" /></CardContent>
        </Card>
      ) },
      { label: "Disabled", description: "Muted, non-interactive.", render: () => (
        <Card className="w-full max-w-xs opacity-50 pointer-events-none">
          <CardHeader><CardTitle>Card title</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Card content goes here.</CardContent>
        </Card>
      ) },
    ],
    props: [
      { name: "className", type: "string", default: "—", description: "Extra classes for the card root." },
      { name: "children", type: "ReactNode", default: "—", description: "Card body. Use CardHeader / CardContent / CardFooter to structure." },
    ],
    code: `import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Example() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent>Manage your notifications.</CardContent>
      <CardFooter>
        <Button size="sm">Review</Button>
      </CardFooter>
    </Card>
  );
}`,
    a11y: {
      role: "group (semantic <div>)",
      aria: ["No implicit role — use aria-labelledby on a Card section when it represents a landmark.", "Use <section aria-labelledby> for navigable card regions."],
      keyboard: ["Tab — moves through focusable children (buttons, links, inputs) in source order."],
    },
  },

  // ── Badge ───────────────────────────────────────────────────────────
  {
    id: "badge",
    name: "Badge",
    category: "Display",
    tagline: "Compact status label.",
    description:
      "Small inline label for statuses, counts, or categories. Four variants. Use asChild to render as an <a> for navigable badges.",
    variants: [
      { label: "default", render: () => <Badge>Badge</Badge> },
      { label: "secondary", render: () => <Badge variant="secondary">Secondary</Badge> },
      { label: "destructive", render: () => <Badge variant="destructive">Destructive</Badge> },
      { label: "outline", render: () => <Badge variant="outline">Outline</Badge> },
    ],
    states: [
      { label: "Default", description: "Resting badge.", render: () => <Badge>New</Badge> },
      { label: "Hover (link)", description: "Used when asChild renders an <a>.", render: () => <Badge className="bg-primary/90">New</Badge> },
      { label: "Focus", description: "Visible ring for keyboard users.", render: () => <Badge className="ring-[3px] ring-ring/50 border-ring">New</Badge> },
      { label: "Disabled", description: "Muted, non-interactive.", render: () => <Badge className="opacity-50 pointer-events-none">New</Badge> },
    ],
    props: [
      { name: "variant", type: "\"default\" | \"secondary\" | \"destructive\" | \"outline\"", default: "\"default\"", description: "Visual style of the badge." },
      { name: "asChild", type: "boolean", default: "false", description: "Render as child element (e.g. <a>) via Radix Slot." },
      { name: "className", type: "string", default: "—", description: "Extra Tailwind classes." },
    ],
    code: `import { Badge } from "@/components/ui/badge";

export function Example() {
  return (
    <div className="flex gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Error</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  );
}`,
    a11y: {
      role: "span (no implicit role)",
      aria: ["Provide aria-label when a badge conveys state without adjacent text (e.g. an icon-only count).", "For status badges, pair with visually-hidden text for screen readers."],
      keyboard: ["Not focusable unless rendered as a link via asChild.", "Tab — moves to the next focusable element when a link badge is present."],
    },
  },

  // ── Input ───────────────────────────────────────────────────────────
  {
    id: "input",
    name: "Input",
    category: "Forms",
    tagline: "Single-line text field.",
    description:
      "A styled native <input>. Supports all native input types, including file. Shows a focus ring and an aria-invalid error style.",
    variants: [
      { label: "text", render: () => <Input placeholder="Email" type="email" /> },
      { label: "password", render: () => <Input placeholder="••••••••" type="password" defaultValue="secret" /> },
      { label: "file", render: () => <Input type="file" /> },
      { label: "disabled", render: () => <Input placeholder="Disabled" disabled /> },
      { label: "invalid", render: () => <Input placeholder="Invalid" aria-invalid /> },
    ],
    states: [
      { label: "Default", description: "Resting field.", render: () => <Input placeholder="you@example.com" /> },
      { label: "Hover", description: "Subtle border emphasis.", render: () => <Input placeholder="you@example.com" className="border-input/80" /> },
      { label: "Focus", description: "3px ring + colored border.", render: () => <Input placeholder="you@example.com" className="border-ring ring-[3px] ring-ring/50 outline-none" /> },
      { label: "Disabled", description: "50% opacity, no input.", render: () => <Input placeholder="Disabled" disabled /> },
    ],
    props: [
      { name: "type", type: "HTMLInputTypeAttribute", default: "\"text\"", description: "Native input type (text, email, password, file, number, …)." },
      { name: "value", type: "string | number", default: "—", description: "Controlled value." },
      { name: "defaultValue", type: "string | number", default: "—", description: "Uncontrolled initial value." },
      { name: "onChange", type: "ChangeEventHandler<HTMLInputElement>", default: "—", description: "Fires on every keystroke." },
      { name: "placeholder", type: "string", default: "—", description: "Hint shown when empty." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables interaction and dims the field." },
      { name: "aria-invalid", type: "boolean | \"true\" | \"false\"", default: "—", description: "Marks the field as invalid — renders the destructive error style." },
    ],
    code: `import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Example() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  );
}`,
    a11y: {
      role: "textbox",
      aria: ["aria-label or an associated <Label htmlFor> is required.", "aria-invalid=\"true\" + aria-describedby pointing at an error message conveys validation state.", "aria-required=\"true\" for required fields."],
      keyboard: ["Tab — moves focus into / out of the field.", "Type — edits the value.", "Ctrl/Cmd+A — selects all text."],
    },
  },

  // ── Avatar ──────────────────────────────────────────────────────────
  {
    id: "avatar",
    name: "Avatar",
    category: "Display",
    tagline: "User or entity image with fallback.",
    description:
      "Rounds an image into a circle and shows a fallback (initials or placeholder) while loading or when the image fails. Built on Radix Avatar.",
    variants: [
      {
        label: "with image",
        render: () => (
          <Avatar className="size-10">
            <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        ),
      },
      {
        label: "fallback",
        render: () => (
          <Avatar className="size-10">
            <AvatarFallback>RW</AvatarFallback>
          </Avatar>
        ),
      },
      {
        label: "sized",
        render: () => (
          <div className="flex items-center gap-2">
            <Avatar className="size-6"><AvatarFallback>S</AvatarFallback></Avatar>
            <Avatar className="size-10"><AvatarFallback>M</AvatarFallback></Avatar>
            <Avatar className="size-14"><AvatarFallback>L</AvatarFallback></Avatar>
          </div>
        ),
      },
    ],
    states: [
      { label: "Default", description: "Image loaded.", render: () => (
        <Avatar className="size-10">
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      ) },
      { label: "Loading/fallback", description: "Image pending or failed.", render: () => (
        <Avatar className="size-10"><AvatarFallback>RW</AvatarFallback></Avatar>
      ) },
      { label: "Focus", description: "When wrapped in a link.", render: () => (
        <Avatar className="size-10 ring-[3px] ring-ring/50"><AvatarFallback>RW</AvatarFallback></Avatar>
      ) },
      { label: "Disabled", description: "Muted, non-interactive.", render: () => (
        <Avatar className="size-10 opacity-50 pointer-events-none"><AvatarFallback>RW</AvatarFallback></Avatar>
      ) },
    ],
    props: [
      { name: "src", type: "string", default: "—", description: "Image URL passed to AvatarImage." },
      { name: "alt", type: "string", default: "—", description: "Alt text — required when the avatar conveys identity." },
      { name: "fallback", type: "ReactNode", default: "—", description: "Content shown while loading or on error (usually initials)." },
      { name: "className", type: "string", default: "—", description: "Controls size & shape (e.g. size-10, rounded-full)." },
    ],
    code: `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Example() {
  return (
    <Avatar className="size-10">
      <AvatarImage src="/user.png" alt="Roy Wanyoike" />
      <AvatarFallback>RW</AvatarFallback>
    </Avatar>
  );
}`,
    a11y: {
      role: "img (when image loads)",
      aria: ["AvatarImage renders role=\"img\" with the provided alt.", "When decorative, pass alt=\"\" and supplement with an adjacent visible label.", "AvatarFallback is exposed as the accessible name when no image is present."],
      keyboard: ["Not focusable on its own — wrap in a <a> or <button> for interactive avatars.", "Tab — moves to the wrapping interactive element."],
    },
  },

  // ── Alert ───────────────────────────────────────────────────────────
  {
    id: "alert",
    name: "Alert",
    category: "Feedback",
    tagline: "Inline contextual message.",
    description:
      "Calls attention to important information without interrupting the user. Two variants: default and destructive. Composes AlertTitle and AlertDescription.",
    variants: [
      {
        label: "default",
        render: () => (
          <Alert className="max-w-md">
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the CLI.
            </AlertDescription>
          </Alert>
        ),
      },
      {
        label: "destructive",
        render: () => (
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again.
            </AlertDescription>
          </Alert>
        ),
      },
    ],
    states: [
      { label: "Default", description: "Resting alert.", render: () => (
        <Alert className="max-w-sm"><AlertTitle>Heads up!</AlertTitle><AlertDescription>Read this note.</AlertDescription></Alert>
      ) },
      { label: "Hover", description: "Subtle elevation.", render: () => (
        <Alert className="max-w-sm shadow-sm"><AlertTitle>Heads up!</AlertTitle><AlertDescription>Read this note.</AlertDescription></Alert>
      ) },
      { label: "Focus-within", description: "Ring when a child is focused.", render: () => (
        <Alert className="max-w-sm ring-2 ring-ring/50"><AlertTitle>Heads up!</AlertTitle><AlertDescription>Read this note.</AlertDescription></Alert>
      ) },
      { label: "Destructive", description: "Error styling.", render: () => (
        <Alert variant="destructive" className="max-w-sm"><AlertTitle>Error</AlertTitle><AlertDescription>Try again later.</AlertDescription></Alert>
      ) },
    ],
    props: [
      { name: "variant", type: "\"default\" | \"destructive\"", default: "\"default\"", description: "Visual severity of the alert." },
      { name: "className", type: "string", default: "—", description: "Extra Tailwind classes." },
      { name: "title", type: "ReactNode (via AlertTitle)", default: "—", description: "Short, bold summary." },
      { name: "children", type: "ReactNode (via AlertDescription)", default: "—", description: "Supporting detail text." },
    ],
    code: `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function Example() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  );
}`,
    a11y: {
      role: "alert",
      aria: ["role=\"alert\" is set implicitly by the component — screen readers announce it live.", "For non-urgent messages, consider role=\"status\" instead.", "Pair AlertTitle + AlertDescription so screen readers convey both."],
      keyboard: ["Not focusable itself — focusable children (links, buttons) are reachable via Tab.", "Alert content is announced automatically on insertion."],
    },
  },

  // ── Tabs ────────────────────────────────────────────────────────────
  {
    id: "tabs",
    name: "Tabs",
    category: "Navigation",
    tagline: "Switch between related panels.",
    description:
      "A set of layered sections known as tab panels. Built on Radix Tabs — supports controlled & uncontrolled usage, arrow-key navigation, and roving focus.",
    variants: [
      {
        label: "default",
        render: () => (
          <Tabs defaultValue="account" className="w-full max-w-sm">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">Make changes to your account here.</TabsContent>
            <TabsContent value="password">Change your password here.</TabsContent>
          </Tabs>
        ),
      },
      {
        label: "three-tab",
        render: () => (
          <Tabs defaultValue="overview" className="w-full max-w-sm">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">Overview panel.</TabsContent>
            <TabsContent value="analytics">Analytics panel.</TabsContent>
            <TabsContent value="reports">Reports panel.</TabsContent>
          </Tabs>
        ),
      },
    ],
    states: [
      { label: "Default", description: "First tab active.", render: () => (
        <Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger><TabsTrigger value="b">B</TabsTrigger></TabsList></Tabs>
      ) },
      { label: "Hover", description: "Tab hovered.", render: () => (
        <Tabs defaultValue="a"><TabsList><TabsTrigger value="a" className="bg-accent text-accent-foreground">A</TabsTrigger><TabsTrigger value="b">B</TabsTrigger></TabsList></Tabs>
      ) },
      { label: "Focus", description: "Tab focused.", render: () => (
        <Tabs defaultValue="a"><TabsList><TabsTrigger value="a" className="ring-[3px] ring-ring/50 border-ring outline-none">A</TabsTrigger><TabsTrigger value="b">B</TabsTrigger></TabsList></Tabs>
      ) },
      { label: "Disabled", description: "A tab is disabled.", render: () => (
        <Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger><TabsTrigger value="b" disabled>B</TabsTrigger></TabsList></Tabs>
      ) },
    ],
    props: [
      { name: "value", type: "string", default: "—", description: "Controlled active tab value." },
      { name: "defaultValue", type: "string", default: "—", description: "Uncontrolled initial active tab." },
      { name: "onValueChange", type: "(value: string) => void", default: "—", description: "Fires when the active tab changes." },
      { name: "orientation", type: "\"horizontal\" | \"vertical\"", default: "\"horizontal\"", description: "Layout direction; affects arrow-key behavior." },
      { name: "activationMode", type: "\"automatic\" | \"manual\"", default: "\"automatic\"", description: "Whether focus alone activates a tab." },
    ],
    code: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function Example() {
  return (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account settings.</TabsContent>
      <TabsContent value="password">Password settings.</TabsContent>
    </Tabs>
  );
}`,
    a11y: {
      role: "tablist / tab / tabpanel",
      aria: ["aria-selected on the active TabsTrigger.", "aria-controls on each tab pointing at its panel.", "aria-labelledby on each panel pointing back at its tab.", "aria-disabled on disabled tabs."],
      keyboard: ["Tab — moves into the tablist and to the active tab.", "Arrow Left / Right — moves focus between tabs (roving tabindex).", "Enter / Space — activates the focused tab (manual mode only).", "Home / End — jumps to the first / last tab."],
    },
  },

  // ── Tooltip ─────────────────────────────────────────────────────────
  {
    id: "tooltip",
    name: "Tooltip",
    category: "Feedback",
    tagline: "Contextual label on hover/focus.",
    description:
      "A short, contextual text label that appears on hover or keyboard focus. Built on Radix Tooltip — never depends on a pointer; always keyboard accessible.",
    variants: [
      {
        label: "top",
        render: () => (
          <Tooltip>
            <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
            <TooltipContent side="top">Tooltip on top</TooltipContent>
          </Tooltip>
        ),
      },
      {
        label: "bottom",
        render: () => (
          <Tooltip>
            <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
            <TooltipContent side="bottom">Tooltip on bottom</TooltipContent>
          </Tooltip>
        ),
      },
      {
        label: "left",
        render: () => (
          <Tooltip>
            <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
            <TooltipContent side="left">Tooltip on left</TooltipContent>
          </Tooltip>
        ),
      },
      {
        label: "right",
        render: () => (
          <Tooltip>
            <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
            <TooltipContent side="right">Tooltip on right</TooltipContent>
          </Tooltip>
        ),
      },
    ],
    states: [
      { label: "Default", description: "Trigger resting.", render: () => (
        <Tooltip><TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger><TooltipContent>Label</TooltipContent></Tooltip>
      ) },
      { label: "Hover", description: "Trigger hovered.", render: () => (
        <Tooltip open><TooltipTrigger asChild><Button variant="outline" className="bg-accent">Hover me</Button></TooltipTrigger><TooltipContent>Label</TooltipContent></Tooltip>
      ) },
      { label: "Focus", description: "Trigger focused via keyboard.", render: () => (
        <Tooltip open><TooltipTrigger asChild><Button variant="outline" className="ring-[3px] ring-ring/50 border-ring outline-none">Hover me</Button></TooltipTrigger><TooltipContent>Label</TooltipContent></Tooltip>
      ) },
      { label: "Disabled", description: "Trigger disabled (no tooltip).", render: () => (
        <Button variant="outline" disabled>Disabled</Button>
      ) },
    ],
    props: [
      { name: "side", type: "\"top\" | \"right\" | \"bottom\" | \"left\"", default: "\"top\"", description: "Preferred side of the trigger." },
      { name: "align", type: "\"start\" | \"center\" | \"end\"", default: "\"center\"", description: "Alignment along the trigger's side." },
      { name: "sideOffset", type: "number", default: "0", description: "Pixel distance from the trigger." },
      { name: "delayDuration", type: "number", default: "0 (provider)", description: "Hover delay in ms before the tooltip opens." },
      { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", default: "—", description: "Controlled open state." },
    ],
    code: `import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export function Example() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        Tooltip on top
      </TooltipContent>
    </Tooltip>
  );
}`,
    a11y: {
      role: "tooltip",
      aria: ["The trigger receives aria-describedby pointing at the tooltip content.", "Tooltip content has role=\"tooltip\".", "Tooltips are NOT shown on touch devices — pair with a visible label or a Popover for essential info."],
      keyboard: ["Tab — moves focus to the trigger; the tooltip opens after delayDuration.", "Escape — closes the tooltip.", "Focus leaving the trigger closes the tooltip."],
    },
  },

  // ── Progress ────────────────────────────────────────────────────────
  {
    id: "progress",
    name: "Progress",
    category: "Display",
    tagline: "Completion indicator for a task.",
    description:
      "An accessible progress bar built on Radix Progress. The indicator's width is driven by the value prop (0–100).",
    variants: [
      { label: "0%", render: () => <Progress value={0} className="w-full max-w-xs" /> },
      { label: "33%", render: () => <Progress value={33} className="w-full max-w-xs" /> },
      { label: "66%", render: () => <Progress value={66} className="w-full max-w-xs" /> },
      { label: "100%", render: () => <Progress value={100} className="w-full max-w-xs" /> },
    ],
    states: [
      { label: "Default", description: "Indeterminate-looking at 0.", render: () => <Progress value={0} className="w-full max-w-xs" /> },
      { label: "In progress", description: "Mid completion.", render: () => <Progress value={50} className="w-full max-w-xs" /> },
      { label: "Focus", description: "Visible ring on the bar.", render: () => <Progress value={50} className="w-full max-w-xs ring-[3px] ring-ring/50" /> },
      { label: "Disabled", description: "Muted, non-interactive.", render: () => <Progress value={50} className="w-full max-w-xs opacity-50 pointer-events-none" /> },
    ],
    props: [
      { name: "value", type: "number | undefined", default: "undefined", description: "Completion 0–100. Undefined renders an indeterminate bar." },
      { name: "max", type: "number", default: "100", description: "Upper bound of the value." },
      { name: "getValueLabel", type: "(value: number, max: number) => string", default: "—", description: "Custom accessible value label (e.g. \"3 of 8 files\")." },
      { name: "className", type: "string", default: "—", description: "Styles the track; the indicator is styled internally." },
    ],
    code: `import { Progress } from "@/components/ui/progress";
import { useState } from "react";

export function Example() {
  const [value, setValue] = useState(33);
  return (
    <div className="grid gap-2">
      <Progress value={value} />
      <p className="text-sm text-muted-foreground">{value}% complete</p>
    </div>
  );
}`,
    a11y: {
      role: "progressbar",
      aria: ["aria-valuenow = current value.", "aria-valuemin = 0, aria-valuemax = max (default 100).", "aria-valuetext for human-readable progress (use getValueLabel).", "aria-label describing what is progressing."],
      keyboard: ["Not focusable — it is a status display, not an interactive control.", "Pair with a live region or visible text for screen-reader updates during long tasks."],
    },
  },

  // ── Switch ──────────────────────────────────────────────────────────
  {
    id: "switch",
    name: "Switch",
    category: "Forms",
    tagline: "Binary on/off toggle.",
    description:
      "A toggle between two mutually exclusive states (on/off). Built on Radix Switch — fully keyboard accessible and exposes role=\"switch\".",
    variants: [
      { label: "unchecked", render: () => <Switch /> },
      { label: "checked", render: () => <Switch defaultChecked /> },
      { label: "disabled", render: () => <Switch disabled /> },
      { label: "disabled checked", render: () => <Switch defaultChecked disabled /> },
    ],
    states: [
      { label: "Default", description: "Unchecked, resting.", render: () => <Switch /> },
      { label: "Hover", description: "Track hovered.", render: () => <Switch className="data-[state=unchecked]:bg-input/80" /> },
      { label: "Focus", description: "Visible ring for keyboard.", render: () => <Switch className="ring-[3px] ring-ring/50 border-ring outline-none" /> },
      { label: "Disabled", description: "Dimmed, no interaction.", render: () => <Switch disabled /> },
    ],
    props: [
      { name: "checked", type: "boolean", default: "—", description: "Controlled checked state." },
      { name: "defaultChecked", type: "boolean", default: "false", description: "Uncontrolled initial checked state." },
      { name: "onCheckedChange", type: "(checked: boolean) => void", default: "—", description: "Fires when the user toggles." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the switch." },
      { name: "required", type: "boolean", default: "false", description: "Marks as required for form submission." },
    ],
    code: `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function Example() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane mode</Label>
    </div>
  );
}`,
    a11y: {
      role: "switch",
      aria: ["aria-checked reflects the on/off state.", "Pair with a <Label htmlFor> so the toggle has a visible, accessible name.", "aria-disabled is set when disabled."],
      keyboard: ["Tab — moves focus to the switch.", "Space — toggles the state.", "Enter — toggles the state (some browsers)."],
    },
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Catalog helpers
// ═══════════════════════════════════════════════════════════════════════

const CATEGORIES: readonly Category[] = ["Forms", "Display", "Feedback", "Navigation"];

const CATEGORY_META: Record<Category, { label: string; description: string }> = {
  Forms: { label: "Forms", description: "Input & toggle controls" },
  Display: { label: "Display", description: "Data & status surfaces" },
  Feedback: { label: "Feedback", description: "Contextual messages" },
  Navigation: { label: "Navigation", description: "Wayfinding controls" },
};

function componentsByCategory(category: Category, query: string): ComponentDoc[] {
  const q = query.trim().toLowerCase();
  return COMPONENTS.filter(
    (c) => c.category === category && (q === "" || c.name.toLowerCase().includes(q)),
  );
}

// ═══════════════════════════════════════════════════════════════════════
// useCopied hook + small presentational subcomponents
// ═══════════════════════════════════════════════════════════════════════

/** Returns [copied, copy] — `copied` resets after `ms`. */
function useCopied(ms = 2000): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (text: string) => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else if (typeof document !== "undefined") {
          // Fallback for non-secure contexts.
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), ms);
      } catch {
        setCopied(false);
      }
    },
    [ms],
  );
  return [copied, copy];
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold tracking-tight">{children}</h3>
    </div>
  );
}

function PreviewCanvas({
  isDark,
  onToggleTheme,
  children,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border", isDark && "dark")}>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          <span className="font-mono">preview.canvas</span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label={isDark ? "Switch preview to light theme" : "Switch preview to dark theme"}
        >
          {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>
      <div className="bg-background text-foreground">
        <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-6 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function VariantCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-background p-4">
      <div className="flex min-h-[60px] items-center justify-center">{children}</div>
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function StateCard({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-background p-4">
      <div className="flex min-h-[60px] items-center justify-center">{children}</div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, copy] = useCopied();
  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">tsx</span>
        <button
          type="button"
          onClick={() => copy(code)}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label="Copy code snippet"
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

function PropsTable({ rows }: { rows: readonly PropRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="h-9 px-3">Prop</TableHead>
            <TableHead className="h-9 px-3">Type</TableHead>
            <TableHead className="h-9 px-3">Default</TableHead>
            <TableHead className="h-9 px-3">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="px-3 py-2 font-mono text-xs font-medium">{row.name}</TableCell>
              <TableCell className="px-3 py-2">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {row.type}
                </code>
              </TableCell>
              <TableCell className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.default}</TableCell>
              <TableCell className="px-3 py-2 text-xs text-muted-foreground">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function A11yNotes({ spec }: { spec: A11ySpec }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</div>
        <code className="font-mono text-sm">{spec.role}</code>
      </div>
      <div className="rounded-lg border p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">ARIA</div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {spec.aria.map((item) => (
            <li key={item} className="flex gap-1.5">
              <span className="text-foreground/60">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keyboard</div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {spec.keyboard.map((item) => (
            <li key={item} className="flex gap-1.5">
              <span className="text-foreground/60">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sidebar tree
// ═══════════════════════════════════════════════════════════════════════

function SidebarContent({
  query,
  selectedId,
  expanded,
  onSelect,
  onToggleExpand,
}: {
  query: string;
  selectedId: string;
  expanded: ReadonlySet<string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <LayoutGrid className="size-3.5" />
          Components
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="p-2" aria-label="Component catalog">
          {CATEGORIES.map((category) => {
            const items = componentsByCategory(category, query);
            if (items.length === 0) return null;
            const meta = CATEGORY_META[category];
            return (
              <div key={category} className="mb-2">
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold">{meta.label}</div>
                  <div className="text-[11px] text-muted-foreground">{meta.description}</div>
                </div>
                <ul className="space-y-0.5">
                  {items.map((doc) => {
                    const isSelected = doc.id === selectedId;
                    const isExpanded = expanded.has(doc.id);
                    return (
                      <li key={doc.id}>
                        <div
                          className={cn(
                            "group flex items-center gap-1 rounded-md",
                            isSelected && "bg-accent text-accent-foreground",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleExpand(doc.id)}
                            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            aria-label={isExpanded ? `Collapse ${doc.name} variants` : `Expand ${doc.name} variants`}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelect(doc.id)}
                            className={cn(
                              "flex-1 truncate py-1.5 pr-2 text-left text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                              isSelected ? "text-accent-foreground" : "text-foreground/80",
                            )}
                          >
                            {doc.name}
                          </button>
                        </div>
                        {isExpanded && (
                          <ul className="ml-4 border-l pl-2">
                            {doc.variants.map((v) => (
                              <li key={v.label}>
                                <button
                                  type="button"
                                  onClick={() => onSelect(doc.id)}
                                  className="w-full truncate py-1 pl-2 text-left font-mono text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                  {v.label}
                                </button>
                              </li>
                            ))}
                            {doc.sizes && (
                              <li className="mt-1">
                                <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                                  sizes
                                </div>
                                <ul>
                                  {doc.sizes.map((s) => (
                                    <li key={s.label}>
                                      <button
                                        type="button"
                                        onClick={() => onSelect(doc.id)}
                                        className="w-full truncate py-1 pl-2 text-left font-mono text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                      >
                                        {s.label}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            )}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {CATEGORIES.every((c) => componentsByCategory(c, query).length === 0) && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No components match &ldquo;{query}&rdquo;.
            </div>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Showcase panel — rendered for the selected component
// ═══════════════════════════════════════════════════════════════════════

function Showcase({ doc }: { doc: ComponentDoc }) {
  const [isDark, setIsDark] = useState(false);
  // The parent remounts this component via key={doc.id} when the selection
  // changes, so the theme resets to its initial `false` value automatically —
  // no effect needed.

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{doc.name}</h2>
          <Badge variant="outline">{doc.category}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{doc.tagline}</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {doc.description}
        </p>
      </div>

      {/* Live preview */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={<LayoutGrid className="size-4" />}>Live preview</SectionTitle>
        <PreviewCanvas isDark={isDark} onToggleTheme={() => setIsDark((v) => !v)}>
          {doc.variants[0]?.render()}
        </PreviewCanvas>
      </section>

      {/* Variants */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={<LayoutGrid className="size-4" />}>Variants</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {doc.variants.map((v) => (
            <VariantCard key={v.label} label={v.label}>
              {v.render()}
            </VariantCard>
          ))}
        </div>
      </section>

      {/* Sizes (Button only) */}
      {doc.sizes && doc.sizes.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<LayoutGrid className="size-4" />}>Sizes</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {doc.sizes.map((s) => (
              <VariantCard key={s.label} label={s.label}>
                {s.render()}
              </VariantCard>
            ))}
          </div>
        </section>
      )}

      {/* States */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={<LayoutGrid className="size-4" />}>States</SectionTitle>
        <p className="text-xs text-muted-foreground">
          States are simulated by applying the equivalent shadcn utility classes directly —
          no interaction required.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {doc.states.map((s) => (
            <StateCard key={s.label} label={s.label} description={s.description}>
              {s.render()}
            </StateCard>
          ))}
        </div>
      </section>

      {/* Props */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={<LayoutGrid className="size-4" />}>Props</SectionTitle>
        <PropsTable rows={doc.props} />
      </section>

      {/* Code */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={<LayoutGrid className="size-4" />}>Usage</SectionTitle>
        <CodeBlock code={doc.code} />
      </section>

      {/* Accessibility */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={<Accessibility className="size-4" />}>Accessibility</SectionTitle>
        <A11yNotes spec={doc.a11y} />
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function RoyStorybook() {
  const [selectedId, setSelectedId] = useState<string>(COMPONENTS[0].id);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set([COMPONENTS[0].id]),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const selected = useMemo(
    () => COMPONENTS.find((c) => c.id === selectedId) ?? COMPONENTS[0],
    [selectedId],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMobileOpen(false);
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const sidebarProps = {
    query,
    selectedId,
    expanded,
    onSelect: handleSelect,
    onToggleExpand: handleToggleExpand,
  };

  return (
    <div className="flex min-h-[640px] flex-col rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open component catalog"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle className="flex items-center gap-2 text-left">
                <LayoutGrid className="size-4" />
                Components
              </SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-3.5rem)]">
              <SidebarContent {...sidebarProps} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutGrid className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Roy Storybook</div>
            <div className="text-[11px] text-muted-foreground">
              Component documentation platform
            </div>
          </div>
        </div>

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components…"
            className="h-9 pl-8 pr-8"
            aria-label="Search components by name"
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r md:block">
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Showcase */}
        <main className="flex-1 overflow-x-hidden">
          <ScrollArea className="h-[calc(100vh-9rem)] min-h-[560px]">
            <div className="p-6 lg:p-8">
              <Showcase key={selected.id} doc={selected} />
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}

export default RoyStorybook;
