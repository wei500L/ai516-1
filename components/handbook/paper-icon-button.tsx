"use client";

import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { tags } from "@/lib/prototype-assets";
import { cn } from "@/lib/utils";

type PaperIconButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  icon: React.ReactNode;
  label: string;
  variant?: "paper" | "circle";
};

export function PaperIconButton({
  icon,
  label,
  className,
  variant = "paper",
  type = "button",
  ...props
}: PaperIconButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92, rotate: -2 }}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex h-12 w-12 items-center justify-center text-coffee drop-shadow-sticker outline-none focus-visible:ring-2 focus-visible:ring-warm-orange/50",
        variant === "circle" && "rounded-full border border-coffee/12 bg-cream/70",
        className
      )}
      {...props}
    >
      {variant === "paper" ? (
        <PrototypeAsset src={tags.labelBeige} className="pointer-events-none absolute inset-0 h-full w-full" fit="fill" />
      ) : null}
      <span className="relative z-10">{icon}</span>
    </motion.button>
  );
}
