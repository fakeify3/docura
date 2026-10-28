"use client";

import { Download, Globe, Apple, Monitor, Package, Terminal, AlertTriangle, CheckCircle2, Smartphone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_DEFAULTS } from "@/lib/brand";
import { APP_BUILD_INFO } from "@/lib/build-info";
import { toast } from "sonner";

export function DownloadAppView() {
  const beforeInstall = () => {
    toast.info("Install DOCURA", {
      description: "Use your browser menu → Install app / Add to home screen.",
    });
  };

  return (
    <div className="flex-1 overflow-auto scroll-thin">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="text-[11px] py-1 px-2 mb-3">Version {APP_BUILD_INFO.version}</Badge>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-3">
            Take DOCURA anywhere.
          </h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            Install DOCURA on your devices for offline-capable conversion. The web app runs in any modern
            browser. Desktop builds bundle the conversion engine for fully offline processing.
          </p>
        </div>

        {/* Install cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Web App */}
          <InstallCard
            icon={Globe}
            badge="Available now"
            badgeTone="emerald"
            title="Web App"
            description="Open DOCURA in your browser. No install needed."
            primary={<Button className="w-full h-10 gap-2" onClick={() => window.location.reload()}>
              <Globe className="size-4" /> Open Web App
            </Button>}
            secondary={
              <Button variant="outline" className="w-full h-9 gap-2 text-[12px]" onClick={beforeInstall}>
                <Download className="size-3.5" /> Install (PWA)
              </Button>
            }
            notes={[
              { ok: true, text: "Real LibreOffice conversion in this environment" },
              { ok: true, text: "Drag-and-drop, batch, ZIP export" },
              { ok: true, text: "Installable as a PWA on supported browsers" },
            ]}
          />

          {/* Windows */}
          <InstallCard
            icon={Monitor}
            badge="Source project + reproducible build"
            badgeTone="indigo"
            title="Windows Desktop"
            description="Genuine Windows application with local conversion."
            primary={
              <a href="/downloads/docura-windows-build-instructions.txt" download>
                <Button className="w-full h-10 gap-2">
                  <Package className="size-4" /> Build Instructions
                </Button>
              </a>
            }
            secondary={
              <a href="/downloads/docura-tauri-source.zip">
                <Button variant="outline" className="w-full h-9 gap-2 text-[12px]">
                  <Download className="size-3.5" /> Source project
                </Button>
              </a>
            }
            notes={[
              { ok: false, text: "No pre-built installer in this environment" },
              { ok: true, text: "Tauri project + bundled LibreOffice runtime" },
              { ok: true, text: "Native file dialogs, fully offline" },
            ]}
          />

          {/* macOS / Linux */}
          <InstallCard
            icon={Apple}
            badge="Roadmap"
            badgeTone="muted"
            title="macOS & Linux"
            description="Planned future desktop builds."
            primary={
              <Button variant="outline" className="w-full h-10 gap-2 opacity-70" disabled>
                <Apple className="size-4" /> Coming later
              </Button>
            }
            secondary={null}
            notes={[
              { ok: false, text: "Not yet available" },
              { ok: true, text: "Same engine, same UI as Windows build" },
            ]}
          />
        </div>

        {/* Build instructions preview */}
        <BuildInstructionsCard />

        {/* System requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
          <Section title="System requirements" icon={Monitor}>
            <ul className="space-y-2 text-[12.5px] text-muted-foreground">
              <li><span className="text-foreground font-medium">Web App:</span> Modern Chromium/Firefox/Safari browser, drag-and-drop support, ~2 GB RAM free for conversion.</li>
              <li><span className="text-foreground font-medium">Desktop:</span> Windows 10/11 64-bit, 200 MB disk, LibreOffice runtime (bundled or system).</li>
              <li><span className="text-foreground font-medium">Network:</span> Required only for the web app; desktop works fully offline once installed.</li>
            </ul>
          </Section>

          <Section title="Installation instructions" icon={Terminal}>
            <ol className="space-y-2 text-[12.5px] text-muted-foreground list-decimal list-inside">
              <li>Download the build instructions file above.</li>
              <li>Install Node.js 20+, Rust, and the Tauri CLI.</li>
              <li>Install LibreOffice or use the bundled runtime profile.</li>
              <li>Run <code className="px-1 py-0.5 rounded bg-muted text-foreground text-[11px]">bun install</code> in the project root.</li>
              <li>Run <code className="px-1 py-0.5 rounded bg-muted text-foreground text-[11px]">bun tauri build</code> to produce a Windows MSI installer.</li>
              <li>Run the installer; DOCURA will appear in your Start menu.</li>
            </ol>
          </Section>
        </div>

        {/* Troubleshooting */}
        <Section title="Troubleshooting" icon={AlertTriangle}>
          <div className="space-y-3 text-[12.5px] text-muted-foreground">
            <div>
              <div className="text-foreground font-medium mb-1">Conversion engine unavailable</div>
              <p>If the header badge shows &quot;Engine unavailable&quot;, LibreOffice is not installed on the server. The desktop build bundles its own runtime and will work offline regardless.</p>
            </div>
            <div>
              <div className="text-foreground font-medium mb-1">PWA install option is missing</div>
              <p>Some browsers (notably iOS Safari) do not yet support full PWA install. Use &quot;Add to Home Screen&quot; from the Share menu instead.</p>
            </div>
            <div>
              <div className="text-foreground font-medium mb-1">A document fails to convert</div>
              <p>The file may be corrupted, encrypted, or not actually a DOCX. DOCURA validates each file&apos;s ZIP header and Office Open XML manifest before converting and shows the real reason for failure.</p>
            </div>
          </div>
        </Section>

        {/* Release notes */}
        <Section title="Release notes — v1.0.0" icon={CheckCircle2}>
          <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
            <li>• Real DOCX → PDF conversion via LibreOffice 25.2 headless engine.</li>
            <li>• Premium multi-theme UI with six built-in themes plus a custom theme builder.</li>
            <li>• Batch conversion with per-file retries and ZIP export.</li>
            <li>• PDF preview with page navigation, zoom, fit-to-width, fit-to-page.</li>
            <li>• Document structure preview before conversion (clearly labeled, not the final PDF).</li>
            <li>• Conversion history with privacy controls (store metadata only or also store output PDFs).</li>
            <li>• Installable PWA with offline-capable UI shell.</li>
            <li>• Desktop project (Tauri) with reproducible build instructions for Windows MSI.</li>
          </ul>
        </Section>

        <div className="text-[11px] text-muted-foreground text-center pt-6 border-t border-border/40 mt-6">
          Engine: {APP_DEFAULTS.engine} · Build {APP_BUILD_INFO.buildId} · Released {APP_BUILD_INFO.releasedAt}
        </div>
      </div>
    </div>
  );
}

function InstallCard({
  icon: Icon, badge, badgeTone, title, description, primary, secondary, notes,
}: {
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeTone: "emerald" | "indigo" | "muted";
  title: string;
  description: string;
  primary: React.ReactNode;
  secondary: React.ReactNode;
  notes: { ok: boolean; text: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 grid place-items-center shrink-0">
          <Icon className="size-6 text-primary" />
        </div>
        <div className="flex-1">
          <Badge
            variant="outline"
            className={
              badgeTone === "emerald"
                ? "text-[10px] py-0.5 px-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : badgeTone === "indigo"
                ? "text-[10px] py-0.5 px-1.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "text-[10px] py-0.5 px-1.5"
            }
          >
            {badge}
          </Badge>
          <h3 className="text-[15px] font-semibold tracking-tight mt-1">{title}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        {primary}
        {secondary}
      </div>

      <ul className="space-y-1.5 pt-1 border-t border-border/40 mt-1">
        {notes.map((n, i) => (
          <li key={i} className="flex items-start gap-2 text-[11.5px] text-muted-foreground">
            {n.ok ? (
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <span>{n.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BuildInstructionsCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden mb-12">
      <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
        <Terminal className="size-4 text-primary" />
        <h3 className="text-[13px] font-semibold">Desktop build overview (Tauri + LibreOffice)</h3>
      </div>
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <p className="text-[12.5px] text-muted-foreground leading-relaxed mb-3">
            DOCURA&apos;s desktop version uses Tauri to wrap the same React UI as the web app, but invokes
            LibreOffice locally instead of over HTTP. This gives you a real native window, native file
            dialogs, and fully offline conversion — no documents leave your machine.
          </p>
          <ul className="text-[12px] text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2"><ChevronRight className="size-3.5 mt-0.5 shrink-0 text-primary" />Same React/TS/Tailwind codebase, no UI duplication.</li>
            <li className="flex items-start gap-2"><ChevronRight className="size-3.5 mt-0.5 shrink-0 text-primary" />Bundles a portable LibreOffice runtime profile (~150 MB).</li>
            <li className="flex items-start gap-2"><ChevronRight className="size-3.5 mt-0.5 shrink-0 text-primary" />Native save-as dialog for choosing output locations.</li>
            <li className="flex items-start gap-2"><ChevronRight className="size-3.5 mt-0.5 shrink-0 text-primary" />Windows MSI installer via <code className="px-1 py-0.5 rounded bg-muted text-foreground text-[11px]">tauri build</code>.</li>
          </ul>
        </div>
        <div className="rounded-lg bg-muted/60 p-4 text-[11.5px] font-mono overflow-auto scroll-thin">
<pre className="leading-relaxed">{`# Prerequisites (Windows)
choco install nodejs rust-ms visualstudiobuildtools
# LibreOffice (or use bundled portable runtime)
winget install TheDocumentFoundation.LibreOffice

# Clone & install
git clone <docura-repo> docura
cd docura
bun install

# Develop (web + desktop hot reload)
bun tauri dev

# Build a Windows MSI installer
bun tauri build

# Output:
#   src-tauri/target/release/bundle/msi/
#     DOCURA_1.0.0_x64_en-US.msi`}</pre>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-primary" />
        <h3 className="text-[13px] font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}
