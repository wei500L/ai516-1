import Image from "next/image";
import { cn } from "@/lib/utils";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { decor, generated } from "@/lib/prototype-assets";

export function Stamp({ className }: { className?: string }) {
  return (
    <PrototypeAsset src={decor.stampLeaf} className={cn("h-20 w-16 drop-shadow-sticker", className)} />
  );
}

export function MiniCabin({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-44 w-56", className)}>
      <Image
        src={generated.cabin}
        alt=""
        fill
        sizes="330px"
        className="object-contain drop-shadow-[0_18px_22px_rgba(55,32,16,0.30)]"
      />
    </div>
  );
}

export function MiniDoor({ className }: { className?: string }) {
  return (
    <MiniCabin className={cn("h-[300px] w-[350px]", className)} />
  );
}

export function RoomStage() {
  return (
    <div className="absolute inset-x-0 top-0 h-[390px]">
      <Image
        src={generated.room}
        alt=""
        fill
        sizes="420px"
        className="object-contain drop-shadow-[0_18px_24px_rgba(55,32,16,0.34)]"
      />
    </div>
  );
}
