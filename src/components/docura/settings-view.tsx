"use client";

import { useState } from "react";
import {
  Palette, Type, Building2, Settings2, Shield, Accessibility, Info, Save, RotateCcw, Search, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings } from "@/lib/settings-store";
import { AppearanceSettings } from "./settings/appearance-settings";
import { FontPlaygroundSettings } from "./settings/font-playground-settings";
import { BrandingSettingsPanel } from "./settings/branding-settings";
import { ConversionDefaultsPanel } from "./settings/conversion-defaults-panel";
import { PrivacySettingsPanel } from "./settings/privacy-settings-panel";
import { AccessibilitySettingsPanel } from "./settings/accessibility-settings-panel";
import { AboutPanel } from "./settings/about-panel";
import { DownloadPanel } from "./settings/download-panel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "fonts", label: "Fonts", icon: Type },
  { id: "branding", label: "Branding", icon: Building2 },
  { id: "conversion", label: "Conversion Defaults", icon: Settings2 },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "download", label: "Download App", icon: Download },
  { id: "about", label: "About", icon: Info },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function SettingsView() {
  const [active, setActive] = useState<TabId>("appearance");
  const [query, setQuery] = useState("");
  const settings = useSettings();

  const filteredTabs = TABS.filter((t) =>
    query ? t.label.toLowerCase().includes(query.toLowerCase()) : true
  );

  const handleSave = () => {
    // settings auto-persist via Zustand persist middleware
    toast.success("Settings saved", {
      description: "Your preferences will persist across refreshes.",
    });
  };

  const handleReset = () => {
    settings.resetAll();
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-border/60 bg-sidebar/50">
        <div className="p-3 border-b border-border/60">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings…"
              className="h-9 pl-8 text-[12.5px]"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <nav className="p-2 space-y-1">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 h-9 rounded-md text-[12.5px] font-medium transition-colors text-left",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="p-3 border-t border-border/60 space-y-2">
          <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-[12px]" onClick={handleReset}>
            <RotateCcw className="size-3.5" /> Reset to defaults
          </Button>
          <Button size="sm" className="w-full h-8 gap-1.5 text-[12px]" onClick={handleSave}>
            <Save className="size-3.5" /> Save
          </Button>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="md:hidden absolute top-16 left-0 right-0 z-20 flex border-b border-border bg-background overflow-x-auto scroll-thin">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={cn(
              "px-3 h-10 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors",
              active === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden pt-10 md:pt-0">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            {active === "appearance" && <AppearanceSettings />}
            {active === "fonts" && <FontPlaygroundSettings />}
            {active === "branding" && <BrandingSettingsPanel />}
            {active === "conversion" && <ConversionDefaultsPanel />}
            {active === "privacy" && <PrivacySettingsPanel />}
            {active === "accessibility" && <AccessibilitySettingsPanel />}
            {active === "download" && <DownloadPanel />}
            {active === "about" && <AboutPanel />}

            <div className="flex items-center justify-end gap-2 pt-6 mt-6 border-t border-border/40">
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleReset}>
                <RotateCcw className="size-3.5" /> Reset
              </Button>
              <Button size="sm" className="h-9 gap-1.5" onClick={handleSave}>
                <Save className="size-3.5" /> Save changes
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
