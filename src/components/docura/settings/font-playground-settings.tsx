"use client";

import { Type } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSettings, FontId } from "@/lib/settings-store";
import { SettingRow, SettingCard, SettingGroup } from "./shared";
import { cn } from "@/lib/utils";

const FONTS: { id: FontId; label: string; family: string }[] = [
  { id: "geist", label: "Geist Sans", family: "var(--font-geist-sans)" },
  { id: "inter", label: "Inter", family: "Inter, system-ui, sans-serif" },
  { id: "manrope", label: "Manrope", family: "Manrope, system-ui, sans-serif" },
  { id: "system", label: "System default", family: "system-ui, -apple-system, sans-serif" },
];

export function FontPlaygroundSettings() {
  const fontId = useSettings((s) => s.fontId);
  const setFontId = useSettings((s) => s.setFontId);
  const fontSize = useSettings((s) => s.fontSize);
  const setFontSize = useSettings((s) => s.setFontSize);
  const branding = useSettings((s) => s.branding);
  const appName = branding.appName;

  const activeFont = FONTS.find((f) => f.id === fontId) || FONTS[0];

  return (
    <div className="space-y-6">
      <SettingGroup title="Font family" icon={Type} description="Pick the typeface used across the entire DOCURA interface.">
        <SettingCard>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontId(f.id)}
                style={{ fontFamily: f.family }}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  fontId === f.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/30"
                )}
              >
                <div className="text-[16px] font-semibold leading-tight" style={{ fontFamily: f.family }}>Aa</div>
                <div className="text-[11px] text-muted-foreground mt-1" style={{ fontFamily: f.family }}>{f.label}</div>
              </button>
            ))}
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Font size" icon={Type} description="Scale the base font size — affects everything from headings to body.">
        <SettingCard>
          <SettingRow label="Base font size" hint={`${fontSize}px — preview updates live.`}>
            <div className="w-[220px] flex items-center gap-3">
              <Slider
                value={[fontSize]}
                onValueChange={(v) => setFontSize(v[0])}
                min={12}
                max={18}
                step={1}
                className="flex-1"
              />
              <span className="text-[12px] text-muted-foreground tabular-nums w-[44px] text-right">{fontSize}px</span>
            </div>
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Typography playground" icon={Type} description="See how the chosen font looks across every part of the interface.">
        <SettingCard>
          <div style={{ fontFamily: activeFont.family }} className="space-y-4">
            {/* Headings */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Headings</div>
              <div className="text-2xl font-semibold tracking-tight leading-tight" style={{ fontFamily: activeFont.family }}>
                {appName} converts documents beautifully
              </div>
              <div className="text-[16px] font-medium mt-1" style={{ fontFamily: activeFont.family }}>
                Subsection heading
              </div>
            </div>

            {/* Paragraphs */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Paragraph</div>
              <p className="text-[13px] leading-relaxed text-muted-foreground" style={{ fontFamily: activeFont.family }}>
                DOCURA uses a genuine document conversion engine. The interface prioritizes accurate conversion of
                text, headings, tables, images, and page layout — while making customization effortless for users
                who need more than a basic converter.
              </p>
            </div>

            {/* Buttons */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Buttons</div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium" style={{ fontFamily: activeFont.family }}>
                  Convert to PDF
                </span>
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-[12px] font-medium" style={{ fontFamily: activeFont.family }}>
                  Cancel
                </span>
              </div>
            </div>

            {/* File names */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">File name</div>
              <div className="text-[12.5px] font-medium" style={{ fontFamily: activeFont.family }}>Q4-marketing-report.docx</div>
            </div>

            {/* Table */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Table rows</div>
              <div className="rounded-md border border-border overflow-hidden">
                <div className="grid grid-cols-3 text-[11px] bg-muted/40 px-2 py-1 font-medium" style={{ fontFamily: activeFont.family }}>
                  <div>Name</div><div>Size</div><div>Status</div>
                </div>
                <div className="grid grid-cols-3 text-[11.5px] px-2 py-1 border-t border-border" style={{ fontFamily: activeFont.family }}>
                  <div>document.docx</div><div>32 KB</div><div>Done</div>
                </div>
                <div className="grid grid-cols-3 text-[11.5px] px-2 py-1 border-t border-border" style={{ fontFamily: activeFont.family }}>
                  <div>report.docx</div><div>1.2 MB</div><div>Converting</div>
                </div>
              </div>
            </div>

            {/* Settings label */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Settings label</div>
              <Label className="text-[11.5px] text-muted-foreground" style={{ fontFamily: activeFont.family }}>
                Page size
              </Label>
            </div>

            {/* Conversion status */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Conversion status</div>
              <div className="text-[12px] text-emerald-600 dark:text-emerald-400" style={{ fontFamily: activeFont.family }}>
                Conversion complete · 2 pages · 1.32s
              </div>
              <div className="text-[12px] text-amber-600 dark:text-amber-400 mt-1" style={{ fontFamily: activeFont.family }}>
                Failed · Document is encrypted
              </div>
            </div>

            {/* Document metadata */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Document metadata</div>
              <div className="text-[11.5px] text-muted-foreground tabular-nums" style={{ fontFamily: activeFont.family }}>
                Pages: 12 · Author: J. Doe · Created: 2026-10-28
              </div>
            </div>
          </div>
        </SettingCard>
      </SettingGroup>
    </div>
  );
}
