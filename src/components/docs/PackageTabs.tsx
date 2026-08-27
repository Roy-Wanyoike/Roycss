"use client";

/**
 * PackageTabs — Tab switcher for package-manager install commands.
 *
 * Tabs: npm, pnpm, yarn, bun, deno. Each tab shows the install command
 * appropriate to that package manager. The user's selected tab is
 * persisted to localStorage so the next visit resumes on the same tab.
 *
 * Designed for use inside docs pages — accepts an optional `package`
 * prop (defaults to "roycss") so it can render any install snippet.
 */

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "deno";

interface PackageManagerConfig {
  label: string;
  /** Build the install command for the given package name. */
  build: (pkg: string) => string;
}

const PACKAGE_MANAGERS: Record<PackageManager, PackageManagerConfig> = {
  npm: {
    label: "npm",
    build: (pkg) => `npm install ${pkg}`,
  },
  pnpm: {
    label: "pnpm",
    build: (pkg) => `pnpm add ${pkg}`,
  },
  yarn: {
    label: "yarn",
    build: (pkg) => `yarn add ${pkg}`,
  },
  bun: {
    label: "bun",
    build: (pkg) => `bun add ${pkg}`,
  },
  deno: {
    label: "deno",
    build: (pkg) => `deno add npm:${pkg}`,
  },
};

const ORDER: PackageManager[] = ["npm", "pnpm", "yarn", "bun", "deno"];

const STORAGE_KEY = "roycss-docs-package-manager";

interface PackageTabsProps {
  /** Package name to install. Defaults to "roycss". */
  package?: string;
  className?: string;
}

export function PackageTabs({
  package: pkg = "roycss",
  className,
}: PackageTabsProps) {
  const [selected, setSelected] = useState<PackageManager>("npm");

  // Hydrate persisted selection on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
      if (stored && PACKAGE_MANAGERS[stored]) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot localStorage hydration
        setSelected(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const select = (pm: PackageManager) => {
    setSelected(pm);
    try {
      localStorage.setItem(STORAGE_KEY, pm);
    } catch {
      // ignore — non-critical
    }
  };

  const command = useMemo(
    () => PACKAGE_MANAGERS[selected].build(pkg),
    [selected, pkg],
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 overflow-hidden bg-zinc-950 text-zinc-50",
        className,
      )}
    >
      {/* Tab row */}
      <div
        role="tablist"
        aria-label="Package manager"
        className="flex items-center border-b border-zinc-800 bg-zinc-900/80 overflow-x-auto scrollbar-thin"
      >
        {ORDER.map((pm) => {
          const isActive = pm === selected;
          return (
            <button
              key={pm}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => select(pm)}
              className={cn(
                "px-4 py-2 text-xs font-medium transition-all cursor-pointer whitespace-nowrap border-b-2",
                isActive
                  ? "text-primary border-primary bg-primary/5"
                  : "text-zinc-400 hover:text-zinc-100 border-transparent",
              )}
            >
              {PACKAGE_MANAGERS[pm].label}
            </button>
          );
        })}
      </div>
      {/* Command display */}
      <div
        role="tabpanel"
        className="px-4 py-3 font-mono text-sm leading-relaxed overflow-x-auto scrollbar-thin"
      >
        <code className="whitespace-pre text-zinc-100">
          <span className="text-zinc-500 select-none">$ </span>
          {command}
        </code>
      </div>
    </div>
  );
}
