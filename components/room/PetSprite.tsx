"use client";

import { Cat, Dog } from "lucide-react";
import { motion } from "motion/react";
import type { MiniRoomPet } from "@/lib/adapters/roomPublicDataAdapter";
import { cn } from "@/lib/utils";

type PetSpriteProps = {
  pet: MiniRoomPet;
  zIndex?: number;
  onSelect?: () => void;
};

export function PetSprite({ pet, zIndex, onSelect }: PetSpriteProps) {
  const Icon = pet.type === "dog" ? Dog : Cat;
  const width = 72 * pet.scale;
  const height = 78 * pet.scale;
  const shadow = pet.shadow;

  return (
    <motion.button
      type="button"
      aria-label={`和${pet.name}说话`}
      onClick={onSelect}
      whileHover={{ y: -5, rotate: -2 }}
      whileTap={{ y: -1, scale: 0.96 }}
      className={cn(
        "group absolute flex items-center justify-center outline-none",
        "focus-visible:ring-2 focus-visible:ring-warm-orange/70"
      )}
      style={{
        left: `${pet.position.x}%`,
        top: `${pet.position.y}%`,
        zIndex: zIndex ?? pet.position.layer,
        x: `-${typeof pet.anchor === "object" ? pet.anchor.x * 100 : pet.anchor === "top-left" ? 0 : 50}%`,
        y: `-${typeof pet.anchor === "object" ? pet.anchor.y * 100 : pet.anchor === "center" ? 50 : pet.anchor === "top-left" ? 0 : 100}%`,
        width,
        height
      }}
    >
      {shadow.enabled ? (
        <span
          className="absolute left-1/2 top-full rounded-full bg-[#2d1b0f]"
          style={{
            width: shadow.width * pet.scale,
            height: shadow.height * pet.scale,
            opacity: shadow.opacity,
            filter: `blur(${shadow.blur}px)`,
            transform: `translate(-50%, ${shadow.offsetY}px) scaleX(1.16)`
          }}
        />
      ) : null}
      <span className="absolute left-1/2 top-[58%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd985]/18 opacity-0 blur-[1px] shadow-[0_0_24px_rgba(255,211,120,0.86)] transition group-hover:opacity-100 group-focus-visible:opacity-100" />
      {pet.assetUrl ? (
        <img
          src={pet.assetUrl}
          alt={pet.name}
          draggable={false}
          className="pointer-events-none absolute bottom-0 left-1/2 max-h-full max-w-full -translate-x-1/2 object-contain drop-shadow-[0_10px_9px_rgba(45,27,15,0.28)] transition group-hover:-translate-y-1"
        />
      ) : (
        <>
          <span className="absolute inset-1 rounded-full bg-cream/78 shadow-[0_0_18px_rgba(255,215,123,0.74)]" />
          <span className="torn-edge paper-grain relative flex h-12 w-12 items-center justify-center bg-parchment text-coffee shadow-sticker transition group-hover:-translate-y-1">
            <Icon className="h-7 w-7" strokeWidth={1.5} />
          </span>
        </>
      )}
    </motion.button>
  );
}
