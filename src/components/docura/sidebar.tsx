"use client";

import { FileText, Layers, History, FolderOpen, Download, Settings, LifeBuoy, Sparkles } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useSettings } from "@/lib/settings-store";
import { APP_DEFAULTS } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { APP_VERSION_LABEL } from "@/lib/build-info";

const NAV_ITEMS = [
  { id: "convert" as const, label: "Convert", icon: FileText },
  { id: "batch" as const, label: "Batch Conversion", icon: Layers },
  { id: "history" as const, label: "History", icon: History },
  { id: "files" as const, label: "My Files", icon: FolderOpen },
  { id: "download" as const, label: "Download App", icon: Download },
  { id: "settings" as const, label: "Settings", icon: Settings },
  { id: "help" as const, label: "Help & About", icon: LifeBuoy },
];

interface SidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const { section, setSection } = useNav();
  const branding = useSettings((s) => s.branding);
  const appName = branding.appName || APP_DEFAULTS.appName;

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 overflow-hidden",
        collapsed ? "w-[72px]" : "w-[248px]"
      )}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center shadow-lg shadow-primary/20 shrink-0">
            <Sparkles className="size-5 text-white" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-[15px] tracking-tight truncate">{appName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{APP_VERSION_LABEL}</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scroll-thin px-2 py-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    onNavigate?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group w-full flex items-center gap-3 px-3 h-10 rounded-lg text-[13.5px] font-medium transition-all relative",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                  )}
                  <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} strokeWidth={2} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer status */}
      {!collapsed && (
        <div className="px-3 pb-4 pt-3 border-t border-sidebar-border shrink-0">
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <div className="font-medium text-sidebar-foreground mb-0.5">{APP_DEFAULTS.engine}</div>
            <div>Local processing · Privacy-conscious</div>
          </div>
        </div>
      )}
    </aside>
  );
}
