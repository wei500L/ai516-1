import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { paperSurfaces } from "@/lib/prototype-assets";
import { cn } from "@/lib/utils";

type PaperSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  src?: string;
  variant?: keyof typeof paperSurfaces;
  minHeight?: string;
};

export function PaperSurface({
  children,
  className,
  contentClassName,
  src,
  variant = "cream",
  minHeight
}: PaperSurfaceProps) {
  return (
    <div className={cn("relative text-coffee drop-shadow-sticker", minHeight, className)}>
      <PrototypeAsset
        src={src ?? paperSurfaces[variant]}
        className="pointer-events-none absolute inset-0 h-full w-full"
        fit="fill"
      />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}
