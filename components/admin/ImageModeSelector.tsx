"use client";

import { cn } from "@/lib/utils";
import type { AdminLlmImageMode } from "@/lib/schemas/adminLlmConfig";
import { AssetToggleCard } from "@/components/prototype/asset-fields";

type ImageModeSelectorProps = {
  value: AdminLlmImageMode;
  onChange: (value: AdminLlmImageMode) => void;
};

const options: Array<{
  value: AdminLlmImageMode;
  label: string;
  description: string;
}> = [
  {
    value: "images_api",
    label: "images_api",
    description: "走 /images/generations"
  },
  {
    value: "chat_completions_image_model",
    label: "chat_completions_image_model",
    description: "走 /chat/completions 图像模型"
  }
];

export function ImageModeSelector({ value, onChange }: ImageModeSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <AssetToggleCard
            key={option.value}
            onClick={() => onChange(option.value)}
            selected={selected}
            label={option.label}
            className={cn(
              "min-h-24",
              selected ? "text-cream" : "text-coffee"
            )}
          >
            <div className="soft-title text-lg">{option.label}</div>
            <p className="mt-1 font-serif text-sm leading-6 opacity-80">
              {option.description}
            </p>
          </AssetToggleCard>
        );
      })}
    </div>
  );
}
