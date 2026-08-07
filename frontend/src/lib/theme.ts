export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Accent options shown under "Color Mode" in the user menu, in design order.
 */
export const ACCENTS = [
  { id: "amber", label: "Amber", swatch: "#d97706" },
  { id: "blue", label: "Blue", swatch: "#7c3aed" },
  { id: "pink", label: "Pink", swatch: "#db2777" },
  { id: "rose", label: "Rose", swatch: "#e11d48" },
  { id: "emerald", label: "Emerald", swatch: "#059669" },
  { id: "black", label: "Black", swatch: "#18181b" },
] as const;

export type Accent = (typeof ACCENTS)[number]["id"];

export const DEFAULT_THEME: Theme = "light";
export const DEFAULT_ACCENT: Accent = "blue";

export const THEME_STORAGE_KEY = "pyramid.theme";
export const ACCENT_STORAGE_KEY = "pyramid.accent";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && ACCENTS.some((a) => a.id === value);
}

/**
 * Runs before paint via a blocking inline script so the persisted theme is
 * applied to <html> on first frame — this is what prevents a flash of the
 * wrong theme on refresh.
 */
export const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var a = localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)});
    var themes = ${JSON.stringify(THEMES)};
    var accents = ${JSON.stringify(ACCENTS.map((a) => a.id))};
    var el = document.documentElement;
    el.setAttribute("data-theme", themes.indexOf(t) > -1 ? t : ${JSON.stringify(DEFAULT_THEME)});
    el.setAttribute("data-accent", accents.indexOf(a) > -1 ? a : ${JSON.stringify(DEFAULT_ACCENT)});
    el.style.colorScheme = el.getAttribute("data-theme");
  } catch (e) {}
})();
`.trim();
