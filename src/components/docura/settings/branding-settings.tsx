"use client";

import { Building2, Upload, Trash2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings-store";
import { APP_DEFAULTS } from "@/lib/brand";
import { SettingRow, SettingCard, SettingGroup } from "./shared";
import { toast } from "sonner";

export function BrandingSettingsPanel() {
  const branding = useSettings((s) => s.branding);
  const setBranding = useSettings((s) => s.setBranding);

  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 256 * 1024) {
      toast.error("Logo too large", { description: "Please use an image under 256 KB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBranding({ logoDataUrl: reader.result as string });
      toast.success("Logo uploaded");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <SettingGroup title="Product name" icon={Building2} description="The displayed name throughout the interface. Stored centrally — no hardcoded names anywhere in the codebase.">
        <SettingCard>
          <SettingRow label="Application name" hint="The web UI updates instantly. A compiled desktop executable would need a rebuild.">
            <Input
              value={branding.appName}
              onChange={(e) => setBranding({ appName: e.target.value })}
              className="h-9 w-[200px] text-[12.5px]"
              maxLength={32}
              placeholder="DOCURA"
            />
          </SettingRow>
          <SettingRow label="Tagline" hint="Shown in headers and the Help section.">
            <Input
              value={branding.tagline}
              onChange={(e) => setBranding({ tagline: e.target.value })}
              className="h-9 w-[280px] text-[12.5px]"
              maxLength={120}
            />
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Logo & icon" icon={Building2} description="Replace the default sparkle logo with your own image (PNG/SVG, ≤ 256 KB).">
        <SettingCard>
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-xl border border-border bg-muted/40 grid place-items-center overflow-hidden shrink-0">
              {branding.logoDataUrl ? (
                <img src={branding.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="size-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-[12.5px] font-medium mb-1">Custom logo</div>
              <p className="text-[11px] text-muted-foreground leading-snug mb-2">
                PNG or SVG up to 256 KB. Stored locally on this device only.
              </p>
              <div className="flex items-center gap-2">
                <label>
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-[12px] cursor-pointer">
                    <span><Upload className="size-3.5" /> Upload logo</span>
                  </Button>
                  <input type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={onLogoUpload} />
                </label>
                {branding.logoDataUrl && (
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[12px] text-destructive" onClick={() => { setBranding({ logoDataUrl: null }); toast.success("Logo removed"); }}>
                    <Trash2 className="size-3.5" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Accent colors" icon={Building2} description="Override the primary accent color used for highlights, links, and active states.">
        <SettingCard>
          <SettingRow label="Primary accent" hint="Accepts any CSS color (e.g. #6366f1, oklch(0.55 0.22 264)).">
            <div className="flex items-center gap-2">
              <Input
                value={branding.accentColor}
                onChange={(e) => setBranding({ accentColor: e.target.value })}
                className="h-9 w-[220px] text-[11px] font-mono"
              />
              <div className="size-8 rounded-md border border-border" style={{ background: branding.accentColor }} />
            </div>
          </SettingRow>
          <SettingRow label="Secondary accent" hint="Used for charts and secondary highlights.">
            <div className="flex items-center gap-2">
              <Input
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ secondaryColor: e.target.value })}
                className="h-9 w-[220px] text-[11px] font-mono"
              />
              <div className="size-8 rounded-md border border-border" style={{ background: branding.secondaryColor }} />
            </div>
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Preview" icon={Building2} description="See how branding changes affect the sidebar header.">
        <SettingCard>
          <div className="rounded-xl border border-border bg-sidebar p-4 flex items-center gap-3" style={{ background: "var(--sidebar)" }}>
            <div className="size-10 rounded-xl grid place-items-center shrink-0" style={{ background: branding.accentColor }}>
              {branding.logoDataUrl ? (
                <img src={branding.logoDataUrl} alt="Logo" className="w-full h-full object-contain p-1.5" />
              ) : (
                <Check className="size-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold truncate" style={{ color: "var(--sidebar-foreground)" }}>{branding.appName || APP_DEFAULTS.appName}</div>
              <div className="text-[11px] truncate" style={{ color: "var(--sidebar-foreground)", opacity: 0.7 }}>{branding.tagline || APP_DEFAULTS.tagline}</div>
            </div>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Important note" icon={Building2} description="">
        <SettingCard className="bg-amber-500/5 border-amber-500/30">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Changing the web application&apos;s displayed name does <span className="text-foreground font-medium">not</span> change
            a compiled desktop executable&apos;s filename or its operating-system metadata. Those require a rebuild via the
            Tauri configuration documented in <span className="text-foreground">Download App</span>.
          </p>
        </SettingCard>
      </SettingGroup>
    </div>
  );
}
