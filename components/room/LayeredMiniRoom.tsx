"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ClueNote } from "@/components/handbook/clue-note";
import { PolaroidCard } from "@/components/handbook/polaroid-card";
import { ProgressStickers } from "@/components/handbook/progress-stickers";
import { TornPaperCard } from "@/components/handbook/torn-paper-card";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { GuessAssetCard } from "@/components/prototype/guess-asset-card";
import { PetSprite } from "@/components/room/PetSprite";
import { RoomObjectSprite } from "@/components/room/RoomObjectSprite";
import type { AdaptedPublicRoom, MiniRoomObject } from "@/lib/adapters/roomPublicDataAdapter";
import { useTilt } from "@/lib/hooks/useTilt";
import { decor, generated } from "@/lib/prototype-assets";

type LayeredMiniRoomProps = {
  room: AdaptedPublicRoom;
};

function depthZ(y: number, layer?: number) {
  return Math.round(y * 10 + (layer ?? 0));
}

function fallbackDiscovered(progressIds: Set<string>, object: MiniRoomObject) {
  return object.discovered || progressIds.has(object.id);
}

function parallaxStyle(tilt: { x: number; y: number }, amount: number): CSSProperties {
  return {
    transform: `translate3d(${(tilt.x * amount).toFixed(2)}px, ${(tilt.y * amount).toFixed(2)}px, 0)`,
    transition: "transform 140ms ease-out",
    willChange: "transform"
  };
}

function PhotoRoomStage({
  room,
  selectedObject,
  discoveredIds,
  onSelectObject,
  onSelectPet
}: {
  room: AdaptedPublicRoom;
  selectedObject: MiniRoomObject | null;
  discoveredIds: Set<string>;
  onSelectObject: (object: MiniRoomObject) => void;
  onSelectPet: () => void;
}) {
  const sortedObjects = useMemo(
    () =>
      [...room.objects].sort(
        (a, b) => depthZ(a.position.y, a.position.layer) - depthZ(b.position.y, b.position.layer)
      ),
    [room.objects]
  );
  const petZ = depthZ(room.pet.position.y, room.pet.position.layer);
  const background = room.stage.backgroundAsset?.assetUrl || generated.room;
  const stageRef = useRef<HTMLDivElement>(null);
  const tilt = useTilt({ targetRef: stageRef });

  return (
    <div ref={stageRef} className="relative h-full overflow-visible" aria-label="线索小屋舞台">
      <div className="absolute left-1/2 top-0 aspect-[1659/948] w-full max-w-[520px] -translate-x-1/2">
        <div className="absolute inset-0" style={parallaxStyle(tilt, 3)}>
          {room.stage.backgroundAsset?.assetUrl ? (
            <img
              src={background}
              alt={room.stage.backgroundAsset.alt}
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(55,32,16,0.32)]"
              draggable={false}
            />
          ) : (
            <Image
              src={generated.room}
              alt=""
              fill
              sizes="430px"
              className="object-contain drop-shadow-[0_18px_24px_rgba(55,32,16,0.32)]"
            />
          )}
        </div>
        <motion.div
          animate={{ opacity: [0.32, 0.74, 0.36], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[51%] top-[23%] h-12 w-12 -translate-x-1/2 rounded-full bg-[#ffd470] blur-md"
        />
        <div className="absolute inset-0 z-30" style={parallaxStyle(tilt, 16)}>
          {sortedObjects.map((object) => (
            <RoomObjectSprite
              key={object.id}
              object={object}
              index={room.objects.findIndex((item) => item.id === object.id)}
              selected={selectedObject?.id === object.id}
              discovered={fallbackDiscovered(discoveredIds, object)}
              zIndex={depthZ(object.position.y, object.position.layer)}
              onSelect={onSelectObject}
            />
          ))}
          <PetSprite pet={room.pet} zIndex={petZ} onSelect={onSelectPet} />
        </div>
      </div>
    </div>
  );
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
            <PrototypeAsset src={decor.polaroidTaped} className="h-full w-full" />
          )}
        </PolaroidCard>
      ) : null}

      <section className="relative mt-7 h-[clamp(390px,49dvh,520px)]" aria-label="线索小屋">
        <PhotoRoomStage
          room={room}
          selectedObject={selectedObject}
          discoveredIds={discoveredIds}
          onSelectObject={selectObject}
          onSelectPet={() => {
            setPetOpen(true);
            setSelectedObject(null);
          }}
        />

        <div className="pointer-events-none absolute inset-0 z-[8000]">
          <AnimatePresence mode="wait">
            {selectedObject ? (
              <div className="absolute bottom-0 left-[8%] right-[8%]">
                <motion.div
                  key={selectedObject.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="pointer-events-auto"
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
              <div className="absolute bottom-0 left-[8%] right-[8%]">
                <motion.div
                  key="pet-note"
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="pointer-events-auto"
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
        </div>
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
            <PrototypeAsset src={decor.heart} className="h-5 w-5" />
            你觉得这句话更像是
          </div>
          <div className="grid gap-3">
            {room.choices.map((choice) => (
              <GuessAssetCard key={choice.index} className="min-h-16 py-3">
                <span className="block font-serif text-base leading-6">{choice.label}</span>
              </GuessAssetCard>
            ))}
          </div>
        </TornPaperCard>
      ) : null}
    </>
  );
}
