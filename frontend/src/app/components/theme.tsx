"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "./icons";

const STORAGE_KEY = "devorbits-theme";

/**
 * Inline, render-blocking script — sets `data-theme` on <html> before React
 * hydrates, so there's no flash of the wrong theme on load. Reads a saved
 * preference first, falls back to the OS-level preference.
 */
export function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem('${STORAGE_KEY}');
        var theme = stored === 'light' || stored === 'dark'
          ? stored
          : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function getStoredTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  // Start undefined so we render nothing until mounted — avoids a
  // server/client markup mismatch, since the real value only exists in
  // localStorage/the DOM attribute the inline script set.
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // Reads a value the pre-hydration script already wrote to the DOM —
    // this is a one-time sync with an external system (the document), which
    // is exactly what an effect is for; there's no async gap to guard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private browsing etc.) — theme just won't persist
    }
  }

  if (!theme) {
    // Reserve the same footprint so nothing shifts once it mounts.
    return <span className={`inline-block h-8 w-8 ${className}`} aria-hidden="true" />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-text-faint transition-colors hover:bg-surface-hover hover:text-text ${className}`}
    >
      {theme === "light" ? <IconMoon width={16} height={16} /> : <IconSun width={16} height={16} />}
    </button>
  );
}
