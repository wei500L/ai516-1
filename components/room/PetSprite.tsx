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

  return (
    <motion.button
      type="button"
      aria-label={`和${pet.name}说话`}
      onClick={onSelect}
      whileHover={{ y: -4, rotate: -2 }}
      whileTap={{ y: -1, scale: 0.96 }}
      className={cn(
        "group absolute flex h-16 w-16 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full outline-none",
        "focus-visible:ring-2 focus-visible:ring-warm-orange/70"
      )}
      style={{
        left: `${pet.position.x}%`,
        top: `${pet.position.y}%`,
        zIndex: zIndex ?? pet.position.layer
      }}
    >
      <span className="absolute left-1/2 top-full h-5 w-14 -translate-x-1/2 rounded-full bg-[#2d1b0f]/28 blur-[7px]" />
      <span className="absolute inset-1 rounded-full bg-cream/78 shadow-[0_0_18px_rgba(255,215,123,0.74)]" />
      <span className="torn-edge paper-grain relative flex h-12 w-12 items-center justify-center bg-parchment text-coffee shadow-sticker transition group-hover:-translate-y-1">
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </span>
    </motion.button>
  );
}
