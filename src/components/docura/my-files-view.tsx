"use client";

import { useMemo } from "react";
import { FolderOpen, Download, Trash2, FileText, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHistory, HistoryEntry } from "@/lib/history-store";
import { useSettings } from "@/lib/settings-store";
import { useNav } from "@/lib/nav-store";
import { formatBytes, formatDuration } from "./use-file-upload";
import { toast } from "sonner";

export function MyFilesView() {
  const entries = useHistory((s) => s.entries);
  const clearOutputs = useHistory((s) => s.clearOutputs);
  const removeEntry = useHistory((s) => s.removeEntry);
  const privacy = useSettings((s) => s.privacy);
  const setPrivacy = useSettings((s) => s.setPrivacy);
  const setSection = useNav((s) => s.setSection);

  const stored = useMemo(
    () => entries.filter((e) => e.status === "success" && e.outputDataB64),
    [entries]
  );

  const totalSize = useMemo(() => stored.reduce((acc, e) => acc + (e.outputSize || 0), 0), [stored]);

  if (!privacy.storeOutputFiles) {
    return (
      <div className="flex-1 grid place-items-center p-6">
        <div className="text-center max-w-md">
          <div className="size-14 rounded-2xl bg-muted grid place-items-center mx-auto mb-3">
            <ShieldOff className="size-7 text-muted-foreground" />
          </div>
          <div className="text-[14px] font-medium mb-1">Persistent file storage is off</div>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
            By default, DOCURA does not keep converted PDFs on your device after the download. You can opt in
            to keep them here so you can re-download them later. Stored files live in your browser&apos;s
            localStorage and never leave your device.
          </p>
          <div className="flex items-center gap-2 justify-center">
            <Button
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => {
                setPrivacy({ storeOutputFiles: true });
                setSection("convert");
                toast.success("Persistent storage enabled", {
                  description: "Future conversions will be saved here.",
                });
              }}
            >
              Enable persistent storage
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setSection("settings")}
            >
              Open Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (stored.length === 0) {
    return (
      <div className="flex-1 grid place-items-center p-6">
        <div className="text-center max-w-md">
          <div className="size-14 rounded-2xl bg-muted grid place-items-center mx-auto mb-3">
            <FolderOpen className="size-7 text-muted-foreground" />
          </div>
          <div className="text-[14px] font-medium mb-1">No files yet</div>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
            Convert some documents and they&apos;ll appear here for re-download. Persistent storage is on.
          </p>
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setSection("convert")}>
            Convert a document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] py-1 px-2">
            {stored.length} file{stored.length === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline" className="text-[11px] py-1 px-2">
            {formatBytes(totalSize)} total
          </Badge>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-destructive hover:text-destructive text-[12px]" onClick={() => { clearOutputs(); toast.success("All stored PDFs cleared"); }}>
          <Trash2 className="size-3.5" /> Clear all
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stored.map((entry) => (
            <FileTile key={entry.id} entry={entry} onRemove={() => { removeEntry(entry.id); toast.success("File removed"); }} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function FileTile({ entry, onRemove }: { entry: HistoryEntry; onRemove: () => void }) {
  const date = new Date(entry.date);
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-gradient-to-br from-rose-500/15 to-amber-500/15 grid place-items-center shrink-0">
          <FileText className="size-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium truncate">{entry.outputName}</div>
          <div className="text-[10.5px] text-muted-foreground truncate">{entry.originalName}</div>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground grid grid-cols-2 gap-1">
        <span>Size: <span className="text-foreground tabular-nums">{formatBytes(entry.outputSize)}</span></span>
        <span>Pages: <span className="text-foreground tabular-nums">{entry.pages ?? "—"}</span></span>
        <span>Date: <span className="text-foreground">{date.toLocaleDateString()}</span></span>
        <span>Took: <span className="text-foreground tabular-nums">{formatDuration(entry.durationMs)}</span></span>
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <Button
          size="sm"
          className="h-8 flex-1 gap-1.5 text-[12px]"
          onClick={() => {
            if (!entry.outputDataB64) return;
            const b64 = entry.outputDataB64.split(",")[1];
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: "application/pdf" });
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
          <Download className="size-3.5" /> Download
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label="Remove file">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
