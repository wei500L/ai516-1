"use client";

import { create } from "zustand";
import type { AdminLlmConfigDraft } from "@/lib/schemas/adminLlmConfig";

type AdminLlmState = {
  config: AdminLlmConfigDraft | null;
  isLoading: boolean;
  error: string | null;
  setConfig: (config: AdminLlmConfigDraft) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
};

export const useAdminLlmStore = create<AdminLlmState>((set) => ({
  config: null,
  isLoading: false,
  error: null,
  setConfig: (config) => set({ config, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () => set({ config: null, isLoading: false, error: null })
}));
