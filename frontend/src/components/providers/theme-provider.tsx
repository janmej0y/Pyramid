"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isAccent,
  isTheme,
  type Accent,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  accent: Accent;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Seeded from the attributes the pre-paint script already wrote to <html>,
  // via a lazy initializer so there is no post-mount sync render. On the server
  // the DOM is absent and we fall back to the defaults, which is exactly what
  // the server HTML renders — so hydration matches.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === "undefined") return DEFAULT_THEME;
    const value = document.documentElement.getAttribute("data-theme");
    return isTheme(value) ? value : DEFAULT_THEME;
  });

  const [accent, setAccentState] = useState<Accent>(() => {
    if (typeof document === "undefined") return DEFAULT_ACCENT;
    const value = document.documentElement.getAttribute("data-accent");
    return isAccent(value) ? value : DEFAULT_ACCENT;
  });

  // Keep the theme in sync across tabs/windows.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) {
        setThemeState(event.newValue);
      }
      if (event.key === ACCENT_STORAGE_KEY && isAccent(event.newValue)) {
        setAccentState(event.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); theme still applies for the session.
    }
  }, []);

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next);
    document.documentElement.setAttribute("data-accent", next);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, next);
    } catch {
      // See note above.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
