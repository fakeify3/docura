"use client";

import { Menu, PanelLeftClose, PanelLeft, Sun, Moon, Monitor, Github, Sparkles } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { useNav } from "@/lib/nav-store";
import { APP_DEFAULTS } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EngineBadge } from "./engine-badge";

interface HeaderProps {
  onMenuClick: () => void;
}

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  convert: { title: "Convert", subtitle: "Drop in a Word document. Customize. Download a beautiful PDF." },
  batch: { title: "Batch Conversion", subtitle: "Convert multiple DOCX files at once, with retries and ZIP export." },
  history: { title: "Conversion History", subtitle: "Recent conversions stored locally on this device." },
  files: { title: "My Files", subtitle: "PDF outputs you've chosen to keep on this device." },
  download: { title: "Download App", subtitle: "Take DOCURA with you — install the web app or download a desktop build." },
  settings: { title: "Settings", subtitle: "Personalize every aspect of DOCURA — themes, typography, defaults, privacy." },
  help: { title: "Help & About", subtitle: "Guides, privacy information, keyboard shortcuts, and release notes." },
};

export function Header({ onMenuClick }: HeaderProps) {
  const section = useNav((s) => s.section);
  const branding = useSettings((s) => s.branding);
  const mode = useSettings((s) => s.mode);
  const setMode = useSettings((s) => s.setMode);
  const collapsed = useSettings((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useSettings((s) => s.setSidebarCollapsed);
  const appName = branding.appName || APP_DEFAULTS.appName;

  const meta = SECTION_TITLES[section] ?? SECTION_TITLES.convert;

  return (
    <header className="sticky top-0 z-30 h-16 px-3 sm:px-5 flex items-center gap-3 glass-overlay border-b border-border/60">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden size-9"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex size-9"
        onClick={() => setSidebarCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
      </Button>

      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-semibold text-[15px] sm:text-[17px] tracking-tight truncate">{meta.title}</h1>
          <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-muted-foreground/70 px-1.5 py-0.5 rounded border border-border/60">
            {appName}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground truncate hidden sm:block">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <EngineBadge />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9" aria-label="Toggle theme">
              {mode === "dark" ? <Moon className="size-[18px]" /> : mode === "light" ? <Sun className="size-[18px]" /> : <Monitor className="size-[18px]" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Appearance</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setMode("light")}>
              <Sun className="size-4 mr-2" /> Light
              {mode === "light" && <span className="ml-auto text-xs">●</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("dark")}>
              <Moon className="size-4 mr-2" /> Dark
              {mode === "dark" && <span className="ml-auto text-xs">●</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("system")}>
              <Monitor className="size-4 mr-2" /> System
              {mode === "system" && <span className="ml-auto text-xs">●</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
