"use client";

import { useCallback, useRef, useState, DragEvent } from "react";
import {
  Upload, FileText, X, RefreshCw, Download, Play, Loader2, CheckCircle2, FileWarning, Files, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversionSettingsPanel } from "./conversion-settings-panel";
import { DocxPreview } from "./docx-preview";
import { PdfPreview } from "./pdf-preview";
import {
  useFileUpload,
  convertFile,
  formatBytes,
  formatDuration,
  UploadFile,
} from "./use-file-upload";
import { useSettings } from "@/lib/settings-store";
import { useHistory } from "@/lib/history-store";
import { APP_DEFAULTS } from "@/lib/brand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STAGE_LABEL: Record<UploadFile["status"], string> = {
  queued: "Queued",
  validating: "Validating",
  preparing: "Preparing",
  converting: "Converting",
  verifying: "Verifying",
  success: "Completed",
  failed: "Failed",
};

export function ConvertWorkspace() {
  const upload = useFileUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const conversion = useSettings((s) => s.conversion);
  const privacy = useSettings((s) => s.privacy);
  const addHistory = useHistory((s) => s.addEntry);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      upload.addFiles(e.dataTransfer.files);
    },
    [upload]
  );

  const onConvert = useCallback(
    async (file: UploadFile) => {
      const controller = new AbortController();
      upload.updateFile(file.id, {
        status: "validating",
        progress: 5,
        startedAt: Date.now(),
        abortController: controller,
      });

      const result = await convertFile(
        file.file,
        (stage, progress) => {
          upload.updateFile(file.id, { status: stage, progress });
        },
        controller.signal
      );

      const endedAt = Date.now();
      const durationMs = result.durationMs ?? (endedAt - (file.startedAt ?? endedAt));

      if (result.ok && result.output) {
        upload.updateFile(file.id, {
          status: "success",
          progress: 100,
          output: result.output,
          outputName: result.outputName,
          outputSize: result.outputSize,
          durationMs,
          pages: result.pages,
          endedAt,
        });
        // add to history
        if (privacy.storeHistory) {
          addHistory({
            id: file.id,
            originalName: file.file.name,
            outputName: result.outputName || file.file.name.replace(/\.docx$/i, ".pdf"),
            date: new Date(endedAt).toISOString(),
            durationMs,
            inputSize: file.inputSize,
            outputSize: result.outputSize || 0,
            pages: result.pages ?? null,
            status: "success",
            settings: {
              pageSize: conversion.page.size,
              orientation: conversion.page.orientation,
              margin: conversion.page.margin,
              quality: conversion.quality,
            },
            // store the output blob if the user opted in
            outputDataB64: privacy.storeOutputFiles
              ? await blobToBase64(result.output)
              : undefined,
          });
        }
        if (conversion.autoDownload) {
          triggerDownload(result.output, result.outputName || "document.pdf");
        }
        toast.success("Conversion complete", {
          description: `${result.outputName} · ${formatBytes(result.outputSize)} · ${formatDuration(durationMs)}`,
        });
      } else {
        upload.updateFile(file.id, {
          status: "failed",
          progress: 0,
          errorMessage: result.errorMessage,
          errorKind: result.errorKind,
          errorDetail: result.errorDetail,
          endedAt,
        });
        if (privacy.storeHistory) {
          addHistory({
            id: file.id,
            originalName: file.file.name,
            outputName: file.file.name.replace(/\.docx$/i, ".pdf"),
            date: new Date(endedAt).toISOString(),
            durationMs,
            inputSize: file.inputSize,
            outputSize: 0,
            pages: null,
            status: "failed",
            errorMessage: result.errorMessage,
            settings: {
              pageSize: conversion.page.size,
              orientation: conversion.page.orientation,
              margin: conversion.page.margin,
              quality: conversion.quality,
            },
          });
        }
        toast.error("Conversion failed", { description: result.errorMessage });
      }
    },
    [upload, conversion, privacy, addHistory]
  );

  const onDownload = useCallback((file: UploadFile) => {
    if (!file.output || !file.outputName) return;
    triggerDownload(file.output, file.outputName);
  }, []);

  const onCancel = useCallback((file: UploadFile) => {
    file.abortController?.abort();
    upload.updateFile(file.id, { status: "queued", progress: 0 });
  }, [upload]);

  const files = upload.files;
  const activeFile = files.find((f) => f.id === activeId) ?? files[0] ?? null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Hero / dropzone (only when no files yet) */}
      {files.length === 0 ? (
        <div className="flex-1 overflow-auto scroll-thin">
          <HeroDropzone
            onPick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            dragOver={dragOver}
          />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] gap-0 overflow-hidden">
          {/* LEFT: file list */}
          <div className="flex flex-col min-h-0 border-r border-border/60 overflow-hidden">
            <div className="h-12 px-4 flex items-center gap-2 border-b border-border/60 shrink-0">
              <Files className="size-4 text-primary" />
              <h3 className="text-[13px] font-semibold">Files ({files.length})</h3>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5" onClick={() => inputRef.current?.click()}>
                <Upload className="size-3.5" /> Add more
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-[12px] text-muted-foreground" onClick={upload.clearAll}>
                Clear
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 space-y-2">
                {files.map((f) => (
                  <FileCard
                    key={f.id}
                    file={f}
                    active={activeFile?.id === f.id}
                    onClick={() => setActiveId(f.id)}
                    onConvert={() => onConvert(f)}
                    onRemove={() => upload.removeFile(f.id)}
                    onRetry={() => { upload.resetFile(f.id); onConvert({ ...f, status: "queued", progress: 0 }); }}
                    onCancel={() => onCancel(f)}
                    onDownload={() => onDownload(f)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* MIDDLE: preview pane */}
          <div className="flex flex-col min-h-0 border-r border-border/60 overflow-hidden">
            {activeFile ? (
              <>
                <div className="h-12 px-4 flex items-center gap-2 border-b border-border/60 shrink-0">
                  <Tabs
                    value={showPreview ? "pdf" : "docx"}
                    onChange={(v) => setShowPreview(v === "pdf")}
                    disabledDocx={!!activeFile.output}
                    hasOutput={!!activeFile.output}
                  />
                  <div className="flex-1" />
                  <div className="text-[11px] text-muted-foreground truncate max-w-[240px]">
                    {activeFile.file.name}
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {/* If conversion finished, show PDF preview; else show DOCX structure preview.
                      The key prop forces a fresh mount when the active file changes, which
                      resets the child's loading state without requiring synchronous setState
                      in an effect body. */}
                  {activeFile.output && showPreview ? (
                    <PdfPreview
                      key={`pdf-${activeFile.id}-${activeFile.outputSize ?? 0}`}
                      pdfBlob={activeFile.output}
                    />
                  ) : (
                    <DocxPreview
                      key={`docx-${activeFile.id}-${activeFile.inputSize}`}
                      file={activeFile.file}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 grid place-items-center text-muted-foreground text-[13px]">
                Select a file to preview
              </div>
            )}
          </div>

          {/* RIGHT: settings */}
          <div className="flex flex-col min-h-0 overflow-hidden bg-card/30">
            <ConversionSettingsPanel />
            <div className="p-4 border-t border-border/60 mt-auto">
              <Button
                className="w-full h-10 gap-2"
                disabled={!activeFile || ["converting", "preparing", "validating", "verifying"].includes(activeFile?.status || "")}
                onClick={() => activeFile && onConvert(activeFile)}
              >
                {activeFile && ["converting", "preparing", "validating", "verifying"].includes(activeFile.status) ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                {activeFile?.output ? "Convert again" : "Convert to PDF"}
              </Button>
              {activeFile?.output && (
                <Button
                  variant="outline"
                  className="w-full h-10 mt-2 gap-2"
                  onClick={() => onDownload(activeFile)}
                >
                  <Download className="size-4" />
                  Download PDF
                </Button>
              )}
              <p className="text-[10.5px] text-muted-foreground mt-3 text-center leading-snug">
                Conversion runs on our server via {APP_DEFAULTS.engine}.<br />
                Nothing to install — converted PDFs are not stored.
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        className="hidden"
        onChange={(e) => {
          upload.addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HeroDropzone({
  onPick, onDrop, onDragOver, onDragLeave, dragOver,
}: {
  onPick: () => void;
  onDrop: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  dragOver: boolean;
}) {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Hero copy */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-4">
          <CheckCircle2 className="size-3" />
          No install · No download · Works in your browser
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] mb-3">
          Drop a Word document.<br />
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Get a beautiful PDF.
          </span>
        </h1>
        <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed">
          DOCURA converts your <code className="text-[12px] px-1.5 py-0.5 rounded bg-muted">.docx</code> file to a real PDF
          right here in the browser. <span className="text-foreground font-medium">Upload → Convert → Download.</span> Nothing
          to install, nothing to download, no account required.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onClick={onPick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick(); }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
          "p-8 sm:p-12 lg:p-16 text-center grid place-items-center",
          "grid-bg grid-bg-fade",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/60 hover:bg-muted/30"
        )}
      >
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className={cn(
            "size-16 rounded-2xl grid place-items-center transition-all shadow-lg",
            dragOver
              ? "bg-primary text-primary-foreground scale-110 shadow-primary/30"
              : "bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-primary/20"
          )}>
            <Upload className="size-7" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[16px] font-semibold mb-1">
              {dragOver ? "Drop your DOCX here" : "Drag & drop your .docx file here"}
            </div>
            <div className="text-[12.5px] text-muted-foreground">
              or <span className="text-primary font-medium underline-offset-2 group-hover:underline">browse files</span> · up to {APP_DEFAULTS.maxFileSizeMB} MB · {APP_DEFAULTS.maxBatchFiles} files at once
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] font-normal">.docx input</Badge>
            <Badge variant="outline" className="text-[10px] font-normal">Real PDF output</Badge>
            <Badge variant="outline" className="text-[10px] font-normal border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">No install</Badge>
            <Badge variant="outline" className="text-[10px] font-normal border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">No signup</Badge>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <FeatureCard
          icon={CheckCircle2}
          title="No install needed"
          body="Upload your .docx, click Convert, download the PDF. Nothing to install or download on your device — the conversion runs on our server."
        />
        <FeatureCard
          icon={FileText}
          title="Real conversion"
          body="Powered by LibreOffice 25.2 headless — your .docx is genuinely transformed into a valid PDF, not renamed or screenshotted."
        />
        <FeatureCard
          icon={Sparkles}
          title="Premium & private"
          body="Pick page size, orientation, margins, and metadata. Files are processed and deleted — no permanent storage."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5">
      <div className="size-9 rounded-lg bg-primary/10 grid place-items-center text-primary mb-3">
        <Icon className="size-4.5" />
      </div>
      <div className="text-[13.5px] font-semibold mb-1">{title}</div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function FileCard({
  file, active, onClick, onConvert, onRemove, onRetry, onCancel, onDownload,
}: {
  file: UploadFile;
  active: boolean;
  onClick: () => void;
  onConvert: () => void;
  onRemove: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onDownload: () => void;
}) {
  const isBusy = ["validating", "preparing", "converting", "verifying"].includes(file.status);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyDetails = () => {
    if (!file.errorDetail) return;
    const text = `DOCURA conversion error report
File: ${file.file.name}
Size: ${file.inputSize} bytes
Kind: ${file.errorKind || "unknown"}
Detail: ${file.errorDetail}

Please share this text back so the conversion issue can be fixed.`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={cn(
        "rounded-xl border p-3.5 transition-all cursor-pointer",
        active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card/60 hover:bg-muted/40"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "size-10 rounded-lg grid place-items-center shrink-0",
          file.status === "success" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : file.status === "failed" ? "bg-destructive/15 text-destructive"
          : isBusy ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground"
        )}>
          {file.status === "success" ? <CheckCircle2 className="size-5" />
            : file.status === "failed" ? <FileWarning className="size-5" />
            : isBusy ? <Loader2 className="size-5 animate-spin" />
            : <FileText className="size-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[12.5px] font-medium truncate">{file.file.name}</div>
            <Badge variant="outline" className="text-[9px] py-0 px-1.5 shrink-0">
              {STAGE_LABEL[file.status]}
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {formatBytes(file.inputSize)}
            {file.outputSize != null && file.status === "success" && (
              <> · <span className="text-emerald-600 dark:text-emerald-400">→ {formatBytes(file.outputSize)}</span></>
            )}
            {file.pages != null && file.status === "success" && <> · {file.pages} page{file.pages === 1 ? "" : "s"}</>}
            {file.durationMs != null && (file.status === "success" || file.status === "failed") && <> · {formatDuration(file.durationMs)}</>}
          </div>
          {isBusy && (
            <div className="mt-2">
              <Progress value={file.progress} className="h-1.5" />
              <div className="text-[10px] text-muted-foreground mt-1">{file.progress}% · {STAGE_LABEL[file.status]}</div>
            </div>
          )}
          {file.status === "failed" && file.errorMessage && (
            <div className="mt-2">
              <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1.5 leading-snug">
                {file.errorMessage}
              </div>
              {file.errorDetail && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDetailsOpen(!detailsOpen); }}
                    className="text-[10.5px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    {detailsOpen ? "Hide details" : "Show details"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyDetails(); }}
                    className="text-[10.5px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    {copied ? "Copied ✓" : "Copy error report"}
                  </button>
                </div>
              )}
              {detailsOpen && file.errorDetail && (
                <pre className="mt-1.5 text-[10px] font-mono bg-muted/60 border border-border rounded px-2 py-1.5 overflow-x-auto scroll-thin text-muted-foreground whitespace-pre-wrap break-all">
                  {file.errorDetail}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {file.status === "queued" && (
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); onConvert(); }} aria-label="Convert">
              <Play className="size-3.5" />
            </Button>
          )}
          {isBusy && (
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); onCancel(); }} aria-label="Cancel">
              <X className="size-3.5" />
            </Button>
          )}
          {file.status === "failed" && (
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); onRetry(); }} aria-label="Retry">
              <RefreshCw className="size-3.5" />
            </Button>
          )}
          {file.status === "success" && (
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); onDownload(); }} aria-label="Download">
              <Download className="size-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Remove">
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Tabs({
  value, onChange, disabledDocx, hasOutput,
}: {
  value: "docx" | "pdf";
  onChange: (v: "docx" | "pdf") => void;
  disabledDocx: boolean;
  hasOutput: boolean;
}) {
  return (
    <div className="inline-flex p-0.5 rounded-lg bg-muted/60 text-[12px]">
      <button
        type="button"
        disabled={disabledDocx}
        onClick={() => onChange("docx")}
        className={cn(
          "px-3 h-7 rounded-md transition-colors disabled:opacity-50",
          value === "docx" ? "bg-card text-card-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Source
      </button>
      <button
        type="button"
        disabled={!hasOutput}
        onClick={() => onChange("pdf")}
        className={cn(
          "px-3 h-7 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          value === "pdf" ? "bg-card text-card-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
        )}
      >
        PDF
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
