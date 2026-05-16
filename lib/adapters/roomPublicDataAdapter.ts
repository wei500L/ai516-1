import type { GetRoomPlayResponse } from "@/lib/contracts/api";

export type MiniRoomPosition = {
  x: number;
  y: number;
  z?: number;
  layer: number;
};

export type MiniRoomRender = {
  assetUrl: string | null;
  width: number;
  height: number;
  style: string;
  interactive: true;
};

export type MiniRoomObject = {
  id: string;
  name: string;
  clue: string;
  keyword: string;
  discovered: boolean;
  position: MiniRoomPosition;
  render: MiniRoomRender;
  interactionType: "tap" | "tap_note" | "tap_reveal";
};

export type MiniRoomPet = {
  type: "cat" | "dog";
  name: string;
  position: MiniRoomPosition;
  chatEnabled: boolean;
};

export type MiniRoomStage = {
  backgroundStyle: string;
  roomShellType: string;
  lighting: string;
  floorStyle: string;
};

export type AdaptedPublicRoom = {
  roomId: string;
  publicTitle: string;
  visualTheme: string;
  renderTarget: "2.5d_miniature_cabin";
  stage: MiniRoomStage;
  objects: MiniRoomObject[];
  imageClue: GetRoomPlayResponse["imageClue"];
  pet: MiniRoomPet;
  choices: NonNullable<GetRoomPlayResponse["choices"]>;
  progress: GetRoomPlayResponse["progress"];
};

const fallbackStage: MiniRoomStage = {
  backgroundStyle: "aged-paper-backdrop-with-taped-corners",
  roomShellType: "open-front-cardboard-dollhouse",
  lighting: "soft-warm-desk-lamp",
  floorStyle: "folded-kraft-paper-floor"
};

const fallbackPositions: MiniRoomPosition[] = [
  { x: 50, y: 76, z: 8, layer: 42 },
  { x: 25, y: 35, z: 28, layer: 18 },
  { x: 22, y: 58, z: 16, layer: 32 },
  { x: 72, y: 40, z: 28, layer: 22 },
  { x: 82, y: 58, z: 18, layer: 34 }
];

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function adaptPosition(
  position: GetRoomPlayResponse["objects"][number]["position"] | undefined,
  index: number
): MiniRoomPosition {
  const fallback = fallbackPositions[index % fallbackPositions.length];

  return {
    x: clampPercent(finiteNumber(position?.x, fallback.x)),
    y: clampPercent(finiteNumber(position?.y, fallback.y)),
    z: finiteNumber(position?.z, fallback.z ?? 0),
    layer: Math.round(finiteNumber(position?.layer, fallback.layer))
  };
}

function adaptRender(
  object: GetRoomPlayResponse["objects"][number],
  index: number
): MiniRoomRender {
  const render = object.render;
  const fallbackWidth = index === 0 ? 148 : 124;
  const fallbackHeight = index === 0 ? 116 : 130;
  const assetUrl =
    render?.assetUrl?.trim() || object.imageUrl?.trim() || null;

  return {
    assetUrl,
    width: Math.max(72, Math.min(180, finiteNumber(render?.width, fallbackWidth))),
    height: Math.max(72, Math.min(180, finiteNumber(render?.height, fallbackHeight))),
    style: render?.style?.trim() || "paper-cutout-prop",
    interactive: true
  };
}

function adaptPet(room: GetRoomPlayResponse): MiniRoomPet {
  const type = room.pet.type ?? (room.pet.mood === "dog" ? "dog" : "cat");

  return {
    type,
    name: room.pet.name,
    position: {
      x: clampPercent(finiteNumber(room.pet.position?.x, 84)),
      y: clampPercent(finiteNumber(room.pet.position?.y, 80)),
      z: finiteNumber(room.pet.position?.z, 8),
      layer: Math.round(finiteNumber(room.pet.position?.layer, 50))
    },
    chatEnabled: room.pet.chatEnabled ?? true
  };
}

export function adaptRoomPublicData(
  room: GetRoomPlayResponse
): AdaptedPublicRoom {
  return {
    roomId: room.roomId,
    publicTitle: room.publicTitle,
    visualTheme: room.visualTheme,
    renderTarget: room.renderTarget ?? "2.5d_miniature_cabin",
    stage: room.stage ?? fallbackStage,
    objects: room.objects.map((object, index) => ({
      id: object.id,
      name: object.name ?? object.title,
      clue: object.clue ?? object.description,
      keyword: object.keyword ?? "",
      discovered: object.discovered,
      position: adaptPosition(object.position, index),
      render: adaptRender(object, index),
      interactionType: object.interactionType ?? "tap_note"
    })),
    imageClue: room.imageClue,
    pet: adaptPet(room),
    choices: room.choices ?? [],
    progress: room.progress
  };
}
