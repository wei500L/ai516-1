"use client";

import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { Tape } from "@/components/handbook/tape";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { buttons } from "@/lib/prototype-assets";

type PaperButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children?: React.ReactNode;
  variant?: "sage" | "paper" | "parchment" | "brick";
  icon?: React.ReactNode;
  withTape?: boolean;
};

const variantAssets = {
  sage: buttons.primary,
  paper: buttons.secondary,
  parchment: buttons.secondary,
  brick: buttons.pressed
};

const variantClasses = {
  sage: "text-cream",
  paper: "text-coffee",
  parchment: "text-coffee",
  brick: "text-cream"
};

export function PaperButton({
  className,
  children,
  variant = "sage",
  icon,
  withTape = false,
  type = "button",
  ...props
}: PaperButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.965, y: 2, rotate: -0.4 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      type={type}
      className={cn(
        "relative inline-flex min-h-14 w-full items-center justify-center gap-3 overflow-visible px-7 py-4 text-center soft-title text-[clamp(22px,6.2vw,28px)] leading-tight drop-shadow-sticker outline-none",
        "focus-visible:ring-2 focus-visible:ring-warm-orange/50 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <PrototypeAsset
        src={variantAssets[variant]}
        className="pointer-events-none absolute inset-0 h-full w-full"
        fit="fill"
      />
      {withTape ? <Tape className="-right-1 -top-3 h-6 w-16 rotate-[16deg]" /> : null}
      <span className="relative z-10 inline-flex max-w-full flex-wrap items-center justify-center gap-3">
        {icon}
        <span>{children}</span>
      </span>
    </motion.button>
  );
}
