"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "roycss-theme";

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const resolve = () => {
      const effective = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      setResolvedTheme(effective);
      root.classList.toggle("dark", effective === "dark");
      root.style.colorScheme = effective;
    };

    resolve();
    if (theme === "system") {
      media.addEventListener("change", resolve);
      return () => media.removeEventListener("change", resolve);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      /* noop */
    }
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
