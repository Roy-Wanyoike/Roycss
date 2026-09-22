"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  type Theme,
} from "./theme-storage";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * ThemeProvider (issue #160).
 *
 * SSR + the first client render always use `defaultTheme` ("system") so the
 * server and client HTML agree — reading localStorage during the hydration
 * render would desync them. The visual theme itself is applied BEFORE React
 * by the pre-hydration script in `src/app/layout.tsx`, so there is no flash:
 * the stored value is adopted below right after mount.
 *
 * Persistence contract (issue #160):
 *   - Mount/hydration NEVER writes to localStorage — it only reads.
 *   - The stored preference is the only writer's output: `setTheme`
 *     (and therefore `toggleTheme`) runs exclusively from user actions.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Adopt the stored preference on mount WITHOUT writing (issue #160).
    // The pre-hydration script already applied it to <html> before paint;
    // this only syncs React state so consumers see the same value.
    // Deferred via rAF to satisfy the set-state-in-effect rule.
    const id = requestAnimationFrame(() => {
      const stored = readStoredTheme(window.localStorage);
      if (stored) setThemeState(stored);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const effective = resolveTheme(theme, media.matches);
      setResolvedTheme(effective);
      root.classList.toggle("dark", effective === "dark");
      root.style.colorScheme = effective;
    };

    apply();
    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // User-intent-only write (issue #160). Never called on mount.
    writeStoredTheme(window.localStorage, newTheme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
