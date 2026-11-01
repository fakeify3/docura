"use client";

import { useCallback, useState, useRef, DragEvent } from "react";
import {
  Upload, Loader2, CheckCircle2, AlertTriangle, RefreshCw, Download, Play, X, FileText, Files, Package, Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import JSZip from "jszip";
import { cn } from "@/lib/utils";

export function BatchWorkspace() {
  const upload = useFileUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const conversion = useSettings((s) => s.conversion);
  const privacy = useSettings((s) => s.privacy);
  const addHistory = useHistory((s) => s.addEntry);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    upload.addFiles(e.dataTransfer.files);
  }, [upload]);

  const processBatch = useCallback(async () => {
    const queued = upload.files.filter((f) => f.status === "queued" || f.status === "failed");
    if (queued.length === 0) {
      toast.info("Nothing to convert", { description: "Add files first." });
      return;
    }
    setIsProcessing(true);
    // process up to N at a time, but here we go sequentially with a small queue
    const concurrency = Math.max(1, Math.min(APP_DEFAULTS.maxConcurrentConversions, 2));
    let index = 0;
    const next = async (): Promise<void> => {
      while (index < queued.length) {
        const myIdx = index++;
        const f = queued[myIdx];
        const controller = new AbortController();
        upload.updateFile(f.id, { status: "validating", progress: 5, startedAt: Date.now(), abortController: controller, errorMessage: undefined, errorKind: undefined });
        const result = await convertFile(f.file, (stage, progress) => {
          upload.updateFile(f.id, { status: stage, progress });
        }, controller.signal);
        const endedAt = Date.now();
        const durationMs = result.durationMs ?? (endedAt - (f.startedAt ?? endedAt));
        if (result.ok && result.output) {
          upload.updateFile(f.id, {
            status: "success", progress: 100, output: result.output, outputName: result.outputName,
            outputSize: result.outputSize, durationMs, pages: result.pages, endedAt,
          });
          if (privacy.storeHistory) {
            addHistory({
              id: f.id, originalName: f.file.name,
              outputName: result.outputName || f.file.name.replace(/\.docx$/i, ".pdf"),
              date: new Date(endedAt).toISOString(), durationMs,
              inputSize: f.inputSize, outputSize: result.outputSize || 0, pages: result.pages ?? null,
              status: "success",
              settings: { pageSize: conversion.page.size, orientation: conversion.page.orientation, margin: conversion.page.margin, quality: conversion.quality },
            });
          }
        } else {
          upload.updateFile(f.id, { status: "failed", progress: 0, errorMessage: result.errorMessage, errorKind: result.errorKind, errorDetail: result.errorDetail, endedAt });
          if (privacy.storeHistory) {
            addHistory({
              id: f.id, originalName: f.file.name,
              outputName: f.file.name.replace(/\.docx$/i, ".pdf"),
              date: new Date(endedAt).toISOString(), durationMs,
              inputSize: f.inputSize, outputSize: 0, pages: null,
              status: "failed", errorMessage: result.errorMessage,
              settings: { pageSize: conversion.page.size, orientation: conversion.page.orientation, margin: conversion.page.margin, quality: conversion.quality },
            });
          }
        }
      }
    };
    // run workers
    await Promise.all(Array.from({ length: concurrency }, next));
    setIsProcessing(false);
    const okCount = upload.files.filter((f) => f.status === "success").length;
    const failCount = upload.files.filter((f) => f.status === "failed").length;
    if (failCount > 0) {
      toast.warning(`Batch finished with ${failCount} failure${failCount === 1 ? "" : "s"}`, {
        description: `${okCount} succeeded, ${failCount} failed.`,
      });
    } else {
      toast.success("Batch complete", { description: `${okCount} file${okCount === 1 ? "" : "s"} converted.` });
    }
  }, [upload, conversion, privacy, addHistory]);

  const downloadAllZip = useCallback(async () => {
    const ok = upload.files.filter((f) => f.status === "success" && f.output && f.outputName);
    if (ok.length === 0) return;
    const zip = new JSZip();
    const used = new Set<string>();
    for (const f of ok) {
      let name = f.outputName!;
      // avoid collisions
      if (used.has(name)) {
        const parts = name.split(".");
        const base = parts.slice(0, -1).join(".");
        const ext = parts[parts.length - 1] || "pdf";
        let n = 1;
        while (used.has(`${base} (${n}).${ext}`)) n++;
        name = `${base} (${n}).${ext}`;
      }
      used.add(name);
      const buf = await f.output!.arrayBuffer();
      zip.file(name, buf);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docura-batch-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("ZIP downloaded", { description: `${ok.length} file${ok.length === 1 ? "" : "s"} included.` });
  }, [upload]);

  const onConvertOne = useCallback(async (file: UploadFile) => {
    setIsProcessing(true);
    const controller = new AbortController();
    upload.updateFile(file.id, { status: "validating", progress: 5, startedAt: Date.now(), abortController: controller });
    const result = await convertFile(file.file, (stage, progress) => {
      upload.updateFile(file.id, { status: stage, progress });
    }, controller.signal);
    const endedAt = Date.now();
    const durationMs = result.durationMs ?? (endedAt - (file.startedAt ?? endedAt));
    if (result.ok && result.output) {
      upload.updateFile(file.id, { status: "success", progress: 100, output: result.output, outputName: result.outputName, outputSize: result.outputSize, durationMs, pages: result.pages, endedAt });
    } else {
      upload.updateFile(file.id, { status: "failed", progress: 0, errorMessage: result.errorMessage, errorKind: result.errorKind, errorDetail: result.errorDetail, endedAt });
    }
    setIsProcessing(false);
  }, [upload]);

  const stats = {
    total: upload.files.length,
    success: upload.files.filter((f) => f.status === "success").length,
    failed: upload.files.filter((f) => f.status === "failed").length,
    processing: upload.files.filter((f) => ["validating", "preparing", "converting", "verifying"].includes(f.status)).length,
    queued: upload.files.filter((f) => f.status === "queued").length,
  };
  const overallProgress = stats.total === 0 ? 0 : Math.round(((stats.success + stats.failed) / stats.total) * 100);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Dropzone (compact) */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "m-4 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/30"
        )}
      >
        <Upload className="size-5 mx-auto mb-1 text-primary" />
        <div className="text-[13px] font-medium">
          {dragOver ? "Drop your DOCX files here" : "Drag & drop multiple .docx files"}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          or click to browse · up to {APP_DEFAULTS.maxBatchFiles} files · max {APP_DEFAULTS.maxFileSizeMB} MB each
        </div>
      </div>

      {upload.files.length > 0 && (
        <>
          {/* Batch controls + stats */}
          <div className="px-4 pb-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[11px] py-1 px-2">
                <Files className="size-3 mr-1" /> {stats.total} total
              </Badge>
              {stats.success > 0 && (
                <Badge variant="outline" className="text-[11px] py-1 px-2 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="size-3 mr-1" /> {stats.success} done
                </Badge>
              )}
              {stats.failed > 0 && (
                <Badge variant="outline" className="text-[11px] py-1 px-2 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  <AlertTriangle className="size-3 mr-1" /> {stats.failed} failed
                </Badge>
              )}
              {stats.processing > 0 && (
                <Badge variant="outline" className="text-[11px] py-1 px-2 text-primary border-primary/30">
                  <Loader2 className="size-3 mr-1 animate-spin" /> {stats.processing} running
                </Badge>
              )}
              {stats.queued > 0 && (
                <Badge variant="outline" className="text-[11px] py-1 px-2 text-muted-foreground">
                  {stats.queued} queued
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-[200px] max-w-[400px]">
              <Progress value={overallProgress} className="h-2" />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={upload.clearAll} disabled={isProcessing}>
                <X className="size-3.5" /> Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                disabled={stats.success === 0}
                onClick={downloadAllZip}
              >
                <Package className="size-3.5" /> Download ZIP
              </Button>
              <Button
                size="sm"
                className="h-9 gap-1.5"
                disabled={isProcessing || stats.queued + stats.failed === 0}
                onClick={processBatch}
              >
                {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                Convert all
              </Button>
            </div>
          </div>

          {/* File list */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 pb-6 space-y-2">
              {upload.files.map((f) => (
                <BatchFileRow
                  key={f.id}
                  file={f}
                  onRemove={() => upload.removeFile(f.id)}
                  onRetry={() => { upload.resetFile(f.id); onConvertOne({ ...f, status: "queued", progress: 0 }); }}
                  onDownload={() => {
                    if (f.output && f.outputName) {
                      const url = URL.createObjectURL(f.output);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = f.outputName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {upload.files.length === 0 && (
        <div className="flex-1 grid place-items-center p-6">
          <div className="text-center max-w-md">
            <div className="size-14 rounded-2xl bg-muted grid place-items-center mx-auto mb-3">
              <Package className="size-7 text-muted-foreground" />
            </div>
            <div className="text-[14px] font-medium mb-1">No files in your batch yet</div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Add multiple .docx files above to convert them together. Each file is processed independently —
              one failure won&apos;t break the rest. Download all results as a single ZIP.
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        className="hidden"
        onChange={(e) => { upload.addFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

function BatchFileRow({
  file, onRemove, onRetry, onDownload,
}: {
  file: UploadFile;
  onRemove: () => void;
  onRetry: () => void;
  onDownload: () => void;
}) {
  const isBusy = ["validating", "preparing", "converting", "verifying"].includes(file.status);
  return (
    <div className={cn(
      "rounded-lg border p-3 flex items-center gap-3 transition-colors",
      file.status === "success" ? "border-emerald-500/30 bg-emerald-500/5"
      : file.status === "failed" ? "border-amber-500/30 bg-amber-500/5"
      : isBusy ? "border-primary/30 bg-primary/5"
      : "border-border bg-card/40"
    )}>
      <div className={cn(
        "size-9 rounded-md grid place-items-center shrink-0",
        file.status === "success" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        : file.status === "failed" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : isBusy ? "bg-primary/15 text-primary"
        : "bg-muted text-muted-foreground"
      )}>
        {file.status === "success" ? <CheckCircle2 className="size-4" />
          : file.status === "failed" ? <AlertTriangle className="size-4" />
          : isBusy ? <Loader2 className="size-4 animate-spin" />
          : <FileText className="size-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium truncate">{file.file.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {formatBytes(file.inputSize)}
          {file.outputSize != null && file.status === "success" && <> · → {formatBytes(file.outputSize)}</>}
          {file.pages != null && file.status === "success" && <> · {file.pages}p</>}
          {file.durationMs != null && (file.status === "success" || file.status === "failed") && <> · {formatDuration(file.durationMs)}</>}
        </div>
        {isBusy && <Progress value={file.progress} className="h-1 mt-1.5" />}
        {file.status === "failed" && file.errorMessage && (
          <div className="text-[10.5px] text-amber-700 dark:text-amber-400 mt-1 leading-snug truncate" title={file.errorMessage}>
            {file.errorMessage}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {file.status === "success" && (
          <Button variant="ghost" size="icon" className="size-8" onClick={onDownload} aria-label="Download">
            <Download className="size-4" />
          </Button>
        )}
        {file.status === "failed" && (
          <Button variant="ghost" size="icon" className="size-8" onClick={onRetry} aria-label="Retry">
            <RefreshCw className="size-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label="Remove">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
