"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EngineStatus {
  available: boolean;
  version: string | null;
  path: string | null;
  engineName: string;
}

/**
 * Engine status badge — only shows when something is actually wrong.
 * When conversion is working normally, this component renders nothing.
 * Users never see "install LibreOffice" or any technical detail.
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
          setStatus({ available: false, version: null, path: null, engineName: "LibreOffice" });
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide completely while loading OR when everything is working.
  // The badge only appears if conversion is actually broken — and even then
  // it just says "temporarily unavailable", never "install LibreOffice".
  if (loading || status?.available) return null;

  return (
    <div
      className={cn(
        "hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-[11.5px] font-medium transition-colors",
        "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}
      title="Temporarily unavailable — please try again"
    >
      <AlertTriangle className="size-3.5" />
      <span className="hidden lg:inline">Temporarily unavailable</span>
    </div>
  );
}
