/**
 * DOCURA — Server-side DOCX → PDF conversion engine
 *
 * Real conversion via LibreOffice headless (`soffice --headless --convert-to pdf`).
 * This is a genuine document conversion engine — not a file rename, not a screenshot,
 * not a text-only dump.
 *
 * Security model:
 *  - Files are validated by magic bytes (PK\x03\x04 for DOCX/zip)
 *  - Each conversion uses a unique temp working directory with random name
 *  - Input filenames are sanitized (basename only) to prevent path traversal
 *  - Output is verified by reading the PDF magic header (%PDF-) and parsing page count
 *  - Temp directories are cleaned up after each conversion
 *  - LibreOffice runs with an isolated -env:UserInstallation profile to avoid
 *    collisions and to prevent leakage between concurrent conversions
 *
 * Engine discovery:
 *  - Tries multiple well-known soffice paths in order: SOFFICE_BIN env var,
 *    `soffice`, `libreoffice`, /usr/bin/soffice, /usr/bin/libreoffice,
 *    /usr/lib/libreoffice/program/soffice, /opt/libreoffice/program/soffice
 *  - Caches the resolved binary so subsequent conversions skip the discovery
 */

import { randomUUID } from "crypto";
import { promises as fs, constants as fsConstants } from "fs";
import { spawn, spawnSync } from "child_process";
import { tmpdir } from "os";
import { join, basename, extname } from "path";

/* ------------------------------------------------------------------ */
/* Engine binary discovery                                            */
/* ------------------------------------------------------------------ */

const CANDIDATE_BINARIES = [
  process.env.SOFFICE_BIN,
  "soffice",
  "libreoffice",
  "/usr/bin/soffice",
  "/usr/bin/libreoffice",
  "/usr/lib/libreoffice/program/soffice",
  "/opt/libreoffice/program/soffice",
  "/usr/local/bin/soffice",
  "/usr/local/bin/libreoffice",
  // macOS LibreOffice.app
  "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  // Windows common install paths
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
].filter(Boolean) as string[];

let resolvedBinary: string | null = null;
let binaryCheckInProgress: Promise<string | null> | null = null;

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve which soffice binary to use. Tries PATH-resolved names first
 * (via `which`-style spawn), then absolute paths. Result is cached.
 */
async function resolveSofficeBin(): Promise<string | null> {
  if (resolvedBinary) return resolvedBinary;
  if (binaryCheckInProgress) return binaryCheckInProgress;

  binaryCheckInProgress = (async () => {
    for (const candidate of CANDIDATE_BINARIES) {
      // If it's an absolute path, just check it's executable.
      if (candidate.includes("/") || candidate.includes("\\")) {
        if (await fileExists(candidate)) {
          resolvedBinary = candidate;
          return candidate;
        }
        continue;
      }
      // PATH-resolved: try spawning the binary directly with --version.
      // No shell option to avoid the Node.js deprecation warning about
      // passing args with shell:true.
      try {
        const probe = spawnSync(candidate, ["--version"], {
          encoding: "utf8",
          timeout: 5000,
        });
        if (probe.status === 0) {
          resolvedBinary = candidate;
          return candidate;
        }
        // If spawnSync failed (ENOENT), the binary isn't on PATH; fall through.
      } catch {
        // ignore, try next candidate
      }
    }
    return null;
  })();

  const result = await binaryCheckInProgress;
  binaryCheckInProgress = null;
  return result;
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export interface ConversionResult {
  ok: boolean;
  outputBuffer?: Buffer;
  outputName: string;
  durationMs: number;
  inputSize: number;
  outputSize: number;
  pages: number | null;
  /** User-facing error message — friendly, never mentions installation or technical details. */
  errorMessage?: string;
  /** Internal technical detail for server logs only — never shown to the user. */
  internalError?: string;
  errorKind?:
    | "invalid_format"
    | "corrupted"
    | "encrypted"
    | "oversized"
    | "engine_unavailable"
    | "timeout"
    | "disk_full"
    | "unknown";
}

const MAX_FILE_BYTES = parseInt(
  process.env.DOCURA_MAX_FILE_BYTES || String(100 * 1024 * 1024),
  10
);

// 5 minutes — generous timeout for complex documents with many images,
// tables, embedded objects, etc.
const CONVERSION_TIMEOUT_MS = parseInt(
  process.env.DOCURA_TIMEOUT_MS || String(300_000),
  10
);

// How many times to retry a failed conversion with a fresh temp directory
// and profile before giving up. Some DOCX files fail on the first attempt
// due to transient LibreOffice state (stale lock files, profile corruption)
// but succeed on retry.
const CONVERSION_RETRIES = parseInt(
  process.env.DOCURA_RETRIES || String(2),
  10
);

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Validate that an uploaded buffer is genuinely a DOCX file.
 * DOCX is a ZIP archive whose first bytes are the ZIP local-file-header
 * magic (PK\x03\x04). We then verify [Content_Types].xml is in the central
 * directory to ensure it's actually an Office Open XML document, not just a
 * random zip.
 */
export function validateDocx(buffer: Buffer): {
  ok: boolean;
  reason?: string;
  kind?: ConversionResult["errorKind"];
} {
  if (!buffer || buffer.length < 4) {
    return { ok: false, reason: "File is empty or too small to be valid.", kind: "invalid_format" };
  }
  // ZIP magic
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
    return { ok: false, reason: "Not a valid DOCX file (missing ZIP header).", kind: "invalid_format" };
  }
  // Look for the Office Open XML signature inside the file — the content-types
  // file is always present in a valid DOCX. We just look for its name as a
  // substring; that's enough to distinguish from arbitrary zips.
  const needle = Buffer.from("[Content_Types].xml", "utf-8");
  if (buffer.indexOf(needle) === -1) {
    return { ok: false, reason: "Not a valid DOCX (missing Office Open XML manifest).", kind: "invalid_format" };
  }
  return { ok: true };
}

export function sanitizeFilename(name: string): string {
  // strip path components — basename only
  const stripped = basename(name);
  // remove any null bytes & control chars
  const cleaned = stripped.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (!cleaned) return "document.docx";
  // ensure extension is .docx
  const ext = extname(cleaned).toLowerCase();
  if (ext !== ".docx") {
    return cleaned + ".docx";
  }
  return cleaned;
}

export function makeUniqueTempDir(): string {
  const dir = join(tmpdir(), `docura-${randomUUID()}`);
  return dir;
}

/* ------------------------------------------------------------------ */
/* PDF post-check                                                     */
/* ------------------------------------------------------------------ */

export interface PdfInfo {
  valid: boolean;
  pages: number | null;
}

/**
 * Validate the produced PDF by:
 *  1. Checking the magic header starts with `%PDF-`
 *  2. Counting `/Type /Page` occurrences (a reasonable page-count heuristic
 *     that does not require a full PDF parser). Returns null if it cannot
 *     be determined.
 */
export function inspectPdf(buffer: Buffer): PdfInfo {
  if (!buffer || buffer.length < 5) return { valid: false, pages: null };
  const header = buffer.slice(0, 5).toString("latin1");
  if (header !== "%PDF-") return { valid: false, pages: null };
  // Count occurrences of /Type /Page (not /Pages). This is best-effort; many
  // producers write /Type/Page without a space too, so we accept both.
  const text = buffer.toString("latin1");
  const re = /\/Type\s*\/Page(?!s)\b/g;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) count++;
  return { valid: true, pages: count > 0 ? count : null };
}

/* ------------------------------------------------------------------ */
/* The actual conversion                                              */
/* ------------------------------------------------------------------ */

/**
 * Clean up any stale LibreOffice lock files in a directory.
 * LibreOffice creates `.~lock.<filename>#` files next to the document
 * being converted. If a previous conversion crashed, these can persist
 * and cause the next attempt to fail.
 */
async function cleanupStaleLocks(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir);
    for (const entry of entries) {
      if (entry.startsWith(".~lock.") || entry.endsWith(".lock")) {
        try { await fs.unlink(join(dir, entry)); } catch {}
      }
    }
  } catch {
    // ignore — dir might not exist yet
  }
}

/**
 * A single conversion attempt. Returns the result; throws on internal
 * error so the retry loop can catch it.
 *
 * The buffer is written to a unique temp directory, soffice is invoked with
 * an isolated user profile, the resulting PDF is read back, validated, and
 * the temp directory is removed.
 */
async function attemptConversion(
  inputBuffer: Buffer,
  safeName: string,
  sofficeBin: string,
  opts?: { signal?: AbortSignal }
): Promise<ConversionResult> {
  const start = Date.now();
  const workDir = makeUniqueTempDir();
  const profileDir = makeUniqueTempDir();
  const inputPath = join(workDir, safeName);

  try {
    await fs.mkdir(workDir, { recursive: true });
    await fs.mkdir(profileDir, { recursive: true });
    await fs.writeFile(inputPath, inputBuffer);

    await new Promise<void>((resolveP, rejectP) => {
      const args = [
        "--headless",
        "--norestore",
        "--nolockcheck",
        "--nodefault",
        "--nofirststartwizard",
        `-env:UserInstallation=file://${profileDir}`,
        "--convert-to",
        "pdf:writer_pdf_Export",
        "--outdir",
        workDir,
        inputPath,
      ];
      const child = spawn(sofficeBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          HOME: profileDir,
          USERPROFILE: profileDir,
        },
      });

      let stderr = "";
      let stdout = "";
      child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

      const timer = setTimeout(() => {
        try { child.kill("SIGKILL"); } catch {}
        rejectP(Object.assign(new Error("Conversion timed out."), { kind: "timeout" }));
      }, CONVERSION_TIMEOUT_MS);

      const onAbort = () => {
        try { child.kill("SIGKILL"); } catch {}
        rejectP(Object.assign(new Error("Conversion cancelled."), { kind: "cancelled" as any }));
      };
      opts?.signal?.addEventListener("abort", onAbort, { once: true });

      child.on("error", (err) => {
        clearTimeout(timer);
        opts?.signal?.removeEventListener("abort", onAbort);
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          rejectP(Object.assign(
            new Error("Conversion failed. Please try again."),
            { kind: "engine_unavailable", internalError: `ENOENT spawning soffice at ${sofficeBin}: ${err.message}` }
          ));
        } else {
          rejectP(Object.assign(
            new Error("Conversion failed. Please try again."),
            { kind: "engine_unavailable", internalError: `Failed to launch soffice: ${err.message}` }
          ));
        }
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        opts?.signal?.removeEventListener("abort", onAbort);
        if (code === 0) {
          resolveP();
        } else {
          if (/encrypted|password/i.test(stderr)) {
            rejectP(Object.assign(new Error("This document is password-protected. Please remove the password and try again."), { kind: "encrypted" }));
          } else if (/no such file|not found/i.test(stderr)) {
            rejectP(Object.assign(new Error("Conversion failed. Please try again."), { kind: "engine_unavailable", internalError: `soffice stderr: ${stderr.slice(0, 300)}` }));
          } else if (/disk|space|enospc/i.test(stderr)) {
            rejectP(Object.assign(new Error("Conversion failed due to insufficient server space. Please try again later."), { kind: "disk_full" }));
          } else {
            rejectP(Object.assign(
              new Error("Conversion failed. Please try again."),
              { kind: "unknown", internalError: `exit ${code}: ${(stderr || stdout).slice(0, 300)}` }
            ));
          }
        }
      });
    });

    const outName = safeName.replace(/\.docx$/i, ".pdf");
    const outPath = join(workDir, outName);
    let outBuffer: Buffer;
    try {
      outBuffer = await fs.readFile(outPath);
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return {
          ok: false,
          outputName: outName,
          durationMs: Date.now() - start,
          inputSize: inputBuffer.length,
          outputSize: 0,
          pages: null,
          errorMessage: "Conversion failed. Please try again.",
          internalError: `Output PDF not produced at ${outPath}`,
          errorKind: "corrupted",
        };
      }
      throw err;
    }
    const info = inspectPdf(outBuffer);
    if (!info.valid) {
      return {
        ok: false,
        outputName: outName,
        durationMs: Date.now() - start,
        inputSize: inputBuffer.length,
        outputSize: outBuffer.length,
        pages: null,
        errorMessage: "Conversion failed. Please try again.",
        internalError: "Output did not have a valid %PDF- header.",
        errorKind: "unknown",
      };
    }

    return {
      ok: true,
      outputBuffer: outBuffer,
      outputName: outName,
      durationMs: Date.now() - start,
      inputSize: inputBuffer.length,
      outputSize: outBuffer.length,
      pages: info.pages,
    };
  } finally {
    try { await cleanupStaleLocks(workDir); } catch {}
    try { await fs.rm(workDir, { recursive: true, force: true }); } catch {}
    try { await fs.rm(profileDir, { recursive: true, force: true }); } catch {}
  }
}

/**
 * Convert a DOCX buffer to a real PDF buffer using LibreOffice headless.
 * Retries up to CONVERSION_RETRIES times on transient failures — each retry
 * uses a fresh temp directory and a fresh user profile to avoid stale state.
 */
export async function convertDocxToPdf(
  inputBuffer: Buffer,
  inputName: string,
  opts?: {
    signal?: AbortSignal;
    onProgress?: (stage: "validating" | "preparing" | "converting" | "verifying" | "done" | "failed") => void;
  }
): Promise<ConversionResult> {
  const start = Date.now();
  const onProgress = opts?.onProgress ?? (() => {});

  onProgress("validating");
  const validation = validateDocx(inputBuffer);
  if (!validation.ok) {
    return {
      ok: false,
      outputName: "",
      durationMs: Date.now() - start,
      inputSize: inputBuffer.length,
      outputSize: 0,
      pages: null,
      errorMessage: validation.reason,
      errorKind: validation.kind,
    };
  }

  if (inputBuffer.length > MAX_FILE_BYTES) {
    return {
      ok: false,
      outputName: "",
      durationMs: Date.now() - start,
      inputSize: inputBuffer.length,
      outputSize: 0,
      pages: null,
      errorMessage: `File exceeds the maximum allowed size (${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB).`,
      errorKind: "oversized",
    };
  }

  const sofficeBin = await resolveSofficeBin();
  if (!sofficeBin) {
    onProgress("failed");
    return {
      ok: false,
      outputName: "",
      durationMs: Date.now() - start,
      inputSize: inputBuffer.length,
      outputSize: 0,
      pages: null,
      errorMessage: "Conversion failed. Please try again.",
      internalError: "soffice binary not resolved via any candidate path.",
      errorKind: "engine_unavailable",
    };
  }

  const safeName = sanitizeFilename(inputName);

  // Retry loop — fresh temp dir + fresh profile per attempt.
  let lastError: ConversionResult | null = null;
  for (let attempt = 1; attempt <= CONVERSION_RETRIES; attempt++) {
    onProgress(attempt === 1 ? "preparing" : "converting");
    try {
      const result = await attemptConversion(inputBuffer, safeName, sofficeBin, { signal: opts?.signal });
      if (result.ok) {
        onProgress("done");
        return result;
      }
      // Don't retry on permanent errors — only retry on potentially-transient ones.
      const permanentKinds = ["invalid_format", "encrypted", "oversized"];
      if (permanentKinds.includes(result.errorKind || "")) {
        return result;
      }
      lastError = result;
      // Brief pause before retry to let any stale LibreOffice state clear.
      if (attempt < CONVERSION_RETRIES) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      const e = err as Error & { kind?: ConversionResult["errorKind"]; internalError?: string };
      const kind = e.kind ?? "unknown";
      let message = e.message || "Conversion failed. Please try again.";
      const internalError = e.internalError;
      if (kind === ("cancelled" as any)) {
        message = "Conversion was cancelled.";
      }
      if (kind === "timeout") {
        message = "Conversion is taking too long. Please try a smaller file or try again later.";
      }
      lastError = {
        ok: false,
        outputName: "",
        durationMs: Date.now() - start,
        inputSize: inputBuffer.length,
        outputSize: 0,
        pages: null,
        errorMessage: message,
        internalError: internalError ? `[attempt ${attempt}] ${internalError}` : undefined,
        errorKind: kind === ("cancelled" as any) ? "unknown" : kind,
      };
      // Don't retry on timeout or permanent errors
      if (kind === "timeout" || kind === "encrypted" || kind === "invalid_format" || kind === "oversized") {
        break;
      }
      if (attempt < CONVERSION_RETRIES) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  onProgress("failed");
  return lastError ?? {
    ok: false,
    outputName: "",
    durationMs: Date.now() - start,
    inputSize: inputBuffer.length,
    outputSize: 0,
    pages: null,
    errorMessage: "Conversion failed. Please try again.",
    errorKind: "unknown",
  };
}

/* ------------------------------------------------------------------ */
/* Health check                                                       */
/* ------------------------------------------------------------------ */

let cachedEngineStatus: { available: boolean; version: string | null; path: string | null; checkedAt: number } | null = null;
const ENGINE_CHECK_TTL = 30_000;

export async function checkEngine(): Promise<{ available: boolean; version: string | null; path: string | null }> {
  const now = Date.now();
  if (cachedEngineStatus && now - cachedEngineStatus.checkedAt < ENGINE_CHECK_TTL) {
    return { available: cachedEngineStatus.available, version: cachedEngineStatus.version, path: cachedEngineStatus.path };
  }
  const bin = await resolveSofficeBin();
  if (!bin) {
    cachedEngineStatus = { available: false, version: null, path: null, checkedAt: now };
    return { available: false, version: null, path: null };
  }
  try {
    const version = await new Promise<string>((resolveP, rejectP) => {
      const child = spawn(bin, ["--version"], {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      });
      let out = "";
      child.stdout?.on("data", (c: Buffer) => (out += c.toString()));
      child.on("error", rejectP);
      child.on("close", (code) => {
        if (code === 0) resolveP(out.trim());
        else rejectP(new Error(`exit ${code}`));
      });
    });
    cachedEngineStatus = { available: true, version, path: bin, checkedAt: now };
    return { available: true, version, path: bin };
  } catch {
    cachedEngineStatus = { available: false, version: null, path: bin, checkedAt: now };
    return { available: false, version: null, path: bin };
  }
}
