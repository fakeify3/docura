"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/docura/sidebar";
import { Header } from "@/components/docura/header";
import { ConvertWorkspace } from "@/components/docura/convert-workspace";
import { BatchWorkspace } from "@/components/docura/batch-workspace";
import { HistoryView } from "@/components/docura/history-view";
import { MyFilesView } from "@/components/docura/my-files-view";
import { DownloadAppView } from "@/components/docura/download-app-view";
import { SettingsView } from "@/components/docura/settings-view";
import { HelpView } from "@/components/docura/help-view";
import { useNav, initNavFromHash } from "@/lib/nav-store";
import { useSettings } from "@/lib/settings-store";
import { useHistory } from "@/lib/history-store";
import { Button } from "@/components/ui/button";

export default function Home() {
  const section = useNav((s) => s.section);
  const setSection = useNav((s) => s.setSection);
  const collapsed = useSettings((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useSettings((s) => s.setSidebarCollapsed);
  const clearHistory = useHistory((s) => s.clear);
  const clearOnExit = useSettings((s) => s.privacy.clearHistoryOnExit);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Initialize section from URL hash on mount
  useEffect(() => {
    const initial = initNavFromHash();
    if (initial !== "convert") setSection(initial);
  }, [setSection]);

  // Listen for hash changes (back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const s = initNavFromHash();
      useNav.setState({ section: s });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Global keyboard shortcuts (1-7 nav, Esc close dialogs/nav, Cmd+B toggle sidebar)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      // Cmd/Ctrl + B toggles sidebar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed(!collapsed);
        return;
      }

      // Numbers 1-7 jump to sections
      const numMap: Record<string, ReturnType<typeof setSection>> = {
        "1": "convert", "2": "batch", "3": "history", "4": "files",
        "5": "download", "6": "settings", "7": "help",
      };
      if (numMap[e.key]) {
        e.preventDefault();
        setSection(numMap[e.key]!);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [collapsed, setSidebarCollapsed, setSection]);

  // Clear history on tab close if opted in
  useEffect(() => {
    if (!clearOnExit) return;
    const onUnload = () => clearHistory();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [clearOnExit, clearHistory]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 size-8 z-20"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 min-h-0 overflow-hidden relative">
          {section === "convert" && <ConvertWorkspace />}
          {section === "batch" && <BatchWorkspace />}
          {section === "history" && <HistoryView />}
          {section === "files" && <MyFilesView />}
          {section === "download" && <DownloadAppView />}
          {section === "settings" && <SettingsView />}
          {section === "help" && <HelpView />}
        </main>
      </div>
    </div>
  );
}
