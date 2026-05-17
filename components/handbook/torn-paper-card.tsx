import { cn } from "@/lib/utils";
import { Tape } from "@/components/handbook/tape";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { paperSurfaces } from "@/lib/prototype-assets";

type TornPaperCardProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "cream" | "parchment" | "sage" | "rose" | "blue";
  tape?: "none" | "top" | "corner";
};

const toneAssets = {
  cream: paperSurfaces.cream,
  parchment: paperSurfaces.parchment,
  sage: paperSurfaces.sage,
  rose: paperSurfaces.rose,
  blue: paperSurfaces.blue
};

export function TornPaperCard({
  children,
  className,
  tone = "cream",
  tape = "none"
}: TornPaperCardProps) {
  return (
    <article
      className={cn(
        "relative overflow-visible p-4 text-coffee drop-shadow-sticker",
        className
      )}
    >
      <PrototypeAsset
        src={toneAssets[tone]}
        className="pointer-events-none absolute inset-0 h-full w-full"
        fit="fill"
      />
      {tape === "top" ? <Tape className="left-1/2 top-[-13px] -translate-x-1/2 rotate-[-2deg]" /> : null}
      {tape === "corner" ? <Tape className="right-3 top-[-12px] h-6 w-16 rotate-[16deg]" /> : null}
      <div className="relative z-10">{children}</div>
    </article>
  );
}
