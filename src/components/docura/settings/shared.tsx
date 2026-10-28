"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingGroup({
  title, icon: Icon, description, children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="size-7 rounded-md bg-primary/10 grid place-items-center text-primary shrink-0 mt-0.5">
          <Icon className="size-4" />
        </div>
        <div>
          <h3 className="text-[13.5px] font-semibold leading-tight">{title}</h3>
          {description && <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function SettingCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5 space-y-4", className)}>
      {children}
    </div>
  );
}

export function SettingRow({
  label, hint, children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium leading-tight">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
