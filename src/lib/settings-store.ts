"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type ThemeId =
  | "obsidian"
  | "midnight"
  | "pearl"
  | "ivory"
  | "graphite"
  | "lavender"
  | "custom";

export type Mode = "light" | "dark" | "system";
export type Density = "compact" | "comfortable" | "spacious";
export type RadiusPreset = "sharp" | "default" | "round";
export type MotionPref = "on" | "off";
export type FontId = "geist" | "inter" | "manrope" | "system";

export interface PageSizePref {
  size: "A4" | "Letter" | "Legal" | "Original";
  orientation: "Portrait" | "Landscape";
  margin: "Normal" | "Narrow" | "Wide" | "Original";
}

export interface ConversionDefaults {
  page: PageSizePref;
  quality: "high" | "balanced" | "small";
  compression: boolean;
  embedFonts: boolean;
  preserveLinks: boolean;
  pdfTitle: string;
  pdfAuthor: string;
  pdfSubject: string;
  pdfKeywords: string;
  outputNaming: "original" | "uppercase" | "lowercase" | "with-suffix";
  autoDownload: boolean;
}

export interface PrivacySettings {
  autoCleanup: boolean;
  clearHistoryOnExit: boolean;
  storeHistory: boolean;
  storeOutputFiles: boolean;
}

export interface AccessibilitySettings {
  reducedMotion: MotionPref;
  density: Density;
  largeText: boolean;
  highContrast: boolean;
}

export interface BrandingSettings {
  appName: string;
  tagline: string;
  accentColor: string;
  secondaryColor: string;
  logoDataUrl: string | null;
}

export interface SettingsState {
  /* Appearance */
  theme: ThemeId;
  mode: Mode;
  customPrimary: string;
  customBackground: string;
  customSurface: string;
  fontId: FontId;
  fontSize: number;
  density: Density;
  radiusPreset: RadiusPreset;
  motion: MotionPref;
  sidebarCollapsed: boolean;

  /* Conversion defaults */
  conversion: ConversionDefaults;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  branding: BrandingSettings;

  /* actions */
  setTheme: (t: ThemeId) => void;
  setMode: (m: Mode) => void;
  setCustomPrimary: (c: string) => void;
  setCustomBackground: (c: string) => void;
  setCustomSurface: (c: string) => void;
  setFontId: (f: FontId) => void;
  setFontSize: (n: number) => void;
  setDensity: (d: Density) => void;
  setRadiusPreset: (r: RadiusPreset) => void;
  setMotion: (m: MotionPref) => void;
  setSidebarCollapsed: (b: boolean) => void;
  setConversion: (c: Partial<ConversionDefaults>) => void;
  setPrivacy: (p: Partial<PrivacySettings>) => void;
  setAccessibility: (a: Partial<AccessibilitySettings>) => void;
  setBranding: (b: Partial<BrandingSettings>) => void;
  resetAll: () => void;
}

/* ------------------------------------------------------------------ */
/* Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_CONVERSION: ConversionDefaults = {
  page: { size: "A4", orientation: "Portrait", margin: "Original" },
  quality: "balanced",
  compression: true,
  embedFonts: true,
  preserveLinks: true,
  pdfTitle: "",
  pdfAuthor: "",
  pdfSubject: "",
  pdfKeywords: "",
  outputNaming: "original",
  autoDownload: false,
};

const DEFAULT_PRIVACY: PrivacySettings = {
  autoCleanup: true,
  clearHistoryOnExit: false,
  storeHistory: true,
  storeOutputFiles: false,
};

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reducedMotion: "off",
  density: "comfortable",
  largeText: false,
  highContrast: false,
};

const DEFAULT_BRANDING: BrandingSettings = {
  appName: "DOCURA",
  tagline: "Convert Word documents to beautiful PDFs.",
  accentColor: "oklch(0.55 0.22 264)",
  secondaryColor: "oklch(0.85 0.12 162)",
  logoDataUrl: null,
};

export const DEFAULT_SETTINGS: Omit<
  SettingsState,
  | "setTheme" | "setMode" | "setCustomPrimary" | "setCustomBackground" | "setCustomSurface"
  | "setFontId" | "setFontSize" | "setDensity" | "setRadiusPreset" | "setMotion"
  | "setSidebarCollapsed" | "setConversion" | "setPrivacy" | "setAccessibility"
  | "setBranding" | "resetAll"
> = {
  theme: "obsidian",
  mode: "dark",
  customPrimary: "oklch(0.55 0.22 264)",
  customBackground: "oklch(0.145 0.015 250)",
  customSurface: "oklch(0.205 0.02 250)",
  fontId: "geist",
  fontSize: 14,
  density: "comfortable",
  radiusPreset: "default",
  motion: "on",
  sidebarCollapsed: false,
  conversion: DEFAULT_CONVERSION,
  privacy: DEFAULT_PRIVACY,
  accessibility: DEFAULT_ACCESSIBILITY,
  branding: DEFAULT_BRANDING,
};

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),
      setCustomPrimary: (customPrimary) => set({ customPrimary }),
      setCustomBackground: (customBackground) => set({ customBackground }),
      setCustomSurface: (customSurface) => set({ customSurface }),
      setFontId: (fontId) => set({ fontId }),
      setFontSize: (fontSize) => set({ fontSize }),
      setDensity: (density) => set({ density }),
      setRadiusPreset: (radiusPreset) => set({ radiusPreset }),
      setMotion: (motion) => set({ motion }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setConversion: (c) => set((s) => ({ conversion: { ...s.conversion, ...c } })),
      setPrivacy: (p) => set((s) => ({ privacy: { ...s.privacy, ...p } })),
      setAccessibility: (a) => set((s) => ({ accessibility: { ...s.accessibility, ...a } })),
      setBranding: (b) => set((s) => ({ branding: { ...s.branding, ...b } })),
      resetAll: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "docura-settings",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      version: 1,
    }
  )
);

/* ------------------------------------------------------------------ */
/* Theme applier — call from a client component on mount & on change  */
/* ------------------------------------------------------------------ */

export function applySettingsToDom(s: SettingsState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // theme + mode
  root.setAttribute("data-theme", s.theme);
  const resolvedMode =
    s.mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : s.mode;
  root.classList.toggle("dark", resolvedMode === "dark");
  root.setAttribute("data-mode", resolvedMode);

  // density / radius / motion
  root.setAttribute("data-density", s.density);
  root.setAttribute("data-radius", s.radiusPreset);
  root.setAttribute("data-motion", s.accessibility.reducedMotion === "on" || s.motion === "off" ? "off" : "on");

  // custom theme colors
  if (s.theme === "custom") {
    root.style.setProperty("--primary", s.customPrimary);
    root.style.setProperty("--ring", s.customPrimary);
    root.style.setProperty("--background", s.customBackground);
    root.style.setProperty("--sidebar", s.customBackground);
    root.style.setProperty("--card", s.customSurface);
    root.style.setProperty("--popover", s.customSurface);
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--background");
    root.style.removeProperty("--sidebar");
    root.style.removeProperty("--card");
    root.style.removeProperty("--popover");
  }

  // font family — next/font/google emits hashed family names accessible via
  // CSS variables like --font-inter, --font-manrope. We must reference those
  // variables rather than the literal family names ("Inter", "Manrope") because
  // the @font-face declaration uses the hashed name as `font-family`.
  const fontMap: Record<FontId, string> = {
    geist: "var(--font-geist-sans)",
    inter: "var(--font-inter), var(--font-geist-sans), system-ui, sans-serif",
    manrope: "var(--font-manrope), var(--font-geist-sans), system-ui, sans-serif",
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };
  root.style.setProperty("--app-font-sans", fontMap[s.fontId]);
  root.style.setProperty("font-size", `${s.fontSize}px`);
}
