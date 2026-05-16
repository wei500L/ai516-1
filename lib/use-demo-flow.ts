"use client";

import { create } from "zustand";

export type DemoStep = "home" | "write" | "generating" | "play" | "result";

type DemoFlowState = {
  step: DemoStep;
  setStep: (step: DemoStep) => void;
};

export const useDemoFlow = create<DemoFlowState>((set) => ({
  step: "home",
  setStep: (step) => set({ step })
}));
