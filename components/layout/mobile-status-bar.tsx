import { Battery, Signal, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileStatusBarProps = {
  className?: string;
  dark?: boolean;
};

export function MobileStatusBar({ className, dark = false }: MobileStatusBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-0 right-0 top-0 z-30 flex h-12 items-center justify-between px-8 text-[17px] font-semibold",
        dark ? "text-coffee" : "text-cream",
        className
      )}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-5 w-5 fill-current" strokeWidth={2.4} />
        <Wifi className="h-5 w-5" strokeWidth={2.7} />
        <Battery className="h-6 w-6" strokeWidth={2.3} />
      </div>
    </div>
  );
}
