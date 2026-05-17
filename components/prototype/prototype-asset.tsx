import Image from "next/image";
import { cn } from "@/lib/utils";

type PrototypeAssetProps = {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  fit?: "contain" | "fill" | "cover";
};

export function PrototypeAsset({
  src,
  alt = "",
  className,
  imageClassName,
  priority = false,
  sizes = "360px",
  fit = "contain"
}: PrototypeAssetProps) {
  return (
    <span className={cn("relative block overflow-visible", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          fit === "fill" && "object-fill",
          fit === "cover" && "object-cover",
          fit === "contain" && "object-contain",
          imageClassName
        )}
      />
    </span>
  );
}
