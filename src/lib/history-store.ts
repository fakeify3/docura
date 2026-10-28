"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ConversionStatus = "success" | "failed";

export interface HistoryEntry {
  id: string;
  originalName: string;
  outputName: string;
  date: string; // ISO
  durationMs: number;
  inputSize: number;
  outputSize: number;
  pages: number | null;
  status: ConversionStatus;
  errorMessage?: string;
  settings: {
    pageSize: string;
    orientation: string;
    margin: string;
    quality: string;
  };
  // For "My Files" — keep the PDF blob as base64 if privacy.storeOutputFiles is true
  outputDataB64?: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (e: HistoryEntry) => void;
  removeEntry: (id: string) => void;
  clear: () => void;
  clearOutputs: () => void;
}

export const useHistory = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((s) => {
          // keep last 100 entries, drop oldest
          const next = [entry, ...s.entries];
          if (next.length > 100) next.length = 100;
          return { entries: next };
        }),
      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
      clearOutputs: () =>
        set((s) => ({
          entries: s.entries.map((e) => ({
            ...e,
            outputDataB64: undefined,
          })),
        })),
    }),
    {
      name: "docura-history",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      version: 1,
    }
  )
);
