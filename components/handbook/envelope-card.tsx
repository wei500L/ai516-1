import { cn } from "@/lib/utils";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { objects } from "@/lib/prototype-assets";

type EnvelopeCardProps = {
  className?: string;
  children?: React.ReactNode;
};

export function EnvelopeCard({ className, children }: EnvelopeCardProps) {
  return (
    <div
      className={cn(
        "relative h-28 overflow-visible drop-shadow-sticker",
        className
      )}
    >
      <PrototypeAsset src={objects.envelopeSealed} className="absolute inset-0 h-full w-full" />
      <div className="relative z-20 p-4">{children}</div>
    </div>
  );
}
