import { cn } from "@/lib/utils";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { decor } from "@/lib/prototype-assets";

type TapeProps = {
  className?: string;
  variant?: "plain" | "cross" | "strip";
};

export function Tape({ className, variant = "plain" }: TapeProps) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute z-20 block", className)}>
      <PrototypeAsset
        src={variant === "strip" ? decor.tapeAlt : decor.tape}
        className={cn("h-8 w-20 rotate-[-8deg]", variant === "strip" && "h-8 w-20 rotate-6")}
      />
      {variant === "cross" ? (
        <PrototypeAsset
          src={decor.tapeAlt}
          className="absolute left-6 top-[-10px] h-8 w-20 rotate-[72deg]"
        />
      ) : null}
    </span>
  );
}
