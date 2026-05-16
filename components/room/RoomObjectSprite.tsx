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
  zIndex: number;
  onSelect: (object: MiniRoomObject) => void;
};

function scaleFromDepth(object: MiniRoomObject) {
  const depth = typeof object.position.z === "number" ? object.position.z : 16;
  const yScale = 0.9 + Math.max(0, Math.min(100, object.position.y)) / 560;

  return object.scale || object.render.scale || yScale + Math.min(0.08, depth / 500);
}

function anchorClass(anchor: MiniRoomObject["anchor"]) {
  if (anchor === "center") {
    return "-translate-x-1/2 -translate-y-1/2";
  }

  if (anchor === "top-left") {
    return "";
  }

  return "-translate-x-1/2 -translate-y-full";
}

export function RoomObjectSprite({
  object,
  index,
  selected,
  discovered,
  zIndex,
  onSelect
}: RoomObjectSpriteProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const scale = scaleFromDepth(object);
  const width = object.render.width * scale;
  const height = object.render.height * scale;
  const hasImage = Boolean(object.assetUrl && !imageFailed);
  const shadow = object.shadow;

  return (
    <motion.button
      type="button"
      aria-label={`查看线索：${object.name}`}
      onClick={() => onSelect(object)}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: selected ? -6 : 0, scale: 1 }}
      whileHover={{ y: -5 }}
      whileFocus={{ y: -5 }}
      whileTap={{ y: -2, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 270, damping: 24 }}
      className={cn(
        "group absolute outline-none",
        anchorClass(object.anchor),
        "min-h-[56px] min-w-[56px] sm:min-h-[48px] sm:min-w-[48px]"
      )}
      style={{
        left: `${object.position.x}%`,
        top: `${object.position.y}%`,
        zIndex,
        width,
        height,
        padding: 10,
        touchAction: "manipulation"
      }}
    >
      {shadow.enabled ? (
        <span
          className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 rounded-full bg-[#2d1b0f] transition-opacity"
          style={{
            width: shadow.width * scale,
            height: shadow.height * scale,
            opacity: selected ? Math.min(0.22, shadow.opacity) : shadow.opacity,
            filter: `blur(${shadow.blur}px)`,
            transform: `translate(-50%, ${shadow.offsetY}px) scaleX(1.08)`
          }}
        />
      ) : null}

      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 rounded-full opacity-0 transition",
          "shadow-[0_0_24px_rgba(255,211,120,0.86),0_0_0_2px_rgba(255,245,223,0.6)]",
          "group-hover:opacity-100 group-focus-visible:opacity-100",
          selected && "opacity-100"
        )}
        style={{
          width: Math.max(width * 0.82, 58),
          height: Math.max(height * 0.72, 50),
          transform: "translate(-50%, -50%)"
        }}
      />

      {hasImage ? (
        <img
          src={object.assetUrl ?? ""}
          alt={object.name}
          draggable={false}
          className={cn(
            "pointer-events-none absolute bottom-0 left-1/2 max-h-full max-w-full -translate-x-1/2 object-contain",
            "drop-shadow-[0_10px_9px_rgba(45,27,15,0.28)] transition",
            discovered ? "brightness-105" : "brightness-95",
            selected && "brightness-110"
          )}
          onError={(event) => {
            event.currentTarget.style.display = "none";
            setImageFailed(true);
          }}
        />
      ) : (
        <span className="torn-edge paper-grain absolute bottom-1 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center bg-cream/88 text-coffee/55 shadow-sticker">
          <ImageOff className="h-7 w-7" strokeWidth={1.5} />
        </span>
      )}

      <span
        className={cn(
          "absolute -left-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-cream/95",
          "bg-warm-orange/54 text-center soft-title text-lg text-cream shadow-[0_0_18px_rgba(255,214,126,0.95)]",
          selected && "bg-warm-orange/78 shadow-[0_0_26px_rgba(255,214,126,1)]",
          discovered && "border-warm-orange bg-cream text-warm-orange"
        )}
      >
        {index + 1}
      </span>
    </motion.button>
  );
}
