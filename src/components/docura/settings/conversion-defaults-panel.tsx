"use client";

import { Settings2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/lib/settings-store";
import { SettingRow, SettingCard, SettingGroup } from "./shared";

export function ConversionDefaultsPanel() {
  const c = useSettings((s) => s.conversion);
  const setC = useSettings((s) => s.setConversion);

  return (
    <div className="space-y-6">
      <SettingGroup title="Page defaults" icon={Settings2} description="Used as the starting point for every new conversion. You can still override per file.">
        <SettingCard>
          <SettingRow label="Page size">
            <Select value={c.page.size} onValueChange={(v) => setC({ page: { ...c.page, size: v as typeof c.page.size } })}>
              <SelectTrigger className="h-9 w-[160px] text-[12.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Original">Original</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Orientation">
            <Select value={c.page.orientation} onValueChange={(v) => setC({ page: { ...c.page, orientation: v as typeof c.page.orientation } })}>
              <SelectTrigger className="h-9 w-[160px] text-[12.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Portrait">Portrait</SelectItem>
                <SelectItem value="Landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Margins">
            <Select value={c.page.margin} onValueChange={(v) => setC({ page: { ...c.page, margin: v as typeof c.page.margin } })}>
              <SelectTrigger className="h-9 w-[160px] text-[12.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Narrow">Narrow</SelectItem>
                <SelectItem value="Wide">Wide</SelectItem>
                <SelectItem value="Original">Original</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Image & compression defaults" icon={Settings2} description="Default quality and compression for every new conversion.">
        <SettingCard>
          <SettingRow label="Image quality" hint="Advisory — LibreOffice honors lossless embedding.">
            <Select value={c.quality} onValueChange={(v) => setC({ quality: v as typeof c.quality })}>
              <SelectTrigger className="h-9 w-[160px] text-[12.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="small">Smaller file</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Image compression">
            <Switch checked={c.compression} onCheckedChange={(v) => setC({ compression: v })} />
          </SettingRow>
          <SettingRow label="Embed fonts" hint="Ensures the PDF looks identical everywhere; increases file size.">
            <Switch checked={c.embedFonts} onCheckedChange={(v) => setC({ embedFonts: v })} />
          </SettingRow>
          <SettingRow label="Preserve hyperlinks">
            <Switch checked={c.preserveLinks} onCheckedChange={(v) => setC({ preserveLinks: v })} />
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="PDF metadata defaults" icon={Settings2} description="Set metadata applied to new conversions. Leave blank to use the source DOCX values.">
        <SettingCard>
          <div className="space-y-3">
            <MetaRow label="Title" value={c.pdfTitle} onChange={(v) => setC({ pdfTitle: v })} placeholder="(use original title)" />
            <MetaRow label="Author" value={c.pdfAuthor} onChange={(v) => setC({ pdfAuthor: v })} placeholder="(use original author)" />
            <MetaRow label="Subject" value={c.pdfSubject} onChange={(v) => setC({ pdfSubject: v })} placeholder="Optional subject" />
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Keywords</Label>
              <Input
                value={c.pdfKeywords}
                onChange={(e) => setC({ pdfKeywords: e.target.value })}
                placeholder="comma, separated, keywords"
                className="h-9 text-[12.5px]"
              />
            </div>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Output defaults" icon={Settings2} description="Filename convention and download behavior.">
        <SettingCard>
          <SettingRow label="Filename convention">
            <Select value={c.outputNaming} onValueChange={(v) => setC({ outputNaming: v as typeof c.outputNaming })}>
              <SelectTrigger className="h-9 w-[180px] text-[12.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Keep original name</SelectItem>
                <SelectItem value="uppercase">UPPERCASE</SelectItem>
                <SelectItem value="lowercase">lowercase</SelectItem>
                <SelectItem value="with-suffix">Append .pdf suffix</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Auto-download on success" hint="Triggers the browser download as soon as a conversion finishes.">
            <Switch checked={c.autoDownload} onCheckedChange={(v) => setC({ autoDownload: v })} />
          </SettingRow>
        </SettingCard>
      </SettingGroup>
    </div>
  );
}

function MetaRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 text-[12.5px]" />
    </div>
  );
}
