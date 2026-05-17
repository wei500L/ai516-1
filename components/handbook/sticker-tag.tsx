import { cn } from "@/lib/utils";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { tags } from "@/lib/prototype-assets";

type StickerTagProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "sage" | "parchment" | "rose" | "blue";
  icon?: React.ReactNode;
};

const toneClasses = {
  sage: "text-cream",
  parchment: "text-coffee",
  rose: "text-coffee",
  blue: "text-coffee"
};

const toneAssets = {
  sage: tags.labelSage,
  parchment: tags.labelBeige,
  rose: tags.tagRed,
  blue: tags.tagSage
};

export function StickerTag({
  children,
  className,
  tone = "parchment",
  icon
}: StickerTagProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium drop-shadow-sticker",
        toneClasses[tone],
        className
      )}
    >
      <PrototypeAsset src={toneAssets[tone]} className="pointer-events-none absolute inset-0 h-full w-full" fit="fill" />
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
    </span>
  );
}
