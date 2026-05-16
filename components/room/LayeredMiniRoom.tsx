"use client";

import { useMemo, useState } from "react";
import { Moon, Sparkles, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ClueNote } from "@/components/handbook/clue-note";
import { PolaroidCard } from "@/components/handbook/polaroid-card";
import { ProgressStickers } from "@/components/handbook/progress-stickers";
import { TornPaperCard } from "@/components/handbook/torn-paper-card";
import { PetSprite } from "@/components/room/PetSprite";
import { RoomObjectSprite } from "@/components/room/RoomObjectSprite";
import type {
  AdaptedPublicRoom,
  MiniRoomObject
} from "@/lib/adapters/roomPublicDataAdapter";
import { cn } from "@/lib/utils";

type LayeredMiniRoomProps = {
  room: AdaptedPublicRoom;
};

function stageClasses(theme: string) {
  if (theme === "rainy_desk_miniature") {
    return {
      wall: "from-[#9b927f] to-[#6f6f68]",
      floor: "from-[#897561] to-[#5d4838]",
      window: "bg-[#172538]"
    };
  }

  if (theme === "moonlit_paper_room") {
    return {
      wall: "from-[#645b69] to-[#3f3549]",
      floor: "from-[#67513d] to-[#3a2a22]",
      window: "bg-[#10172b]"
    };
  }

  return {
    wall: "from-[#caa37a] to-[#8b6546]",
    floor: "from-[#b98d63] to-[#765136]",
    window: "bg-[#17233a]"
  };
}

function ShellBackdrop({ room }: { room: AdaptedPublicRoom }) {
  const colors = stageClasses(room.visualTheme);

  return (
    <div className="absolute inset-x-0 top-0 h-[390px]">
      <div className="absolute left-1/2 top-0 h-[360px] w-[94%] -translate-x-1/2 overflow-hidden bg-[#b58d67] shadow-paper [clip-path:polygon(4%_26%,50%_0,96%_26%,96%_100%,4%_100%)]">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-b",
            colors.wall
          )}
        />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(74,45,25,0.26)_0_2px,transparent_2px_46px)]" />
        <div className="absolute bottom-0 left-0 h-[38%] w-full origin-bottom skew-x-[-10deg] bg-gradient-to-b shadow-[inset_0_16px_22px_rgba(50,29,15,0.18)]" />
        <div className={cn("absolute bottom-0 left-0 h-[37%] w-full bg-gradient-to-b", colors.floor)} />
        <div className="absolute bottom-20 left-1/2 h-24 w-48 -translate-x-1/2 rounded-[4px] bg-[#6f4428] shadow-sticker">
          <div className="absolute inset-x-5 top-4 h-4 bg-cream/18" />
          <div className="absolute bottom-2 left-8 h-14 w-3 bg-[#442715]" />
          <div className="absolute bottom-2 right-8 h-14 w-3 bg-[#442715]" />
        </div>
        <div className="absolute left-7 top-24 h-28 w-20 border-4 border-[#6e4427] bg-[#f2c06c]/30 shadow-insetPaper" />
        <div className={cn("absolute right-8 top-20 h-32 w-24 border-4 border-[#6e4427] shadow-insetPaper", colors.window)}>
          <Moon className="absolute left-8 top-4 h-9 w-9 text-[#ffd976]" />
          <Star className="absolute bottom-5 right-4 h-5 w-5 text-[#ffd976]" />
        </div>
        <div className="absolute left-1/2 top-20 h-12 w-12 -translate-x-1/2 rounded-full bg-[#ffd470] shadow-[0_0_28px_rgba(255,205,96,0.95)]" />
        <div className="absolute bottom-10 left-20 h-20 w-14 bg-[#805333] shadow-sticker" />
        <div className="absolute bottom-10 right-20 h-20 w-14 bg-[#805333] shadow-sticker" />
        <div className="absolute left-10 top-52 h-24 w-16 rounded-t-full bg-sage/35" />
        <div className="absolute right-14 top-55 h-20 w-14 rounded-t-full bg-sage/30" />
      </div>
    </div>
  );
}

function fallbackDiscovered(progressIds: string[], object: MiniRoomObject) {
  return object.discovered || progressIds.includes(object.id);
}

export function LayeredMiniRoom({ room }: LayeredMiniRoomProps) {
  const [selectedObject, setSelectedObject] = useState<MiniRoomObject | null>(
    room.objects[0] ?? null
  );
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(
    () => new Set(room.progress.discoveredObjectIds)
  );
  const [petOpen, setPetOpen] = useState(false);
  const discoveredCount = useMemo(
    () => room.objects.filter((object) => discoveredIds.has(object.id)).length,
    [discoveredIds, room.objects]
  );

  function selectObject(object: MiniRoomObject) {
    setSelectedObject(object);
    setPetOpen(false);
    setDiscoveredIds((current) => new Set(current).add(object.id));
  }

  return (
    <>
      {room.imageClue ? (
        <PolaroidCard className="mx-auto mb-5 w-44 rotate-[-3deg]" caption={room.imageClue.alt}>
          {room.imageClue.url ? (
            <img
              src={room.imageClue.url}
              alt={room.imageClue.alt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-sm text-coffee/60">
              信封里的照片
            </div>
          )}
        </PolaroidCard>
      ) : null}

      <section className="relative mt-7 h-[460px]" aria-label="线索小屋">
        <ShellBackdrop room={room} />
        {room.objects.map((object, index) => (
          <RoomObjectSprite
            key={object.id}
            object={object}
            index={index}
            selected={selectedObject?.id === object.id}
            discovered={fallbackDiscovered([...discoveredIds], object)}
            onSelect={selectObject}
          />
        ))}
        <PetSprite
          pet={room.pet}
          onSelect={() => {
            setPetOpen(true);
            setSelectedObject(null);
          }}
        />
        <AnimatePresence mode="wait">
          {selectedObject ? (
            <div className="absolute bottom-0 left-[9%] right-[9%] z-[70]">
              <motion.div
                key={selectedObject.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
              >
                <ClueNote
                  className="!mx-0 !w-full px-5 py-4 text-lg leading-8"
                  onClose={() => setSelectedObject(null)}
                >
                  <span className="mb-2 block soft-title text-lg text-coffee/70">
                    {selectedObject.name}
                  </span>
                  {selectedObject.clue}
                </ClueNote>
              </motion.div>
            </div>
          ) : null}
          {petOpen ? (
            <div className="absolute bottom-0 left-[9%] right-[9%] z-[70]">
              <motion.div
                key="pet-note"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
              >
                <ClueNote
                  className="!mx-0 !w-full px-5 py-4 text-lg leading-8"
                  onClose={() => setPetOpen(false)}
                >
                  <span className="mb-2 block soft-title text-lg text-coffee/70">
                    {room.pet.name}
                  </span>
                  我会陪你看线索，但不会直接说出答案。
                </ClueNote>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </section>

      <TornPaperCard className="mt-5 text-center" tone="cream">
        <div className="mb-4 flex items-center justify-center gap-4 font-serif text-xl">
          <span className="h-px w-20 bg-coffee/24" />
          线索进度 {discoveredCount}/{room.objects.length}
          <span className="h-px w-20 bg-coffee/24" />
        </div>
        <ProgressStickers total={Math.max(1, room.objects.length)} current={discoveredCount} />
      </TornPaperCard>

      {room.choices.length > 0 ? (
        <TornPaperCard className="mt-5 p-4" tone="parchment" tape="corner">
          <div className="mb-3 flex items-center gap-2 font-serif text-lg">
            <Sparkles className="h-5 w-5 text-warm-orange" />
            你觉得这句话更像是
          </div>
          <div className="grid gap-3">
            {room.choices.map((choice) => (
              <button
                key={choice.index}
                type="button"
                className="torn-edge paper-grain min-h-12 bg-cream px-4 py-3 text-left font-serif text-base leading-6 shadow-sticker transition hover:-translate-y-0.5 hover:shadow-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-orange/60"
              >
                {choice.label}
              </button>
            ))}
          </div>
        </TornPaperCard>
      ) : null}

    </>
  );
}
