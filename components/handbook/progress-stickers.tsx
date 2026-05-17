import { cn } from "@/lib/utils";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { numberToken } from "@/lib/prototype-assets";

type ProgressStickersProps = {
  total: number;
  current: number;
  className?: string;
};

export function ProgressStickers({ total, current, className }: ProgressStickersProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {Array.from({ length: total }).map((_, index) => {
        const active = index < current;
        return (
          <span
            key={index}
            className={cn(
              "relative flex h-12 w-12 items-center justify-center drop-shadow-sticker",
              active && "drop-shadow-[0_0_12px_rgba(236,169,77,0.75)]"
            )}
          >
            <PrototypeAsset
              src={numberToken(Math.min(index + 1, 5), active ? "active" : "default")}
              className="h-12 w-12"
            />
          </span>
        );
      })}
    </div>
  );
}
