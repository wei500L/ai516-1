import { cn } from "@/lib/utils";
import { Tape } from "@/components/handbook/tape";
import { HanddrawnTornPaper } from "@/components/handbook/handdrawn-assets";

type TornPaperCardProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "cream" | "parchment" | "sage" | "rose" | "blue";
  tape?: "none" | "top" | "corner";
};

const toneColors = {
  cream: "var(--cream)",
  parchment: "var(--parchment)",
  sage: "#77805f",
  rose: "#e8b6a7",
  blue: "#6f7f83"
};

export function TornPaperCard({
  children,
  className,
  tone = "cream",
  tape = "none"
}: TornPaperCardProps) {
  return (
    <div className={cn("relative overflow-visible", className)}>
      <HanddrawnTornPaper color={toneColors[tone]} className="w-full h-full">
        {tape === "top" ? <Tape className="left-1/2 top-[-10px] -translate-x-1/2 rotate-[-1deg]" /> : null}
        {tape === "corner" ? <Tape className="-right-4 -top-4 h-6 w-16 rotate-[15deg]" /> : null}
        <div className="relative z-10 p-1 text-coffee">
          {children}
        </div>
      </HanddrawnTornPaper>
    </div>
  );
}
