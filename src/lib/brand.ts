/**
 * DOCURA — Central brand & app configuration
 *
 * The product name "DOCURA" is intentionally NOT hardcoded across the codebase.
 * Components read from this single source via `useSettings()` so renaming the
 * product in Settings > Branding updates the whole UI live.
 */

export const APP_DEFAULTS = {
  appName: "DOCURA",
  tagline: "Convert Word documents to beautiful PDFs.",
  version: "1.0.0",
  buildId: "web-1.0.0-001",
  engine: "LibreOffice 25.2 headless",
  // supported input formats (MIME / extensions)
  supportedInputs: [".docx"],
  maxFileSizeMB: 100,
  maxBatchFiles: 25,
  maxConcurrentConversions: 2,
  // retention of converted artifacts on the server (ms)
  serverRetentionMs: 10 * 60 * 1000, // 10 minutes
} as const;

export type AppDefaults = typeof APP_DEFAULTS;

export const PAGE_SECTIONS = [
  { id: "convert", label: "Convert" },
  { id: "batch", label: "Batch" },
  { id: "history", label: "History" },
  { id: "files", label: "My Files" },
  { id: "download", label: "Download App" },
  { id: "settings", label: "Settings" },
  { id: "help", label: "Help & About" },
] as const;

export type SectionId = (typeof PAGE_SECTIONS)[number]["id"];
