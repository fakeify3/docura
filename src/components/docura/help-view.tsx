"use client";

import { LifeBuoy, BookOpen, Shield, AlertTriangle, Cpu, FileText, Zap, Keyboard } from "lucide-react";
import { APP_DEFAULTS } from "@/lib/brand";
import { APP_BUILD_INFO } from "@/lib/build-info";
import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "Does DOCURA really convert documents, or just rename files?",
    a: "DOCURA performs genuine document conversion via LibreOffice 25.2 headless. The server-side engine reads your .docx, renders it, and produces a valid PDF — there is no file renaming, no screenshots, no fake PDFs.",
  },
  {
    q: "Are my documents uploaded to a server?",
    a: "For the web app: yes, your file is uploaded temporarily to this server for conversion. Temporary directories are removed after each conversion and converted PDFs are not stored server-side. For the desktop build (Tauri): no, conversion happens entirely on your machine.",
  },
  {
    q: "What happens to a corrupted or encrypted document?",
    a: "DOCURA validates each file's ZIP header and Office Open XML manifest before converting. If the document is malformed or encrypted, you'll see a clear error message explaining the cause — never a fake PDF.",
  },
  {
    q: "Why does the preview look different from the final PDF?",
    a: "The 'Source' preview is a structural extraction (paragraphs, tables, images, headings) — it is clearly labeled 'Not the final PDF'. The 'PDF' preview tab shows the actual converted PDF using a real PDF renderer (pdf.js).",
  },
  {
    q: "Can I convert multiple files at once?",
    a: "Yes. The Batch section lets you queue up to 25 files, runs them with limited concurrency, retries failed ones, and lets you download all successful outputs as a single ZIP.",
  },
  {
    q: "Why is the desktop build not a pre-built installer?",
    a: "This sandbox environment cannot produce a Windows MSI. We provide the complete Tauri source project and reproducible build instructions; running `bun tauri build` on a Windows machine produces the installer.",
  },
  {
    q: "Are my settings and history synced across devices?",
    a: "No. Settings, history, and any stored PDFs live in your browser's localStorage on the current device only. There is no account system, no cloud sync.",
  },
  {
    q: "Does the app work offline?",
    a: "The web UI shell is installable as a PWA and works offline for browsing already-stored settings and history. Conversion itself requires either this server (web app) or the desktop build (fully offline).",
  },
];

export function HelpView() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex-1 overflow-auto scroll-thin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/60 text-[11px] text-muted-foreground mb-3">
            <LifeBuoy className="size-3 text-primary" /> Help & About
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-3">
            Everything you need to use DOCURA.
          </h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            Quick guides, honest privacy information, troubleshooting tips, and release notes.
          </p>
        </div>

        {/* Quick start */}
        <Section title="Quick start" icon={Zap}>
          <ol className="space-y-3 text-[13px] text-muted-foreground">
            <Step n={1} title="Add a DOCX file">
              Drag a <code className="text-foreground text-[12px] px-1.5 py-0.5 rounded bg-muted">.docx</code> file into the upload area on the Convert page, or click to browse.
            </Step>
            <Step n={2} title="Customize output (optional)">
              Adjust page size, orientation, margins, image quality, and document metadata in the settings panel on the right.
            </Step>
            <Step n={3} title="Convert">
              Click <span className="text-foreground font-medium">Convert to PDF</span>. DOCURA shows real progress through validation, conversion, and verification stages.
            </Step>
            <Step n={4} title="Preview & download">
              Switch to the <span className="text-foreground font-medium">PDF</span> tab to inspect the result. Click <span className="text-foreground font-medium">Download PDF</span> to save it.
            </Step>
          </ol>
        </Section>

        {/* FAQ */}
        <Section title="Frequently asked questions" icon={BookOpen}>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className={cn(
                    "size-6 rounded-md grid place-items-center text-[11px] font-semibold shrink-0 transition-colors",
                    open === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                  <span className="text-[13px] font-medium flex-1">{item.q}</span>
                  <span className="text-muted-foreground text-[20px] leading-none">
                    {open === i ? "−" : "+"}
                  </span>
                </button>
                {open === i && (
                  <div className="px-3 pb-3 pl-12 text-[12.5px] text-muted-foreground leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Privacy at a glance */}
        <Section title="Privacy at a glance" icon={Shield}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoCard icon={Shield} tone="emerald" title="Local storage only">
              Settings and history live in your browser&apos;s localStorage. No accounts, no cloud sync.
            </InfoCard>
            <InfoCard icon={Cpu} tone="indigo" title="Real local engine">
              Conversions use {APP_DEFAULTS.engine}. No remote API in the desktop build.
            </InfoCard>
            <InfoCard icon={FileText} tone="amber" title="No persistent server files">
              Temporary directories are removed after every conversion. The server keeps nothing.
            </InfoCard>
            <InfoCard icon={AlertTriangle} tone="muted" title="Honest about limits">
              DOCURA never claims offline mode unless the engine actually works offline.
            </InfoCard>
          </div>
        </Section>

        {/* Keyboard shortcuts */}
        <Section title="Keyboard shortcuts" icon={Keyboard}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px]">
            {[
              ["1 – 7", "Jump to Convert / Batch / History / My Files / Download / Settings / Help"],
              ["Esc", "Close any open dialog"],
              ["Drag & Drop", "Add files anywhere on Convert or Batch pages"],
              ["Enter / Space", "Activate the focused element"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 p-2 rounded-md border border-border/60 bg-card/40">
                <kbd className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/60 shrink-0">{k}</kbd>
                <span className="text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Troubleshooting */}
        <Section title="Troubleshooting" icon={AlertTriangle}>
          <div className="space-y-3 text-[12.5px] text-muted-foreground">
            <Issue title="Conversion fails with &quot;Engine unavailable&quot;">
              LibreOffice is not installed on the server. In this sandbox it is installed; if you self-host, install LibreOffice 25.x and ensure <code className="text-foreground text-[11px] px-1 py-0.5 rounded bg-muted">soffice</code> is on <code className="text-foreground text-[11px] px-1 py-0.5 rounded bg-muted">PATH</code>.
            </Issue>
            <Issue title="Conversion fails with &quot;Document is encrypted&quot;">
              The source DOCX is password-protected. Remove the password in Word first, then re-upload.
            </Issue>
            <Issue title="Conversion fails with &quot;Not a valid DOCX&quot;">
              The file is either corrupted, not actually a DOCX (despite the extension), or a legacy <code className="text-foreground text-[11px] px-1 py-0.5 rounded bg-muted">.doc</code>. DOCURA validates the ZIP header and Office Open XML manifest before converting.
            </Issue>
            <Issue title="Conversion times out">
              The default timeout is 120 seconds. Very large documents with many images may exceed it. Split the document or convert in sections.
            </Issue>
            <Issue title="PDF preview is blank">
              Your browser may have strict content security. Try refreshing the page. The PDF is still valid — try downloading it directly.
            </Issue>
          </div>
        </Section>

        {/* Release notes */}
        <Section title="Release notes" icon={FileText}>
          <div className="rounded-xl border border-border/60 bg-card/40 p-5">
            <div className="text-[13px] font-semibold mb-1">Version {APP_BUILD_INFO.version}</div>
            <div className="text-[11px] text-muted-foreground mb-3">Released {APP_BUILD_INFO.releasedAt}</div>
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
          </div>
        </Section>

        <div className="text-[11px] text-muted-foreground text-center pt-6 border-t border-border/40 mt-6">
          Engine: {APP_DEFAULTS.engine} · Build {APP_BUILD_INFO.buildId}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="size-7 rounded-md bg-primary/10 grid place-items-center text-primary shrink-0">
          <Icon className="size-4" />
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="size-6 rounded-full bg-primary/10 text-primary text-[11px] font-semibold grid place-items-center shrink-0 mt-0.5">
        {n}
      </div>
      <div>
        <div className="text-foreground font-medium text-[13px] mb-0.5">{title}</div>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

function InfoCard({ icon: Icon, tone, title, children }: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "indigo" | "amber" | "muted";
  title: string;
  children: React.ReactNode;
}) {
  const colorMap = {
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    indigo: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 flex items-start gap-3">
      <div className={cn("size-9 rounded-lg grid place-items-center shrink-0", colorMap[tone])}>
        <Icon className="size-4.5" />
      </div>
      <div>
        <div className="text-[13px] font-medium mb-0.5">{title}</div>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Issue({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="text-[13px] font-medium mb-1">{title}</div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
