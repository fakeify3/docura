"use client";

import { Palette, Moon, Sun, Monitor, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useSettings, ThemeId, Mode, Density, RadiusPreset, MotionPref } from "@/lib/settings-store";
import { cn } from "@/lib/utils";
import { SettingRow, SettingCard, SettingGroup } from "./shared";

const THEMES: { id: ThemeId; name: string; swatches: [string, string, string]; description: string }[] = [
  { id: "obsidian", name: "Obsidian", swatches: ["#0a0c12", "#1a1d28", "#6366f1"], description: "Deep midnight blue with electric indigo accents." },
  { id: "midnight", name: "Midnight Blue", swatches: ["#0c1326", "#1a2940", "#3b6fef"], description: "Navy-grade dark blue, calm and focused." },
  { id: "pearl", name: "Pearl White", swatches: ["#fbfbfb", "#ffffff", "#3a55cc"], description: "Light, clean, modern — bright surfaces." },
  { id: "ivory", name: "Warm Ivory", swatches: ["#f7f1e0", "#fff8e6", "#c4622d"], description: "Warm cream paper feel, accent amber." },
  { id: "graphite", name: "Graphite", swatches: ["#161616", "#2a2a2a", "#b9b9b9"], description: "Pure monochrome, professional neutral." },
  { id: "lavender", name: "Lavender Accent", swatches: ["#f5f0fb", "#e7d8f5", "#9a55e6"], description: "Soft lavender accent on near-white." },
  { id: "custom", name: "Custom", swatches: ["var(--custom-bg)", "var(--custom-surface)", "var(--custom-primary)"], description: "Build your own palette below." },
];

export function AppearanceSettings() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const mode = useSettings((s) => s.mode);
  const setMode = useSettings((s) => s.setMode);
  const density = useSettings((s) => s.density);
  const setDensity = useSettings((s) => s.setDensity);
  const radiusPreset = useSettings((s) => s.radiusPreset);
  const setRadiusPreset = useSettings((s) => s.setRadiusPreset);
  const motion = useSettings((s) => s.motion);
  const setMotion = useSettings((s) => s.setMotion);
  const customPrimary = useSettings((s) => s.customPrimary);
  const setCustomPrimary = useSettings((s) => s.setCustomPrimary);
  const customBackground = useSettings((s) => s.customBackground);
  const setCustomBackground = useSettings((s) => s.setCustomBackground);
  const customSurface = useSettings((s) => s.customSurface);
  const setCustomSurface = useSettings((s) => s.setCustomSurface);
  const sidebarCollapsed = useSettings((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useSettings((s) => s.setSidebarCollapsed);

  return (
    <div className="space-y-6">
      <SettingGroup title="Theme" icon={Palette} description="Pick a complete palette. Light/dark mode can be toggled separately.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn(
                "group rounded-xl border p-3 text-left transition-all",
                theme === t.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-1.5">
                  {t.swatches.map((c, i) => (
                    <div
                      key={i}
                      className="size-6 rounded-full border-2 border-card"
                      style={{ background: c.startsWith("var") ? "linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)" : c }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium flex items-center gap-1.5">
                    {t.name}
                    {theme === t.id && <Check className="size-3 text-primary" />}
                  </div>
                </div>
              </div>
              <p className="text-[10.5px] text-muted-foreground leading-snug">{t.description}</p>
            </button>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="Light or dark" icon={mode === "dark" ? Moon : mode === "light" ? Sun : Monitor} description="Choose how DOCURA follows the system or overrides it.">
        <SettingCard>
          <div className="grid grid-cols-3 gap-2">
            <ModeButton active={mode === "light"} onClick={() => setMode("light")} icon={Sun} label="Light" />
            <ModeButton active={mode === "dark"} onClick={() => setMode("dark")} icon={Moon} label="Dark" />
            <ModeButton active={mode === "system"} onClick={() => setMode("system")} icon={Monitor} label="System" />
          </div>
        </SettingCard>
      </SettingGroup>

      {theme === "custom" && (
        <SettingGroup title="Custom palette" icon={Palette} description="Build your own theme by setting primary, background, and surface colors.">
          <SettingCard>
            <div className="space-y-3">
              <ColorRow label="Primary" value={customPrimary} onChange={setCustomPrimary} />
              <ColorRow label="Background" value={customBackground} onChange={setCustomBackground} />
              <ColorRow label="Surface" value={customSurface} onChange={setCustomSurface} />
            </div>
          </SettingCard>
        </SettingGroup>
      )}

      <SettingGroup title="Layout & density" icon={Palette} description="Control the spacing scale and corner radii across the app.">
        <SettingCard>
          <SettingRow label="Interface density" hint="Affects padding, gaps, and list item heights.">
            <div className="flex gap-1.5">
              {(["compact", "comfortable", "spacious"] as Density[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={cn(
                    "px-3 h-8 rounded-md text-[12px] font-medium capitalize border transition-colors",
                    density === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Corner radius" hint="Global radius preset for cards and controls.">
            <div className="flex gap-1.5">
              {(["sharp", "default", "round"] as RadiusPreset[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusPreset(r)}
                  className={cn(
                    "px-3 h-8 rounded-md text-[12px] font-medium capitalize border transition-colors",
                    radiusPreset === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                    r === "sharp" && "rounded-sm",
                    r === "round" && "rounded-lg"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Sidebar collapsed by default" hint="Starts the sidebar collapsed on desktop.">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "h-6 w-11 rounded-full transition-colors flex items-center px-0.5",
                sidebarCollapsed ? "bg-primary" : "bg-muted"
              )}
              aria-pressed={sidebarCollapsed}
            >
              <span className={cn(
                "size-5 rounded-full bg-card shadow transition-transform",
                sidebarCollapsed ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Animations" icon={Palette} description="Control motion throughout the interface.">
        <SettingCard>
          <SettingRow label="Animations" hint="Toggle subtle transitions, hover effects, and progress animations.">
            <div className="flex gap-1.5">
              {(["on", "off"] as MotionPref[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotion(m)}
                  className={cn(
                    "px-3 h-8 rounded-md text-[12px] font-medium border transition-colors",
                    motion === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "on" ? "On" : "Off"}
                </button>
              ))}
            </div>
          </SettingRow>
        </SettingCard>
      </SettingGroup>
    </div>
  );
}

function ModeButton({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all",
        active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
      )}
    >
      <Icon className="size-5" />
      <span className="text-[12px] font-medium">{label}</span>
    </button>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-[12px] text-muted-foreground flex-1">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-[220px] text-[11px] font-mono px-2 rounded-md border border-border bg-background"
        />
        <div
          className="size-8 rounded-md border border-border"
          style={{ background: value.startsWith("oklch") ? value : "#999" }}
        />
      </div>
    </div>
  );
}
