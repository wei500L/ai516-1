"use client";

import { create } from "zustand";
import type { CreateRoomDraft, MoodTag } from "@/lib/contracts";

type CreateRoomDraftState = {
  draft: CreateRoomDraft;
  setSentence: (sentence: string) => void;
  toggleMoodTag: (tag: MoodTag) => void;
  setEnvelopeImage: (image: CreateRoomDraft["envelopeImage"]) => void;
  clearEnvelopeImage: () => void;
  resetDraft: () => void;
};

const emptyDraft: CreateRoomDraft = {
  sentence: "",
  moodTags: [],
  envelopeImage: null
};

export const useCreateRoomDraft = create<CreateRoomDraftState>((set) => ({
  draft: emptyDraft,
  setSentence: (sentence) =>
    set((state) => ({
      draft: {
        ...state.draft,
        sentence
      }
    })),
  toggleMoodTag: (tag) =>
    set((state) => {
      const exists = state.draft.moodTags.includes(tag);
      return {
        draft: {
          ...state.draft,
          moodTags: exists
            ? state.draft.moodTags.filter((item) => item !== tag)
            : [...state.draft.moodTags, tag]
        }
      };
    }),
  setEnvelopeImage: (image) =>
    set((state) => ({
      draft: {
        ...state.draft,
        envelopeImage: image
      }
    })),
  clearEnvelopeImage: () =>
    set((state) => ({
      draft: {
        ...state.draft,
        envelopeImage: null
      }
    })),
  resetDraft: () => set({ draft: emptyDraft })
}));
