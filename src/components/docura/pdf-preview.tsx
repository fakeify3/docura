"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Maximize2, Minimize, Loader2, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

// pdfjs-dist is loaded lazily on the client only.
type PdfJsLib = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJsLib> | null = null;
async function loadPdfJs(): Promise<PdfJsLib> {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = (async () => {
    const pdfjs = await import("pdfjs-dist");
    // Use the worker as a URL — pdfjs-dist ships a `pdf.worker.min.mjs` in /build
    const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.toString();
    return pdfjs;
  })();
  return pdfjsPromise;
}

interface PdfPreviewProps {
  pdfBlob: Blob;
  className?: string;
}

export function PdfPreview({ pdfBlob, className }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<Awaited<ReturnType<import("pdfjs-dist").getDocument>["promise"]> | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.2);
  const [fit, setFit] = useState<"actual" | "width" | "page">("actual");
  // The parent passes a `key` so we remount fresh when the blob changes;
  // loading is derived from "no pdf and no error".
  const loading = pdfDoc === null && error === null;

  // Load the PDF document
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const buf = await pdfBlob.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotal(doc.numPages);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || "Failed to load PDF.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfBlob]);

  // Render the current page
  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;
    (async () => {
      if (!pdfDoc || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      try {
        const p = await pdfDoc.getPage(page);
        if (cancelled) return;
        // Fit-to-width override
        let renderScale = scale;
        if (fit === "width" && containerRef.current) {
          const viewport0 = p.getViewport({ scale: 1 });
          renderScale = containerRef.current.clientWidth / viewport0.width;
        }
        const viewport = p.getViewport({ scale: renderScale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        // background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderTask = p.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, page, scale, fit]);

  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(() => setPage((p) => Math.min(total, p + 1)), [total]);
  const zoomIn = useCallback(() => { setFit("actual"); setScale((s) => Math.min(3, s + 0.2)); }, []);
  const zoomOut = useCallback(() => { setFit("actual"); setScale((s) => Math.max(0.4, s - 0.2)); }, []);
  const fitWidth = useCallback(() => setFit("width"), []);
  const fitPage = useCallback(() => { setFit("actual"); setScale(1); }, []);

  return (
    <div className={cn("flex flex-col h-full bg-muted/30", className)}>
      {/* Toolbar */}
      <div className="h-10 px-2 flex items-center gap-1 border-b border-border/60 bg-card/60 shrink-0">
        <Button variant="ghost" size="icon" className="size-8" onClick={goPrev} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-[12px] text-muted-foreground tabular-nums px-1 min-w-[60px] text-center">
          {loading ? "…" : `${page} / ${total || 0}`}
        </div>
        <Button variant="ghost" size="icon" className="size-8" onClick={goNext} disabled={page >= total} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="size-8" onClick={zoomOut} aria-label="Zoom out">
          <ZoomOut className="size-4" />
        </Button>
        <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="size-8" onClick={zoomIn} aria-label="Zoom in">
          <ZoomIn className="size-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="ghost" size="sm" className="h-8 text-[12px] gap-1.5" onClick={fitWidth}>
          <Maximize className="size-3.5" /> Fit width
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-[12px] gap-1.5" onClick={fitPage}>
          <Minimize className="size-3.5" /> Fit page
        </Button>
        <div className="flex-1" />
        {total > 0 && (
          <span className="text-[11px] text-muted-foreground pr-2">{total} page{total === 1 ? "" : "s"}</span>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-auto scroll-thin grid place-items-start justify-center p-4 sm:p-6">
        {loading ? (
          <div className="w-full max-w-[640px] aspect-[1/1.414] rounded-lg bg-muted/60 animate-pulse" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground py-12">
            <FileWarning className="size-8 text-amber-500" />
            <div className="text-[13px]">{error}</div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="bg-white shadow-xl shadow-black/10 rounded-sm"
            style={{ width: "auto", height: "auto" }}
          />
        )}
      </div>
    </div>
  );
}
