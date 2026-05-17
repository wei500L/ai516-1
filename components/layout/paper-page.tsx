import { cn } from "@/lib/utils";
import Image from "next/image";
import { generated } from "@/lib/prototype-assets";

type PaperPageProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  withBinder?: boolean;
};

export function PaperPage({
  children,
  className,
  innerClassName,
  withBinder = true
}: PaperPageProps) {
  return (
    <section
      className={cn(
        "relative mx-auto min-h-dvh w-full overflow-hidden px-5 pb-7 pt-16 shadow-paper",
        className
      )}
    >
      <Image
        src={generated.notebookBg}
        alt=""
        fill
        priority
        sizes="430px"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-cream/8" />
      {withBinder ? (
        <>
          <div className="absolute left-0 top-0 h-full w-3 bg-coffee/10" />
        </>
      ) : null}
      <div className={cn("relative z-10", innerClassName)}>{children}</div>
    </section>
  );
}
