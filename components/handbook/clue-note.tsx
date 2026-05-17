import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { paperSurfaces } from "@/lib/prototype-assets";

type ClueNoteProps = {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
};

export function ClueNote({ children, className, onClose }: ClueNoteProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[82%] px-7 py-5 text-center font-serif text-xl leading-9 drop-shadow-sticker",
        className
      )}
    >
      <PrototypeAsset src={paperSurfaces.clue} className="pointer-events-none absolute inset-0 h-full w-full" fit="fill" />
      {onClose ? (
        <button
          aria-label="关闭线索"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full text-coffee/70"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
