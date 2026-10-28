"use client";

import { create } from "zustand";

import type { SectionId } from "./brand";

interface NavState {
  section: SectionId;
  setSection: (s: SectionId) => void;
}

export const useNav = create<NavState>((set) => ({
  section: "convert",
  setSection: (section) => {
    set({ section });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = section;
      window.history.replaceState(null, "", url);
    }
  },
}));

export function initNavFromHash(): SectionId {
  if (typeof window === "undefined") return "convert";
  const hash = window.location.hash.replace("#", "") as SectionId;
  if (!hash) return "convert";
  // validate
  const valid = ["convert", "batch", "history", "files", "download", "settings", "help"];
  return (valid.includes(hash) ? hash : "convert") as SectionId;
}
