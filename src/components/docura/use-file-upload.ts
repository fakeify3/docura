"use client";

import { useCallback, useState } from "react";

export interface UploadFile {
  id: string;
  file: File;
  status: "queued" | "validating" | "preparing" | "converting" | "verifying" | "success" | "failed";
  progress: number;
  errorMessage?: string;
  errorKind?: string;
  output?: Blob;
  outputName?: string;
  outputSize?: number;
  inputSize: number;
  durationMs?: number;
  pages?: number | null;
  startedAt?: number;
  endedAt?: number;
  abortController?: AbortController;
}

let counter = 0;
const nextId = () => `f${++counter}-${Date.now()}`;

export function useFileUpload() {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const addFiles = useCallback((incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const accepted: UploadFile[] = [];
    for (const f of arr) {
      const isDocx =
        f.name.toLowerCase().endsWith(".docx") ||
        f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (!isDocx) {
        // We still accept the file but mark it as failed with a clear reason;
        // never silently drop.
        accepted.push({
          id: nextId(),
          file: f,
          status: "failed",
          progress: 0,
          inputSize: f.size,
          errorKind: "invalid_format",
          errorMessage: "Only .docx files are supported.",
        });
        continue;
      }
      accepted.push({
        id: nextId(),
        file: f,
        status: "queued",
        progress: 0,
        inputSize: f.size,
      });
    }
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((p) => p.id === id);
      target?.abortController?.abort();
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const updateFile = useCallback((id: string, patch: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const clearAll = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((p) => p.abortController?.abort());
      return [];
    });
  }, []);

  const resetFile = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "queued",
              progress: 0,
              errorMessage: undefined,
              errorKind: undefined,
              output: undefined,
              outputName: undefined,
              outputSize: undefined,
              durationMs: undefined,
              pages: undefined,
              startedAt: undefined,
              endedAt: undefined,
              abortController: undefined,
            }
          : p
      )
    );
  }, []);

  return {
    files,
    setFiles,
    addFiles,
    removeFile,
    updateFile,
    clearAll,
    resetFile,
  };
}

/* ------------------------------------------------------------------ */
/* Conversion helper — wraps the /api/convert call                    */
/* ------------------------------------------------------------------ */

export async function convertFile(
  file: File,
  onStage: (stage: UploadFile["status"], progress: number) => void,
  signal?: AbortSignal
): Promise<{
  ok: boolean;
  output?: Blob;
  outputName?: string;
  outputSize?: number;
  durationMs?: number;
  pages?: number | null;
  errorMessage?: string;
  errorKind?: string;
}> {
  onStage("validating", 5);
  const fd = new FormData();
  fd.append("file", file);
  onStage("preparing", 12);
  try {
    onStage("converting", 35);
    const res = await fetch("/api/convert", {
      method: "POST",
      body: fd,
      signal,
    });
    if (!res.ok) {
      let body: { error?: string; kind?: string } = {};
      try { body = await res.json(); } catch {}
      return {
        ok: false,
        errorMessage: body?.error || `Conversion failed (HTTP ${res.status}).`,
        errorKind: body?.kind || "unknown",
      };
    }
    onStage("verifying", 90);
    const blob = await res.blob();
    const outputName = decodeURIComponent(res.headers.get("X-Output-Name") || "document.pdf");
    const durationMs = Number(res.headers.get("X-Duration-Ms") || 0);
    const outputSize = Number(res.headers.get("X-Output-Size") || blob.size);
    const pagesHeader = res.headers.get("X-Pages");
    const pages = pagesHeader === "" || pagesHeader == null ? null : Number(pagesHeader);

    if (!blob || blob.size === 0 || blob.type !== "application/pdf") {
      return {
        ok: false,
        errorMessage: "Server returned an empty or non-PDF response.",
        errorKind: "unknown",
      };
    }

    onStage("success", 100);
    return { ok: true, output: blob, outputName, outputSize, durationMs, pages };
  } catch (err) {
    const e = err as Error;
    if (e.name === "AbortError") {
      return { ok: false, errorMessage: "Conversion cancelled.", errorKind: "cancelled" };
    }
    return {
      ok: false,
      errorMessage: e.message || "Network error during conversion.",
      errorKind: "network",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Helper: format bytes                                                */
/* ------------------------------------------------------------------ */

export function formatBytes(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function formatDuration(ms: number | undefined | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
