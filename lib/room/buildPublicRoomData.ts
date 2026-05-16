import type { GetRoomPlayResponse } from "../contracts/api";
import type { RoomJson } from "./buildRoomJson";

export type PublicRoomObject = RoomJson["objects"][number] & {
  title: string;
  description: string;
  discovered: false;
  imageUrl?: string | null;
};

export type PublicRoomData = Omit<
  RoomJson,
  | "roomTitle"
  | "hiddenMeaning"
  | "correctChoiceIndex"
  | "generation"
  | "objects"
  | "choices"
> & {
  objects: PublicRoomObject[];
  choices: Array<{
    index: number;
    id: string;
    label: string;
  }>;
  progress: GetRoomPlayResponse["progress"];
};

export function buildPublicRoomData(roomJson: RoomJson): PublicRoomData {
  const {
    roomTitle: _roomTitle,
    hiddenMeaning: _hiddenMeaning,
    correctChoiceIndex: _correctChoiceIndex,
    generation: _generation,
    ...safeRoom
  } = roomJson;

  return {
    ...safeRoom,
    objects: roomJson.objects.map((object) => ({
      ...object,
      title: object.name,
      description: object.clue,
      discovered: false,
      assetUrl: object.assetUrl || object.render.assetUrl || "",
      imageUrl: object.render.assetUrl || null
    })),
    choices: roomJson.choices.map((choice, index) => ({
      index,
      id: choice.id,
      label: choice.text
    })),
    progress: {
      discoveredObjectIds: [],
      currentStep: "explore",
      hintLevelUsed: 0
    }
  };
}

export function buildPlayApiResponse(roomJson: RoomJson): GetRoomPlayResponse {
  const publicRoom = buildPublicRoomData(roomJson);

  return {
    roomId: publicRoom.roomId,
    publicTitle: publicRoom.publicTitle,
    visualTheme: publicRoom.visualTheme,
    renderTarget: publicRoom.renderTarget,
    stage: publicRoom.stage,
    objects: publicRoom.objects,
    imageClue: publicRoom.imageClue
      ? {
          assetId: "image_clue",
          url: publicRoom.imageClue.assetUrl,
          alt: publicRoom.imageClue.clue,
          safeDescription: publicRoom.imageClue.clue
        }
      : null,
    pet: {
      name: publicRoom.pet.name,
      avatarUrl: null,
      mood: publicRoom.pet.type,
      maxHintLevel: 3,
      type: publicRoom.pet.type,
      position: publicRoom.pet.position,
      chatEnabled: publicRoom.pet.chatEnabled
    },
    choices: publicRoom.choices,
    progress: publicRoom.progress
  };
}
