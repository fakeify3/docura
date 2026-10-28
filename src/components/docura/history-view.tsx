"use client";

import { useState, useMemo } from "react";
import { History as HistoryIcon, Trash2, Search, Download, RefreshCw, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useHistory, HistoryEntry } from "@/lib/history-store";
import { useSettings } from "@/lib/settings-store";
import { formatBytes, formatDuration } from "./use-file-upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function HistoryView() {
  const entries = useHistory((s) => s.entries);
  const removeEntry = useHistory((s) => s.removeEntry);
  const clearAll = useHistory((s) => s.clear);
  const clearOutputs = useHistory((s) => s.clearOutputs);
  const privacy = useSettings((s) => s.privacy);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "success" | "failed">("all");
  const [sort, setSort] = useState<"date" | "size" | "duration">("date");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (!q) return true;
      return e.originalName.toLowerCase().includes(q) || e.outputName.toLowerCase().includes(q);
    });
    list.sort((a, b) => {
      if (sort === "size") return b.inputSize - a.inputSize;
      if (sort === "duration") return (b.durationMs ?? 0) - (a.durationMs ?? 0);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return list;
  }, [entries, query, status, sort]);

  const handleClear = () => {
    if (entries.length === 0) return;
    clearAll();
    toast.success("History cleared");
  };

  const handleClearOutputs = () => {
    clearOutputs();
    toast.success("Stored PDFs removed");
  };

  if (entries.length === 0) {
    return (
      <div className="flex-1 grid place-items-center p-6">
        <div className="text-center max-w-md">
          <div className="size-14 rounded-2xl bg-muted grid place-items-center mx-auto mb-3">
            <HistoryIcon className="size-7 text-muted-foreground" />
          </div>
          <div className="text-[14px] font-medium mb-1">No history yet</div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            After you convert a document, its metadata will appear here. Conversion metadata is stored locally
            on this device{privacy.storeOutputFiles ? ", and you have chosen to also store the resulting PDFs here." : " — converted PDFs are not stored unless you opt in."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b border-border/60">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="size-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history…"
            className="h-9 pl-8 text-[12.5px]"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="h-9 w-[130px] text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success only</SelectItem>
            <SelectItem value="failed">Failed only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="h-9 w-[140px] text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Newest first</SelectItem>
            <SelectItem value="size">Largest first</SelectItem>
            <SelectItem value="duration">Slowest first</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {privacy.storeOutputFiles && (
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[12px]" onClick={handleClearOutputs}>
              <Trash2 className="size-3.5" /> Clear PDFs
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[12px] text-destructive hover:text-destructive" onClick={handleClear}>
            <Trash2 className="size-3.5" /> Clear all
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-3">
          {/* table */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,80px)] gap-2 px-4 py-2.5 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border/60">
              <div>File</div>
              <div>Date</div>
              <div>Size</div>
              <div>Duration</div>
              <div>Pages</div>
              <div className="text-right">Actions</div>
            </div>
            <ul>
              {filtered.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} onRemove={() => removeEntry(entry.id)} />
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                  No entries match your search.
                </li>
              )}
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function HistoryRow({ entry, onRemove }: { entry: HistoryEntry; onRemove: () => void }) {
  const date = new Date(entry.date);
  const dateStr = date.toLocaleString();
  return (
    <li className="grid md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,80px)] gap-2 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors items-center">
      {/* File */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn(
          "size-7 rounded-md grid place-items-center shrink-0",
          entry.status === "success" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        )}>
          {entry.status === "success" ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-medium truncate">{entry.originalName}</div>
          <div className="text-[10px] text-muted-foreground truncate">→ {entry.outputName}</div>
        </div>
      </div>

      <div className="text-[11.5px] text-muted-foreground tabular-nums">{dateStr}</div>
      <div className="text-[11.5px] text-muted-foreground tabular-nums">
        {formatBytes(entry.inputSize)}
        {entry.outputSize > 0 && entry.status === "success" && (
          <span className="block text-[10px]">→ {formatBytes(entry.outputSize)}</span>
        )}
      </div>
      <div className="text-[11.5px] text-muted-foreground tabular-nums">{formatDuration(entry.durationMs)}</div>
      <div className="text-[11.5px] text-muted-foreground tabular-nums">{entry.pages ?? "—"}</div>

      <div className="flex items-center justify-end gap-1">
        {entry.outputDataB64 && entry.status === "success" && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Download stored PDF"
            onClick={() => {
              const b64 = entry.outputDataB64!.split(",")[1];
              const mime = entry.outputDataB64!.split(",")[0].match(/:(.*?);/)?.[1] || "application/pdf";
              const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
              const blob = new Blob([bytes], { type: mime });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = entry.outputName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            <Download className="size-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label="Remove entry">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}
