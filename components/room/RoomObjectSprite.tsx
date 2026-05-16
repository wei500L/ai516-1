"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { motion } from "motion/react";
import type { MiniRoomObject } from "@/lib/adapters/roomPublicDataAdapter";
import { cn } from "@/lib/utils";

type RoomObjectSpriteProps = {
  object: MiniRoomObject;
  index: number;
  selected: boolean;
  discovered: boolean;
  onSelect: (object: MiniRoomObject) => void;
};

function scaleFromDepth(z: number | undefined) {
  const depth = typeof z === "number" ? z : 16;
  return 0.86 + Math.min(0.22, Math.max(0, depth) / 180);
}

export function RoomObjectSprite({
  object,
  index,
  selected,
  discovered,
  onSelect
}: RoomObjectSpriteProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const scale = scaleFromDepth(object.position.z);
  const width = object.render.width * scale;
  const height = object.render.height * scale;
  const hasImage = Boolean(object.render.assetUrl && !imageFailed);

  return (
    <motion.button
      type="button"
      aria-label={`查看线索：${object.name}`}
      onClick={() => onSelect(object)}
      initial={{ opacity: 0, y: 10, scale: scale * 0.96 }}
      animate={{ opacity: 1, y: 0, scale }}
      whileHover={{ y: -5, scale: scale * 1.04 }}
      whileFocus={{ y: -5, scale: scale * 1.04 }}
      whileTap={{ y: -1, scale: scale * 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "group absolute -translate-x-1/2 -translate-y-1/2 outline-none",
        "min-h-14 min-w-14 rounded-full focus-visible:ring-2 focus-visible:ring-warm-orange/70"
      )}
      style={{
        left: `${object.position.x}%`,
        top: `${object.position.y}%`,
        zIndex: object.position.layer,
        width,
        height
      }}
    >
      <span className="absolute inset-0 rounded-full opacity-0 shadow-[0_0_30px_rgba(255,211,120,0.85)] transition group-hover:opacity-100 group-focus-visible:opacity-100" />
      {hasImage ? (
        <img
          src={object.render.assetUrl ?? ""}
          alt={object.name}
          draggable={false}
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_12px_10px_rgba(45,27,15,0.34)]",
            "opacity-95 transition group-hover:opacity-100",
            discovered ? "brightness-105" : "brightness-95"
          )}
          onError={(event) => {
            event.currentTarget.style.display = "none";
            setImageFailed(true);
          }}
        />
      ) : (
        <span className="torn-edge paper-grain absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-cream/88 text-coffee/55 shadow-sticker">
          <ImageOff className="h-7 w-7" strokeWidth={1.5} />
        </span>
      )}
      <span
        className={cn(
          "absolute -left-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-cream/95",
          "bg-warm-orange/50 text-center soft-title text-lg text-cream shadow-[0_0_18px_rgba(255,214,126,0.95)]",
          selected && "bg-warm-orange/75 shadow-[0_0_26px_rgba(255,214,126,1)]",
          discovered && "border-warm-orange bg-cream text-warm-orange"
        )}
      >
        {index + 1}
      </span>
    </motion.button>
  );
}
