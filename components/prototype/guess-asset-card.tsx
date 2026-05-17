"use client";

import { Check } from "lucide-react";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { classifiedAsset } from "@/lib/prototype-assets";
import { cn } from "@/lib/utils";

type GuessAssetCardProps = {
  selected?: boolean;
  state?: "empty" | "selected" | "submitted" | "success" | "waiting";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

const stateAssets = {
  empty: classifiedAsset("objects/guess/guess_card_empty.png"),
  selected: classifiedAsset("objects/guess/guess_card_selected.png"),
  submitted: classifiedAsset("objects/guess/guess_card_submitted.png"),
  success: classifiedAsset("objects/guess/guess_card_success.png"),
  waiting: classifiedAsset("objects/guess/guess_card_waiting.png")
};

export function GuessAssetCard({
  selected = false,
  state,
  onClick,
  children,
  className
}: GuessAssetCardProps) {
  const activeState = state ?? (selected ? "selected" : "empty");
  const content = (
    <>
      <PrototypeAsset
        src={stateAssets[activeState]}
        className="pointer-events-none absolute inset-0 h-full w-full"
        fit="fill"
      />
      <span className="relative z-10 flex items-start gap-3">
        <span
          className={cn(
            "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-coffee/20",
            selected && "border-cream bg-warm-orange"
          )}
        >
          {selected ? <Check className="h-4 w-4" /> : null}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </span>
    </>
  );

  const sharedClass = cn(
    "relative min-h-[112px] w-full px-5 py-4 text-left drop-shadow-sticker transition active:translate-y-0.5",
    selected ? "text-cream" : "text-coffee",
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClass}>
        {content}
      </button>
    );
  }

  return <div className={sharedClass}>{content}</div>;
}
