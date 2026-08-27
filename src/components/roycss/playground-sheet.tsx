"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlaygroundV2 } from "@/components/roycss/playground-v2";
import { Maximize2, Minimize2, ExternalLink } from "lucide-react";

/**
 * PlaygroundSheet
 *
 * A Sheet (right-side panel) that hosts the PlaygroundV2 component.
 * Triggered from the navbar "Playground" button (icon cluster) or
 * the DevTools dropdown. Provides two auxiliary actions:
 *
 *  1. Expand — toggles between the default 4xl-wide side panel and a
 *     true fullscreen viewport takeover (w-screen h-screen).
 *  2. New Window — pops a detached browser window that hosts the
 *     current origin in an iframe, so users can keep the playground
 *     open on a second monitor while browsing the showcase.
 *
 * The Sheet body uses `h-full flex flex-col` so the PlaygroundV2
 * inside fills the remaining height (header is fixed at the top).
 */
export function PlaygroundSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`gap-0 p-0 h-full flex flex-col ${
          isFullscreen
            ? "w-screen h-screen max-w-none max-h-none sm:max-w-none"
            : "w-full sm:max-w-4xl"
        }`}
      >
        <SheetHeader className="flex-row items-center justify-between gap-2 p-4 border-b border-border/50">
          <SheetTitle className="font-display text-base">Playground</SheetTitle>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen((v) => !v)}
              aria-label={isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
              className="gap-1.5"
            >
              {isFullscreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
              <span className="hidden sm:inline">
                {isFullscreen ? "Exit" : "Expand"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Open the playground in a detached popup window.
                // We host the current origin in an iframe so the user
                // gets the full RoyCSS showcase (with the Playground
                // sheet trigger) on a second monitor.
                const features =
                  "width=1200,height=800,resizable=yes,scrollbars=yes";
                const win = window.open(
                  "",
                  "roycss-playground",
                  features,
                );
                if (win) {
                  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>RoyCSS Playground</title><style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#0b0f14}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe src="${window.location.origin}" title="RoyCSS Playground" allow="clipboard-read; clipboard-write; fullscreen"></iframe></body></html>`);
                  win.document.close();
                  win.focus();
                }
                onOpenChange(false);
              }}
              aria-label="Open in new window"
              title="Open in new window"
              className="gap-1.5"
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">New Window</span>
            </Button>
          </div>
        </SheetHeader>

        {/* Playground body — fills the remaining height.
            `min-h-0` is critical so flexbox allows the child to shrink
            inside the Sheet's flex column (otherwise it overflows). */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <PlaygroundV2 />
        </div>
      </SheetContent>
    </Sheet>
  );
}
