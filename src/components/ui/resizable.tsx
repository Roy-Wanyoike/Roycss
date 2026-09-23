"use client"

import * as React from "react"
import { GripVerticalIcon } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

/**
 * shadcn-compatible wrapper over react-resizable-panels v4.
 *
 * v4 renamed `PanelGroup` → `Group` and `PanelResizeHandle` → `Separator`,
 * replaced the `direction` prop with `orientation`, and no longer stamps a
 * `data-panel-group-direction` attribute used for vertical-variant styling.
 * This wrapper keeps the external shadcn API (`ResizablePanelGroup`,
 * `ResizablePanel`, `ResizableHandle`, legacy `direction` prop) while
 * adapting internals: it maps `direction` → `orientation` and stamps
 * `data-orientation` so the vertical utilities keep working via the
 * `group/resize-group` + `group-data-[orientation=vertical]` pattern.
 */
function ResizablePanelGroup({
  className,
  direction,
  orientation,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group> & {
  /** Legacy shadcn/v3 prop — maps to v4 `orientation`. */
  direction?: "horizontal" | "vertical"
}) {
  const resolvedOrientation = orientation ?? direction
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      data-orientation={resolvedOrientation ?? "horizontal"}
      orientation={resolvedOrientation}
      className={cn(
        "group/resize-group flex h-full w-full data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden group-data-[orientation=vertical]/resize-group:h-px group-data-[orientation=vertical]/resize-group:w-full group-data-[orientation=vertical]/resize-group:after:left-0 group-data-[orientation=vertical]/resize-group:after:h-1 group-data-[orientation=vertical]/resize-group:after:w-full group-data-[orientation=vertical]/resize-group:after:translate-x-0 group-data-[orientation=vertical]/resize-group:after:-translate-y-1/2 group-data-[orientation=vertical]/resize-group:[&>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
