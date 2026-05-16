import { cn } from "@/lib/utils";
import { Tape } from "@/components/handbook/tape";

type PolaroidCardProps = {
  className?: string;
  caption?: string;
  children?: React.ReactNode;
};

export function PolaroidCard({ className, caption, children }: PolaroidCardProps) {
  return (
    <figure className={cn("relative rotate-[-5deg] bg-cream p-3 pb-10 shadow-paper overflow-visible", className)}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 120" preserveAspectRatio="none">
        <path d="M2,2 Q5,0 50,2 T98,2 L97,118 Q50,115 2,118 Z" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
      </svg>
      <Tape className="-top-4 left-6 h-6 w-20 rotate-[-12deg]" />
      <div className="aspect-[4/5] overflow-hidden bg-parchment shadow-insetPaper relative z-10">
        {children}
      </div>
      {caption ? (
        <figcaption className="absolute bottom-2 left-0 right-0 text-center font-serif text-base text-coffee/70 z-20">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
