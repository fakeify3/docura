"use client";

import { Accessibility, Keyboard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings-store";
import { SettingRow, SettingCard, SettingGroup } from "./shared";

const SHORTCUTS = [
  { keys: "Ctrl/Cmd + B", desc: "Open / close the sidebar" },
  { keys: "1", desc: "Go to Convert" },
  { keys: "2", desc: "Go to Batch" },
  { keys: "3", desc: "Go to History" },
  { keys: "4", desc: "Go to My Files" },
  { keys: "5", desc: "Go to Download App" },
  { keys: "6", desc: "Go to Settings" },
  { keys: "7", desc: "Go to Help & About" },
  { keys: "?", desc: "Toggle this shortcut reference" },
  { keys: "Esc", desc: "Close any open dialog" },
];

export function AccessibilitySettingsPanel() {
  const a = useSettings((s) => s.accessibility);
  const setA = useSettings((s) => s.setAccessibility);

  return (
    <div className="space-y-6">
      <SettingGroup title="Motion" icon={Accessibility} description="Reduce motion across the interface for vestibular comfort.">
        <SettingCard>
          <SettingRow label="Reduced motion" hint="Disables animations and most transitions.">
            <Switch checked={a.reducedMotion === "on"} onCheckedChange={(v) => setA({ reducedMotion: v ? "on" : "off" })} />
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Density & text" icon={Accessibility} description="Adjust spacing and text size for better readability.">
        <SettingCard>
          <SettingRow label="Interface density" hint="Compact, comfortable, or spacious.">
            <div className="flex gap-1.5">
              {(["compact", "comfortable", "spacious"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setA({ density: d })}
                  className={`px-3 h-8 rounded-md text-[12px] font-medium capitalize border transition-colors ${a.density === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Larger text" hint="Scales body text up by ~10%.">
            <Switch checked={a.largeText} onCheckedChange={(v) => setA({ largeText: v })} />
          </SettingRow>
          <SettingRow label="High contrast" hint="Increases contrast for foreground text on backgrounds.">
            <Switch checked={a.highContrast} onCheckedChange={(v) => setA({ highContrast: v })} />
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Keyboard shortcuts" icon={Keyboard} description="Quick reference for navigating DOCURA without a mouse.">
        <SettingCard>
          <ul className="space-y-1.5">
            {SHORTCUTS.map((s) => (
              <li key={s.keys} className="flex items-center justify-between text-[12.5px]">
                <span className="text-muted-foreground">{s.desc}</span>
                <kbd className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/60 text-foreground">
                  {s.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </SettingCard>
      </SettingGroup>
    </div>
  );
}
