"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EngineStatus {
  available: boolean;
  version: string | null;
  engineName: string;
}

/**
 * Honest disclosure: shows the real status of the LibreOffice engine on
 * the server. The user always knows whether conversions will actually
 * succeed in this environment.
 */
export function EngineBadge() {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/engine-health")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setStatus(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ available: false, version: null, engineName: "LibreOffice" });
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={cn(
        "hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-[11.5px] font-medium transition-colors",
        loading && "border-border/60 bg-muted/40 text-muted-foreground",
        !loading && status?.available && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        !loading && !status?.available && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}
      title={
        loading
          ? "Checking conversion engine…"
          : status?.available
            ? `${status.engineName} ${status.version ?? ""} is available.`
            : "Conversion engine unavailable. Conversions will fail until LibreOffice is installed."
      }
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : status?.available ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <AlertTriangle className="size-3.5" />
      )}
      <span className="hidden lg:inline">
        {loading ? "Checking" : status?.available ? "Engine ready" : "Engine unavailable"}
      </span>
    </div>
  );
}
