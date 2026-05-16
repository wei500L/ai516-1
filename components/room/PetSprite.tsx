"use client";

import { Cat, Dog } from "lucide-react";
import { motion } from "motion/react";
import type { MiniRoomPet } from "@/lib/adapters/roomPublicDataAdapter";
import { cn } from "@/lib/utils";

type PetSpriteProps = {
  pet: MiniRoomPet;
  onSelect?: () => void;
};

export function PetSprite({ pet, onSelect }: PetSpriteProps) {
  const Icon = pet.type === "dog" ? Dog : Cat;

  return (
    <motion.button
      type="button"
      aria-label={`和${pet.name}说话`}
      onClick={onSelect}
      whileHover={{ y: -4, rotate: -2 }}
      whileTap={{ y: -1, scale: 0.96 }}
      className={cn(
        "absolute z-50 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none",
        "focus-visible:ring-2 focus-visible:ring-warm-orange/70"
      )}
      style={{
        left: `${pet.position.x}%`,
        top: `${pet.position.y}%`,
        zIndex: pet.position.layer
      }}
    >
      <span className="absolute inset-1 rounded-full bg-cream/80 shadow-[0_0_18px_rgba(255,215,123,0.74)]" />
      <span className="torn-edge paper-grain relative flex h-12 w-12 items-center justify-center bg-parchment text-coffee shadow-sticker">
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </span>
    </motion.button>
  );
}
