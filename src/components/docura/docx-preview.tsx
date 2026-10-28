"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, Table, Image as ImageIcon, Heading, Loader2, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocxPreviewData {
  ok: boolean;
  fileName: string;
  fileSize: number;
  html?: string;
  text?: string;
  paragraphCount?: number;
  tableCount?: number;
  imageCount?: number;
  headingCount?: number;
  messages?: { type: string; message: string }[];
  error?: string;
}

interface DocxPreviewProps {
  file: File;
  className?: string;
}

/**
 * Renders a structural preview of the DOCX before conversion.
 *
 * Important: this is NOT a pixel-perfect rendering of the source document
 * and is NOT a rendering of the final PDF. We extract structural info
 * (paragraphs, tables, images, headings) via mammoth on the server and
 * render a sanitized subset to the page. The user is explicitly told this
 * is a structure preview, not the final PDF.
 */
export function DocxPreview({ file, className }: DocxPreviewProps) {
  // The parent passes a `key` so we remount fresh when the file changes,
  // avoiding synchronous setState in effect.
  const [data, setData] = useState<DocxPreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = data === null && error === null;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fd = new FormData();
    fd.append("file", file);

    fetch("/api/docx-preview", { method: "POST", body: fd })
      .then(async (r) => {
        const j = (await r.json()) as DocxPreviewData;
        if (cancelled) return;
        if (!j.ok) setError(j.error || "Failed to preview document.");
        else setData(j);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Network error.");
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className={cn("flex flex-col h-full bg-muted/30", className)}>
      <div className="h-10 px-3 flex items-center gap-2 border-b border-border/60 bg-card/60 shrink-0">
        <FileText className="size-3.5 text-primary" />
        <span className="text-[12px] font-medium">Document structure preview</span>
        <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10">
          Not the final PDF
        </span>
      </div>

      {loading ? (
        <div className="flex-1 grid place-items-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            <div className="text-[12px]">Analyzing document…</div>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 grid place-items-center p-6">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <FileWarning className="size-8 text-amber-500" />
            <div className="text-[13px] font-medium">Preview not available</div>
            <div className="text-[12px] text-muted-foreground">{error}</div>
            <div className="text-[11px] text-muted-foreground/80">
              You can still convert this file — the preview is informational only.
            </div>
          </div>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Stats strip */}
          <div className="px-3 py-2 grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border/60 bg-card/40">
            <Stat icon={Heading} label="Headings" value={data.headingCount} />
            <Stat icon={FileText} label="Paragraphs" value={data.paragraphCount} />
            <Stat icon={Table} label="Tables" value={data.tableCount} />
            <Stat icon={ImageIcon} label="Images" value={data.imageCount} />
          </div>

          {/* Rendered structure */}
          <div ref={scrollRef} className="flex-1 overflow-auto scroll-thin p-3 sm:p-4">
            <div className="mx-auto max-w-[768px] bg-card text-card-foreground rounded-md border border-border/60 shadow-sm p-6 sm:p-8 prose-docura">
              {data.html ? (
                <div
                  className="text-[12.5px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.html) }}
                />
              ) : (
                <pre className="text-[11px] whitespace-pre-wrap font-mono">{data.text}</pre>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-7 rounded-md bg-primary/10 grid place-items-center text-primary">
        <Icon className="size-3.5" />
      </div>
      <div>
        <div className="text-[14px] font-semibold tabular-nums leading-tight">{value ?? 0}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

/**
 * Conservative sanitizer: strips <script>, <style>, on*=, javascript: URLs,
 * and event-handler attributes from mammoth-produced HTML. The HTML produced
 * by mammoth is already fairly safe (no scripts), but we harden it to be
 * safe against unexpected content.
 */
function sanitizeHtml(html: string): string {
  // remove <script> and <style> blocks
  let out = html.replace(/<\s*(script|style)[\s\S]*?<\/\s*\1\s*>/gi, "");
  // remove on*= handlers
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // remove javascript: URLs
  out = out.replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '$1=""');
  // allow only a safe subset of tags - leave others alone but neutralize iframes
  out = out.replace(/<\s*iframe[\s\S]*?>/gi, "<iframe data-blocked>");
  return out;
}
