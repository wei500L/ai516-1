import { cn } from "@/lib/utils";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { decor } from "@/lib/prototype-assets";

type WaxSealProps = {
  className?: string;
};

export function WaxSeal({ className }: WaxSealProps) {
  return (
    <PrototypeAsset src={decor.waxSealRed} className={cn("inline-block h-16 w-16 drop-shadow-lg", className)} />
  );
}
