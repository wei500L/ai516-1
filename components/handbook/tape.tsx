import { cn } from "@/lib/utils";
import { HanddrawnTape as HanddrawnTapeSVG } from "@/components/handbook/handdrawn-assets";

type TapeProps = {
  className?: string;
  variant?: "plain" | "cross" | "strip";
};

export function Tape({ className, variant = "plain" }: TapeProps) {
  return (
    <div className={cn("absolute z-20 pointer-events-none", className)}>
      <HanddrawnTapeSVG className="w-24 h-8 rotate-[-8deg]" />
      {variant === "cross" && (
        <HanddrawnTapeSVG className="w-24 h-8 rotate-[72deg] translate-x-6 -translate-y-2" />
      )}
    </div>
  );
}
