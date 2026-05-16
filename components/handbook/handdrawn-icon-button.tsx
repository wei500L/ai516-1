import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { HanddrawnCircle } from "@/components/handbook/handdrawn-assets";

type HanddrawnIconButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  icon: React.ReactNode;
  label: string;
  variant?: "paper" | "circle";
};

export function HanddrawnIconButton({
  icon,
  label,
  className,
  variant = "paper",
  type = "button",
  ...props
}: HanddrawnIconButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92, rotate: -2 }}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "paper-grain relative inline-flex h-12 w-12 items-center justify-center text-coffee outline-none focus-visible:ring-2 focus-visible:ring-warm-orange/50",
        className
      )}
      {...props}
    >
      <HanddrawnCircle color={variant === "paper" ? "var(--parchment)" : "var(--cream)"} />
      <div className="relative z-10">{icon}</div>
    </motion.button>
  );
}
