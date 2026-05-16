import { cn } from "@/lib/utils";
import { HanddrawnEnvelope } from "@/components/handbook/handdrawn-assets";

type EnvelopeCardProps = {
  className?: string;
  children?: React.ReactNode;
};

export function EnvelopeCard({ className, children }: EnvelopeCardProps) {
  return (
    <div className={cn("relative overflow-visible", className)}>
      <HanddrawnEnvelope className="w-full h-full" />
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
