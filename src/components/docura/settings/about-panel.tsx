"use client";

import { Info, Cpu, FileCheck, LifeBuoy, BookOpen, Github } from "lucide-react";
import { APP_DEFAULTS } from "@/lib/brand";
import { APP_BUILD_INFO } from "@/lib/build-info";
import { SettingCard, SettingGroup } from "./shared";

export function AboutPanel() {
  return (
    <div className="space-y-6">
      <SettingGroup title="Application" icon={Info} description="Core product information.">
        <SettingCard>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
            <Row label="Application name" value={APP_DEFAULTS.appName} />
            <Row label="Version" value={APP_BUILD_INFO.version} />
            <Row label="Build ID" value={APP_BUILD_INFO.buildId} />
            <Row label="Released" value={APP_BUILD_INFO.releasedAt} />
            <Row label="Engine" value={APP_DEFAULTS.engine} />
            <Row label="License" value={APP_BUILD_INFO.license} />
          </dl>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Supported formats" icon={FileCheck} description="What DOCURA can read and write.">
        <SettingCard>
          <div className="space-y-3 text-[12.5px]">
            <div>
              <div className="font-medium mb-1">Inputs</div>
              <ul className="text-muted-foreground space-y-1">
                {APP_BUILD_INFO.supportedInputs.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <code className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground">{f}</code>
                    <span>Microsoft Word Open XML Document</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Outputs</div>
              <ul className="text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <code className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground">application/pdf</code>
                  <span>PDF 1.7 (compatible with Adobe Acrobat, SumatraPDF, browsers)</span>
                </li>
              </ul>
            </div>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Engine & environment" icon={Cpu} description="Technical details about the conversion pipeline.">
        <SettingCard>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
            <Row label="Conversion engine" value={APP_DEFAULTS.engine} />
            <Row label="Max file size" value={`${APP_DEFAULTS.maxFileSizeMB} MB`} />
            <Row label="Max batch files" value={String(APP_DEFAULTS.maxBatchFiles)} />
            <Row label="Max concurrent" value={String(APP_DEFAULTS.maxConcurrentConversions)} />
            <Row label="Server retention" value={`${Math.floor(APP_DEFAULTS.serverRetentionMs / 60000)} min`} />
            <Row label="Storage" value="Browser localStorage (settings, history)" />
          </dl>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Help & support" icon={LifeBuoy} description="Get help with DOCURA.">
        <SettingCard>
          <ul className="space-y-2 text-[12.5px]">
            <li className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <a href="#help" className="text-foreground hover:underline">Open the Help &amp; About page</a>
            </li>
            <li className="flex items-center gap-2">
              <Github className="size-4 text-primary" />
              <span className="text-muted-foreground">Source repository available on request</span>
            </li>
            <li className="flex items-center gap-2">
              <LifeBuoy className="size-4 text-primary" />
              <span className="text-muted-foreground">For conversion failures, check the in-app error message — it explains the real cause.</span>
            </li>
          </ul>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Limitations" icon={Info} description="What DOCURA honestly cannot do yet.">
        <SettingCard>
          <ul className="space-y-2 text-[12.5px] text-muted-foreground list-disc list-inside leading-relaxed">
            <li>Only <code className="text-foreground">.docx</code> is supported as input. Legacy <code className="text-foreground">.doc</code> files are not.</li>
            <li>Macros, embedded scripts, and ActiveX controls are not executed or preserved.</li>
            <li>Password-protected or encrypted DOCX files produce a clear error, not a converted PDF.</li>
            <li>The structural preview shown before conversion is informational only — it is not a pixel-perfect rendering of the final PDF.</li>
            <li>Image-quality controls are advisory. LibreOffice honors lossless image embedding by default.</li>
            <li>The desktop build is provided as source + reproducible build instructions; a pre-built installer is not included in this environment.</li>
            <li>The web app requires a server round-trip for conversion. The desktop build performs fully offline conversion on your machine.</li>
          </ul>
        </SettingCard>
      </SettingGroup>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}
