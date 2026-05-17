import { cn } from "@/lib/utils";
import { Tape } from "@/components/handbook/tape";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { decor } from "@/lib/prototype-assets";

type PolaroidCardProps = {
  className?: string;
  caption?: string;
  children?: React.ReactNode;
};

export function PolaroidCard({ className, caption, children }: PolaroidCardProps) {
  return (
    <figure className={cn("relative rotate-[-5deg] overflow-visible p-[10%] pb-[23%] drop-shadow-sticker", className)}>
      <PrototypeAsset src={decor.polaroidEmpty} className="pointer-events-none absolute inset-0 h-full w-full" fit="fill" />
      <Tape className="-top-3 left-8 h-6 w-20 rotate-[-12deg]" />
      <div className="relative z-10 aspect-square overflow-hidden bg-parchment/50">{children}</div>
      {caption ? (
        <figcaption className="absolute bottom-2 left-4 right-4 z-20 truncate text-center font-serif text-base text-coffee/70">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
