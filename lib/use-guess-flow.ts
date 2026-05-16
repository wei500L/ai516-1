"use client";

import { create } from "zustand";
import type { GuessSubmission } from "@/lib/contracts";

type GuessFlowState = {
  lastSubmission: GuessSubmission | null;
  diaryRequestMessage: string;
  diaryRequestSent: boolean;
  resultSavedToDiary: boolean;
  setLastSubmission: (submission: GuessSubmission) => void;
  setDiaryRequestMessage: (message: string) => void;
  sendDiaryRequest: () => void;
  markSavedToDiary: () => void;
};

export const useGuessFlow = create<GuessFlowState>((set) => ({
  lastSubmission: null,
  diaryRequestMessage: "",
  diaryRequestSent: false,
  resultSavedToDiary: true,
  setLastSubmission: (submission) => set({ lastSubmission: submission }),
  setDiaryRequestMessage: (message) => set({ diaryRequestMessage: message }),
  sendDiaryRequest: () => set({ diaryRequestSent: true }),
  markSavedToDiary: () => set({ resultSavedToDiary: true })
}));
