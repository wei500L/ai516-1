import { HanddrawnIcons } from "@/components/handbook/handdrawn-assets";
import { cn } from "@/lib/utils";

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
              "paper-grain relative flex h-12 w-12 items-center justify-center rounded-full bg-cream text-sage shadow-sticker",
              active && "text-warm-orange shadow-[0_0_14px_rgba(236,169,77,0.65),0_7px_13px_rgba(75,45,21,0.18)]"
            )}
          >
            <HanddrawnIcons.Flower className="h-7 w-7" />
          </span>
        );
      })}
    </div>
  );
}
