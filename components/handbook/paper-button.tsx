import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { Tape } from "@/components/handbook/tape";
import { HanddrawnButtonShape } from "@/components/handbook/handdrawn-assets";

type PaperButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children?: React.ReactNode;
  variant?: "sage" | "paper" | "parchment" | "brick";
  icon?: React.ReactNode;
  withTape?: boolean;
};

const variantColors = {
  sage: "var(--sage)",
  paper: "var(--cream)",
  parchment: "var(--parchment)",
  brick: "var(--brick-red)"
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
        "relative inline-flex min-h-14 w-full items-center justify-center gap-3 overflow-visible px-4 py-2 text-center soft-title text-[28px] leading-none outline-none drop-shadow-sticker",
        "focus-visible:ring-2 focus-visible:ring-warm-orange/50 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <HanddrawnButtonShape color={variantColors[variant]} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 flex items-center justify-center gap-3">
        {withTape ? <Tape className="-right-6 -top-5 h-6 w-16 rotate-[16deg]" /> : null}
        {icon}
        <span>{children}</span>
      </div>
    </motion.button>
  );
}
