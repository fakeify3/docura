"use client";

import { useEffect } from "react";
import { useSettings, applySettingsToDom } from "@/lib/settings-store";

/**
 * Reads the persisted settings on mount and whenever they change,
 * and applies them to <html> data-* attributes + CSS variables.
 *
 * This is a tiny client component rendered once in the root layout.
 */
export function ThemeApplier() {
  const settings = useSettings();

  useEffect(() => {
    applySettingsToDom(settings);
  }, [settings]);

  // Also re-apply when the OS color scheme changes (for "system" mode)
  useEffect(() => {
    if (settings.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applySettingsToDom(settings);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.mode, settings]);

  return null;
}
