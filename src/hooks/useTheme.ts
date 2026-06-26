import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "prd-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
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
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"));

  return { theme, toggle };
}
