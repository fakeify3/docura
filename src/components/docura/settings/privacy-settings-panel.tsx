"use client";

import { Shield, Trash2, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings-store";
import { useHistory } from "@/lib/history-store";
import { APP_DEFAULTS } from "@/lib/brand";
import { SettingRow, SettingCard, SettingGroup } from "./shared";
import { toast } from "sonner";

export function PrivacySettingsPanel() {
  const privacy = useSettings((s) => s.privacy);
  const setPrivacy = useSettings((s) => s.setPrivacy);
  const clearHistory = useHistory((s) => s.clear);
  const clearOutputs = useHistory((s) => s.clearOutputs);
  const historyCount = useHistory((s) => s.entries.length);
  const fileCount = useHistory((s) => s.entries.filter((e) => e.outputDataB64).length);

  return (
    <div className="space-y-6">
      <SettingGroup title="Processing disclosure" icon={Info} description="Honest information about how your documents are handled.">
        <SettingCard className="bg-primary/5 border-primary/20">
          <div className="space-y-3 text-[12.5px] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <div className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <div className="font-medium">Local processing</div>
                <div className="text-muted-foreground">Your documents are uploaded to this server only for the duration of a conversion. The conversion happens via {APP_DEFAULTS.engine} running on the server.</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <div className="font-medium">No persistent server storage</div>
                <div className="text-muted-foreground">Converted PDFs are returned to your browser immediately and not retained on the server. Temporary working directories are deleted after each conversion.</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <div className="font-medium">Local history (this device)</div>
                <div className="text-muted-foreground">Conversion metadata you opt into is stored in this browser&apos;s localStorage. If you opt into storing output PDFs, those PDFs also live in localStorage on this device.</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <div className="font-medium">Desktop build</div>
                <div className="text-muted-foreground">The Tauri desktop build invokes LibreOffice locally on your machine. No documents are uploaded anywhere.</div>
              </div>
            </div>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="History preferences" icon={Shield} description="Control what is remembered between sessions.">
        <SettingCard>
          <SettingRow label="Store conversion history" hint="Keep a record of conversions on this device.">
            <Switch checked={privacy.storeHistory} onCheckedChange={(v) => setPrivacy({ storeHistory: v })} />
          </SettingRow>
          <SettingRow label="Store output PDFs" hint="Keep the actual PDF files so you can re-download them from My Files. Increases browser storage use.">
            <Switch checked={privacy.storeOutputFiles} onCheckedChange={(v) => setPrivacy({ storeOutputFiles: v })} />
          </SettingRow>
          <SettingRow label="Clear history on exit" hint="Best-effort: clears history when you close the tab (some browsers may not fire the event reliably).">
            <Switch checked={privacy.clearHistoryOnExit} onCheckedChange={(v) => setPrivacy({ clearHistoryOnExit: v })} />
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Temporary file cleanup" icon={Shield} description="Server-side cleanup of conversion working directories.">
        <SettingCard>
          <SettingRow label="Automatic cleanup" hint={`Temp directories are removed after every conversion (always on). Server-side PDF artifacts older than ${Math.floor(APP_DEFAULTS.serverRetentionMs / 60000)} min are purged.`}>
            <Switch checked={privacy.autoCleanup} onCheckedChange={(v) => setPrivacy({ autoCleanup: v })} disabled />
          </SettingRow>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Danger zone" icon={Trash2} description="Permanently delete history or stored files on this device.">
        <SettingCard className="bg-destructive/5 border-destructive/30">
          <SettingRow label="Clear conversion history" hint={`${historyCount} entr${historyCount === 1 ? "y" : "ies"} stored locally.`}>
            <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5 text-destructive hover:text-destructive" disabled={historyCount === 0} onClick={() => { clearHistory(); toast.success("History cleared"); }}>
              <Trash2 className="size-3.5" /> Clear history
            </Button>
          </SettingRow>
          <SettingRow label="Delete stored PDFs" hint={`${fileCount} PDF${fileCount === 1 ? "" : "s"} stored locally.`}>
            <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5 text-destructive hover:text-destructive" disabled={fileCount === 0} onClick={() => { clearOutputs(); toast.success("Stored PDFs deleted"); }}>
              <Trash2 className="size-3.5" /> Delete PDFs
            </Button>
          </SettingRow>
        </SettingCard>
      </SettingGroup>
    </div>
  );
}
