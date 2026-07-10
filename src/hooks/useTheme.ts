import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "prd-theme";

/**
 * Storage can throw on *access*, not just on write, in hardened privacy modes.
 * This runs during the first render, so an unguarded read blanks the page.
 */
function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The theme simply will not persist. Not worth interrupting anyone over.
  }
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = readStoredTheme();
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Light/dark theme with localStorage persistence. The theme is reflected on
 * `<html data-theme>` so CSS variables can switch without a re-render of the
 * whole tree.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storeTheme(theme);
  }, [theme]);

  const toggle = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"));

  return { theme, toggle };
}
