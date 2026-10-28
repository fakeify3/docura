"use client";

import { Download, Globe, Monitor, Apple, Package, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_DEFAULTS } from "@/lib/brand";
import { APP_BUILD_INFO } from "@/lib/build-info";
import { useNav } from "@/lib/nav-store";
import { toast } from "sonner";
import { SettingCard, SettingGroup } from "./shared";

export function DownloadPanel() {
  const setSection = useNav((s) => s.setSection);
  return (
    <div className="space-y-6">
      <SettingGroup title="Get DOCURA" icon={Download} description="Install the web app on your devices, or download the desktop project for fully offline conversion.">
        <SettingCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Web App */}
            <DownloadTile
              icon={Globe}
              tone="emerald"
              title="Web App"
              badge="Available now"
              description="Open DOCURA in any modern browser. No install required."
              actions={
                <Button className="w-full h-9 gap-2 text-[12px]" onClick={() => window.location.reload()}>
                  <Globe className="size-3.5" /> Open Web App
                </Button>
              }
              extras={
                <Button variant="outline" className="w-full h-8 gap-1.5 text-[11px]" onClick={() => toast.info("Install DOCURA", { description: "Browser menu → Install app / Add to Home screen." })}>
                  <Download className="size-3" /> Install as PWA
                </Button>
              }
            />

            {/* Windows Desktop */}
            <DownloadTile
              icon={Monitor}
              tone="indigo"
              title="Windows Desktop"
              badge="Source + build commands"
              description="Tauri project that wraps the same React UI and invokes LibreOffice locally — no uploads."
              actions={
                <a href="/downloads/docura-tauri-source.zip" download>
                  <Button className="w-full h-9 gap-2 text-[12px]">
                    <Package className="size-3.5" /> Download source ZIP
                  </Button>
                </a>
              }
              extras={
                <a href="/downloads/docura-windows-build-instructions.txt" download>
                  <Button variant="outline" className="w-full h-8 gap-1.5 text-[11px]">
                    <Download className="size-3" /> Build instructions
                  </Button>
                </a>
              }
            />
          </div>

          {/* Quick facts */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              Web app is real, working, and installable as a PWA right now.
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              Windows source builds a real MSI via <code className="text-foreground text-[10.5px] px-1 py-0.5 rounded bg-muted">bun tauri build</code>.
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
              No pre-built Windows installer in this sandbox — run the build commands to produce one.
            </div>
            <div className="flex items-center gap-2">
              <Apple className="size-3.5 shrink-0" />
              macOS &amp; Linux share the same source project — coming later.
            </div>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="System requirements" icon={Monitor} description="What you need to run DOCURA on each platform.">
        <SettingCard>
          <ul className="space-y-2 text-[12.5px] text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Web App:</span> Modern Chromium / Firefox / Safari browser, drag-and-drop support, ~2 GB RAM free for conversion.
            </li>
            <li>
              <span className="text-foreground font-medium">Desktop:</span> Windows 10/11 64-bit, 200 MB disk, LibreOffice runtime (bundled or system).
            </li>
            <li>
              <span className="text-foreground font-medium">Network:</span> Required only for the web app; desktop works fully offline once installed.
            </li>
          </ul>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Build & install (Windows desktop)" icon={Package} description="Reproducible build commands for the desktop project.">
        <SettingCard>
          <div className="rounded-lg bg-muted/60 p-4 text-[11.5px] font-mono overflow-auto scroll-thin leading-relaxed">
<pre>{`# 1. Prerequisites
choco install nodejs rust-ms visualstudiobuildtools
winget install TheDocumentFoundation.LibreOffice

# 2. Unzip the source project
unzip docura-tauri-source.zip
cd docura-tauri-src

# 3. Install deps
bun install

# 4. Develop with hot reload
bun tauri dev

# 5. Build a Windows MSI installer
bun tauri build

# Output:
#   src-tauri/target/release/bundle/msi/
#     DOCURA_1.0.0_x64_en-US.msi`}</pre>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <a href="/downloads/docura-tauri-source.zip" download>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]">
                <Package className="size-3.5" /> Download source ZIP
              </Button>
            </a>
            <a href="/downloads/docura-windows-build-instructions.txt" download>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]">
                <Download className="size-3.5" /> Full build instructions
              </Button>
            </a>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="More" icon={ExternalLink} description="Open the dedicated Download App page for the full release notes and troubleshooting.">
        <SettingCard>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[12px]" onClick={() => setSection("download")}>
            <ExternalLink className="size-3.5" /> Go to Download App page
          </Button>
        </SettingCard>
      </SettingGroup>

      <div className="text-[11px] text-muted-foreground text-center pt-2">
        Engine: {APP_DEFAULTS.engine} · Build {APP_BUILD_INFO.buildId} · v{APP_BUILD_INFO.version}
      </div>
    </div>
  );
}

function DownloadTile({
  icon: Icon,
  tone,
  title,
  badge,
  description,
  actions,
  extras,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "indigo";
  title: string;
  badge: string;
  description: string;
  actions: React.ReactNode;
  extras?: React.ReactNode;
}) {
  const colorMap = {
    emerald: "from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    indigo: "from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 flex flex-col gap-3 ${colorMap[tone]}`}>
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-background/60 grid place-items-center shrink-0">
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
            <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-current/30">{badge}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
      <div className="space-y-2">
        {actions}
        {extras}
      </div>
    </div>
  );
}
