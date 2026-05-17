"use client";

import { useState } from "react";
import { Sparkle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import type { MiniRoomObject } from "@/lib/adapters/roomPublicDataAdapter";
import { clueObjectAsset, numberToken } from "@/lib/prototype-assets";
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

function isPlantLikeObject(object: MiniRoomObject) {
  const haystack = [
    object.id,
    object.name,
    object.keyword,
    object.render.style
  ].join(" ");

  return /plant|叶|花|草|芽|盆栽/i.test(haystack);
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
  const [raised, setRaised] = useState(false);
  const reduceMotion = useReducedMotion();
  const scale = scaleFromDepth(object);
  const width = object.render.width * scale;
  const height = object.render.height * scale;
  const hasImage = Boolean(object.assetUrl && !imageFailed);
  const shadow = object.shadow;
  const isRaised = selected || raised;
  const plantLike = isPlantLikeObject(object);
  const idleAnimate = reduceMotion
    ? undefined
    : {
        scale: [1, 1.005, 0.995, 1],
        rotate: plantLike ? [0, 1.5, -1.5, 0] : 0
      };
  const fallbackKey = ["envelope", "clock", "plant", "window", "chair-note"][Math.abs(index) % 5];

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
      onHoverStart={() => setRaised(true)}
      onHoverEnd={() => setRaised(false)}
      onFocus={() => setRaised(true)}
      onBlur={() => setRaised(false)}
      transition={{ type: "spring", stiffness: 270, damping: 24 }}
      className={cn(
        "group absolute outline-none",
        "min-h-[56px] min-w-[56px] sm:min-h-[48px] sm:min-w-[48px]"
      )}
      style={{
        left: `${object.position.x}%`,
        top: `${object.position.y}%`,
        zIndex,
        x: `-${typeof object.anchor === "object" ? object.anchor.x * 100 : object.anchor === "top-left" ? 0 : 50}%`,
        y: `-${typeof object.anchor === "object" ? object.anchor.y * 100 : object.anchor === "center" ? 50 : object.anchor === "top-left" ? 0 : 100}%`,
        width,
        height,
        padding: 10,
        touchAction: "manipulation"
      }}
    >
      {shadow.enabled ? (
        <motion.span
          className="pointer-events-none absolute left-1/2 top-full rounded-full bg-[#2d1b0f]"
          style={{
            width: shadow.width * scale,
            height: shadow.height * scale
          }}
          animate={{
            opacity: isRaised ? Math.min(0.22, shadow.opacity * 0.72) : shadow.opacity,
            x: "-50%",
            y: shadow.offsetY + (isRaised ? 4 : 0),
            scaleX: 1.08 + object.position.y / 360 + (isRaised ? 0.18 : 0),
            scaleY: isRaised ? 1.1 : 1,
            filter: `blur(${shadow.blur + (isRaised ? 2 : 0)}px)`
          }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        />
      ) : null}

      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-[58%] rounded-full opacity-0 transition",
          "bg-[#ffd985]/18 blur-[1px] shadow-[0_0_24px_rgba(255,211,120,0.86),0_0_0_2px_rgba(255,245,223,0.6)]",
          "group-hover:opacity-100 group-focus-visible:opacity-100",
          selected && "opacity-100"
        )}
        style={{
          width: Math.max(width * 0.82, 58),
          height: Math.max(height * 0.72, 50),
          transform: "translate(-50%, -50%)"
        }}
      />

      <motion.span
        className="pointer-events-none absolute inset-0"
        animate={idleAnimate}
        transition={{ duration: plantLike ? 4.8 : 4, repeat: Infinity, ease: "easeInOut" }}
      >
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
          <span
            className="absolute bottom-1 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center text-coffee/55 drop-shadow-sticker"
          >
            <PrototypeAsset
              src={clueObjectAsset(fallbackKey, discovered ? "viewed" : selected ? "active" : "default")}
              className="absolute inset-0 h-full w-full"
            />
            <Sparkle className="absolute right-2 top-2 h-3 w-3 text-warm-orange/65" strokeWidth={1.5} />
          </span>
        )}
      </motion.span>

      <span
        className={cn(
          "absolute -left-2 -top-2 block h-11 w-11 drop-shadow-[0_0_12px_rgba(255,215,123,0.85)]",
          selected && "scale-110"
        )}
      >
        <PrototypeAsset src={numberToken(Math.min(index + 1, 5), discovered ? "active" : "default")} className="h-full w-full" />
      </span>
    </motion.button>
  );
}
