import { cn } from "@/lib/utils";
import { HanddrawnWaxSeal } from "@/components/handbook/handdrawn-assets";

type WaxSealProps = {
  className?: string;
};

export function WaxSeal({ className }: WaxSealProps) {
  return (
    <HanddrawnWaxSeal className={cn("w-16 h-16 drop-shadow-lg", className)} />
  );
}
