import type {
  ObjectImageJobResult,
  ObjectImageJobSuccess
} from "../llm/imageJobs/runObjectImageJobs";
import type {
  RoomDesign,
  SemanticAnalysis
} from "../llm/pipeline/types";
import {
  getLayoutForObject,
  getStageForTheme,
  type RoomObjectPosition,
  type RoomObjectRender,
  type RoomStage
} from "./layoutRules";

export type RoomInteractionType = "tap" | "tap_note" | "tap_reveal";

export type RoomJsonObject = {
  id: string;
  name: string;
  clue: string;
  keyword: string;
  position: RoomObjectPosition;
  render: RoomObjectRender;
  interactionType: RoomInteractionType;
};

export type RoomJsonChoice = {
  id: string;
  text: string;
};

export type RoomJsonPet = {
  type: "cat" | "dog";
  name: string;
  position: RoomObjectPosition;
  chatEnabled: true;
  personality?: string;
};

export type RoomJson = {
  schemaVersion: 1;
  renderTarget: "2.5d_miniature_cabin";
  roomId: string;
  roomTitle: string;
  publicTitle: string;
  emotionType: string;
  visualTheme: string;
  stage: RoomStage;
  objects: RoomJsonObject[];
  imageClue?: {
    assetUrl: string;
    clue: string;
  };
  pet: RoomJsonPet;
  choices: RoomJsonChoice[];
  correctChoiceIndex: number;
  hiddenMeaning: string;
  endingLine: string;
  shareText: string;
  generation?: Record<string, unknown>;
};

type LegacyRoomObject = {
  id: string;
  name: string;
  clue: string;
  keyword: string;
  assetKey?: string;
  positionHint?: string;
  interactionType?: string;
  imageUrl?: string | null;
  imageStoragePath?: string | null;
};

type LegacyChoice = {
  id: string;
  text: string;
  isCorrect?: boolean;
};

type LegacyRoom = {
  roomTitle: string;
  publicTitle: string;
  emotionType: string;
  visualTheme: string;
  hiddenMeaning: string;
  objects: LegacyRoomObject[];
  choices: LegacyChoice[];
  endingLine: string;
  shareText: string;
  pet: {
    type: string;
    name: string;
    personality?: string;
  };
};

export type BuildRoomJsonInput = {
  roomId: string;
  originalSentence?: string;
  semanticAnalysis?: Partial<SemanticAnalysis> & {
    hiddenMeaning?: string;
    coreEmotion?: string;
    implicitNeed?: string;
  };
  roomDesign?: RoomDesign;
  room?: LegacyRoom;
  objectAssets?: ObjectImageJobResult[];
  imageClue?: {
    assetUrl: string | null;
    clue: string | null;
  } | null;
  generation?: Record<string, unknown>;
};

function isSuccessfulAsset(
  result: ObjectImageJobResult
): result is ObjectImageJobSuccess {
  return result.status === "success";
}

function buildAssetMap(input: BuildRoomJsonInput) {
  const map = new Map<string, string>();

  input.objectAssets?.forEach((asset) => {
    if (isSuccessfulAsset(asset) && asset.publicUrl) {
      map.set(asset.objectId, asset.publicUrl);
    }
  });

  input.room?.objects.forEach((object) => {
    if (object.imageUrl) {
      map.set(object.id, object.imageUrl);
    }
  });

  return map;
}

function normalizeInteractionType(value: string | undefined): RoomInteractionType {
  if (value === "open" || value === "inspect") {
    return "tap_note";
  }

  if (value === "turn" || value === "drag") {
    return "tap_reveal";
  }

  return value === "tap_note" || value === "tap_reveal" ? value : "tap";
}

function normalizePetType(value: string | undefined): "cat" | "dog" {
  return value === "dog" ? "dog" : "cat";
}

function buildChoices(input: BuildRoomJsonInput): RoomJsonChoice[] {
  const sourceChoices =
    input.roomDesign?.choiceOptions ??
    input.room?.choices.map((choice) => ({
      id: choice.id,
      text: choice.text
    })) ??
    [];

  return sourceChoices.map((choice, index) => ({
    id: choice.id || `choice_${index + 1}`,
    text: choice.text
  }));
}

function getCorrectChoiceIndex(input: BuildRoomJsonInput) {
  if (typeof input.roomDesign?.correctChoiceIndex === "number") {
    return input.roomDesign.correctChoiceIndex;
  }

  const legacyIndex =
    input.room?.choices.findIndex((choice) => choice.isCorrect) ?? -1;

  return legacyIndex >= 0 ? legacyIndex : 0;
}

function buildObjects(input: BuildRoomJsonInput): RoomJsonObject[] {
  const visualTheme =
    input.roomDesign?.visualTheme ?? input.room?.visualTheme ?? "old_paper_dollhouse";
  const assetByObjectId = buildAssetMap(input);
  const usedSlotKeys = new Set<
    Parameters<typeof getLayoutForObject>[3] extends Set<infer T> ? T : never
  >();
  const concepts =
    input.roomDesign?.objectConcepts ??
    input.room?.objects.map((object) => ({
      id: object.id,
      name: object.name,
      clue: object.clue,
      keyword: object.keyword,
      positionHint: object.positionHint ?? "",
      preferredAssetType: object.assetKey ?? "other",
      interactionType: object.interactionType
    })) ??
    [];

  return concepts.map((object, index) => {
    const layout = getLayoutForObject(object, index, visualTheme, usedSlotKeys);
    const assetUrl = assetByObjectId.get(object.id) ?? "";

    return {
      id: object.id || `object_${index + 1}`,
      name: object.name,
      clue: object.clue,
      keyword: object.keyword,
      position: layout.position,
      render: {
        assetUrl,
        width: layout.render.width,
        height: layout.render.height,
        style: layout.render.style,
        interactive: true
      },
      interactionType: normalizeInteractionType(
        "interactionType" in object ? object.interactionType : undefined
      )
    };
  });
}

export function buildRoomJson(input: BuildRoomJsonInput): RoomJson {
  const design = input.roomDesign;
  const room = input.room;
  const visualTheme = design?.visualTheme ?? room?.visualTheme ?? "old_paper_dollhouse";
  const petHints = design?.petPersonaHints;
  const pet = room?.pet;
  const hiddenMeaning =
    input.semanticAnalysis?.hiddenMeaning ??
    room?.hiddenMeaning ??
    input.semanticAnalysis?.implicitNeed ??
    "";
  const imageClue =
    input.imageClue?.assetUrl && input.imageClue.clue
      ? {
          assetUrl: input.imageClue.assetUrl,
          clue: input.imageClue.clue
        }
      : undefined;

  return {
    schemaVersion: 1,
    renderTarget: "2.5d_miniature_cabin",
    roomId: input.roomId,
    roomTitle: design?.roomTitle ?? room?.roomTitle ?? "心事小屋",
    publicTitle: design?.publicTitle ?? room?.publicTitle ?? "一间等待被读懂的小屋",
    emotionType:
      design?.emotionType ??
      room?.emotionType ??
      input.semanticAnalysis?.coreEmotion ??
      "未命名情绪",
    visualTheme,
    stage: getStageForTheme(visualTheme),
    objects: buildObjects(input),
    ...(imageClue ? { imageClue } : {}),
    pet: {
      type: normalizePetType(petHints?.type ?? pet?.type),
      name: petHints?.type === "dog"
        ? pet?.name ?? "纸团"
        : pet?.name ?? "纸团",
      position: { x: 82, y: 80, z: 10, layer: 48 },
      chatEnabled: true,
      personality:
        pet?.personality ??
        petHints?.temperament ??
        "温柔、谨慎，只围绕线索提示"
    },
    choices: buildChoices(input),
    correctChoiceIndex: getCorrectChoiceIndex(input),
    hiddenMeaning,
    endingLine: room?.endingLine ?? "有些话被轻轻放回了灯下。",
    shareText: room?.shareText ?? "我做了一间心事小屋，想邀请你来看看。",
    ...(input.generation ? { generation: input.generation } : {})
  };
}
