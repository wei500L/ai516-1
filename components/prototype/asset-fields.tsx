"use client";

import { Check } from "lucide-react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { tags } from "@/lib/prototype-assets";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full border-0 bg-transparent bg-[url('/assets/prototype/classified/transparent/ui/message_note/message_note_empty.png')] bg-[length:100%_100%] bg-center font-serif text-coffee drop-shadow-sticker outline-none placeholder:text-coffee/42 focus:ring-2 focus:ring-warm-orange/35";

export function AssetTextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(fieldBase, "min-h-14 px-5 py-3 text-base", className)}
      {...props}
    />
  );
}

export function AssetTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-32 resize-none px-5 py-5 text-base leading-8", className)}
      {...props}
    />
  );
}

export function AssetSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldBase, "min-h-14 px-5 py-3 text-base", className)}
      {...props}
    >
      {children}
    </select>
  );
}

type AssetToggleCardProps = {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
};

export function AssetToggleCard({
  selected,
  onClick,
  children,
  className,
  label
}: AssetToggleCardProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative min-h-14 w-full px-4 py-3 text-left font-serif text-base drop-shadow-sticker transition active:translate-y-0.5",
        selected ? "text-cream" : "text-coffee",
        className
      )}
    >
      <PrototypeAsset
        src={selected ? tags.statusSelected : tags.statusBlank}
        className="pointer-events-none absolute inset-0 h-full w-full"
        fit="fill"
      />
      <span className="relative z-10 flex items-center justify-between gap-3">
        <span>{children}</span>
        {selected ? <Check className="h-5 w-5 shrink-0" /> : null}
      </span>
    </button>
  );
}
