"use client";

import { FileText, FileImage, Settings2, Info, ChevronDown } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  className?: string;
}

/**
 * Conversion settings panel — page, image, document, output.
 * Honestly labels which options are honored by the LibreOffice pipeline
 * vs which are advisory (passed to the engine but may be ignored).
 */
export function ConversionSettingsPanel({ className }: SettingsPanelProps) {
  const conversion = useSettings((s) => s.conversion);
  const setConversion = useSettings((s) => s.setConversion);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
        <Settings2 className="size-4 text-primary" />
        <h3 className="text-[13px] font-semibold tracking-tight">Conversion settings</h3>
      </div>

      <Accordion type="multiple" defaultValue={["page"]} className="px-2 py-1">
        <AccordionItem value="page" className="border-border/40">
          <AccordionTrigger className="text-[12.5px] font-medium hover:no-underline px-2">
            <span className="flex items-center gap-2">
              <FileText className="size-3.5 text-primary/80" />
              Page
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Page size</Label>
              <Select
                value={conversion.page.size}
                onValueChange={(v) =>
                  setConversion({ page: { ...conversion.page, size: v as typeof conversion.page.size } })
                }
              >
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="Letter">Letter (8.5″ × 11″)</SelectItem>
                  <SelectItem value="Legal">Legal (8.5″ × 14″)</SelectItem>
                  <SelectItem value="Original">Original document size</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10.5px] text-muted-foreground leading-snug">
                {conversion.page.size === "Original"
                  ? "Output uses the page size declared in the DOCX."
                  : "Override applied via LibreOffice's filter properties. May not affect embedded sections."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Orientation</Label>
              <Select
                value={conversion.page.orientation}
                onValueChange={(v) =>
                  setConversion({ page: { ...conversion.page, orientation: v as typeof conversion.page.orientation } })
                }
              >
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Portrait">Portrait</SelectItem>
                  <SelectItem value="Landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Margins</Label>
              <Select
                value={conversion.page.margin}
                onValueChange={(v) =>
                  setConversion({ page: { ...conversion.page, margin: v as typeof conversion.page.margin } })
                }
              >
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal (1″)</SelectItem>
                  <SelectItem value="Narrow">Narrow (0.5″)</SelectItem>
                  <SelectItem value="Wide">Wide (2″)</SelectItem>
                  <SelectItem value="Original">Original</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10.5px] text-muted-foreground leading-snug">
                {conversion.page.margin === "Original"
                  ? "Margins are taken from the source DOCX."
                  : "Override applied when the engine supports it."}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="image" className="border-border/40">
          <AccordionTrigger className="text-[12.5px] font-medium hover:no-underline px-2">
            <span className="flex items-center gap-2">
              <FileImage className="size-3.5 text-primary/80" />
              Images
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Quality</Label>
              <Select
                value={conversion.quality}
                onValueChange={(v) => setConversion({ quality: v as typeof conversion.quality })}
              >
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High quality</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="small">Smaller file</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="comp" className="text-[12px] flex items-center gap-1.5">
                Image compression
                <Badge variant="outline" className="text-[9px] font-normal py-0 px-1.5">Advisory</Badge>
              </Label>
              <Switch
                id="comp"
                checked={conversion.compression}
                onCheckedChange={(v) => setConversion({ compression: v })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="q" className="text-[11px] text-muted-foreground">JPEG quality</Label>
                <span className="text-[11px] text-muted-foreground tabular-nums">75</span>
              </div>
              <Slider id="q" defaultValue={[75]} max={100} min={10} step={5} disabled />
            </div>
            <p className="text-[10.5px] text-muted-foreground leading-snug flex gap-1.5">
              <Info className="size-3 shrink-0 mt-0.5" />
              LibreOffice&apos;s PDF export honors lossless image embedding. Per-image JPEG quality is set by the
              document, not by DOCURA. This control is shown for parity with the desktop pipeline.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="doc" className="border-border/40">
          <AccordionTrigger className="text-[12.5px] font-medium hover:no-underline px-2">
            <span className="flex items-center gap-2">
              <FileText className="size-3.5 text-primary/80" />
              Document
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[11px] text-muted-foreground">PDF title</Label>
              <Input
                id="title"
                value={conversion.pdfTitle}
                onChange={(e) => setConversion({ pdfTitle: e.target.value })}
                placeholder="(use original title)"
                className="h-9 text-[12.5px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="author" className="text-[11px] text-muted-foreground">Author</Label>
              <Input
                id="author"
                value={conversion.pdfAuthor}
                onChange={(e) => setConversion({ pdfAuthor: e.target.value })}
                placeholder="(use original author)"
                className="h-9 text-[12.5px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-[11px] text-muted-foreground">Subject</Label>
              <Input
                id="subject"
                value={conversion.pdfSubject}
                onChange={(e) => setConversion({ pdfSubject: e.target.value })}
                placeholder="Optional subject"
                className="h-9 text-[12.5px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kw" className="text-[11px] text-muted-foreground">Keywords</Label>
              <Textarea
                id="kw"
                value={conversion.pdfKeywords}
                onChange={(e) => setConversion({ pdfKeywords: e.target.value })}
                placeholder="comma, separated, keywords"
                className="min-h-[60px] text-[12.5px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="fonts" className="text-[12px]">Embed fonts</Label>
              <Switch
                id="fonts"
                checked={conversion.embedFonts}
                onCheckedChange={(v) => setConversion({ embedFonts: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="links" className="text-[12px]">Preserve hyperlinks</Label>
              <Switch
                id="links"
                checked={conversion.preserveLinks}
                onCheckedChange={(v) => setConversion({ preserveLinks: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="out" className="border-border/40">
          <AccordionTrigger className="text-[12.5px] font-medium hover:no-underline px-2">
            <span className="flex items-center gap-2">
              <ChevronDown className="size-3.5 text-primary/80" />
              Output
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Filename convention</Label>
              <Select
                value={conversion.outputNaming}
                onValueChange={(v) => setConversion({ outputNaming: v as typeof conversion.outputNaming })}
              >
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Keep original name</SelectItem>
                  <SelectItem value="uppercase">UPPERCASE</SelectItem>
                  <SelectItem value="lowercase">lowercase</SelectItem>
                  <SelectItem value="with-suffix">Append .pdf suffix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto" className="text-[12px]">Auto-download on success</Label>
              <Switch
                id="auto"
                checked={conversion.autoDownload}
                onCheckedChange={(v) => setConversion({ autoDownload: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
