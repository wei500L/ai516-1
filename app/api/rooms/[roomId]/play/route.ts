import { apiError, jsonResponse } from "@/lib/api/http";
import { getRoomPlayService } from "@/lib/api/mock-services";
import type { GetRoomPlayResponse } from "@/lib/contracts/api";
import type { Json } from "@/lib/database.types";
import {
  getRoomPlayParamsSchema,
  getRoomPlayResponseSchema
} from "@/lib/schemas/api";
import {
  asRecord,
  getSupabaseServerConfig,
  supabaseRest
} from "@/lib/server/supabaseRest";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

type StoredRoomObject = {
  id?: unknown;
  name?: unknown;
  title?: unknown;
  visualDescription?: unknown;
  description?: unknown;
  clue?: unknown;
  imageUrl?: unknown;
};

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function readRoomJsonObjects(roomJson: Json): GetRoomPlayResponse["objects"] {
  const record = asRecord(roomJson);
  const objects = Array.isArray(record.objects) ? record.objects : [];

  return objects.map((item, index) => {
    const object = item as StoredRoomObject;
    const imageUrl =
      typeof object.imageUrl === "string" && object.imageUrl.trim().length > 0
        ? object.imageUrl
        : null;

    return {
      id: asString(object.id, `object_${index + 1}`),
      title: asString(object.name ?? object.title, `线索 ${index + 1}`),
      description: asString(
        object.clue ?? object.visualDescription ?? object.description,
        "这件物品还在等你靠近。"
      ),
      discovered: false,
      ...(imageUrl ? { imageUrl } : {})
    };
  });
}

function readChoices(roomJson: Json): GetRoomPlayResponse["choices"] {
  const record = asRecord(roomJson);
  const choices = Array.isArray(record.choices) ? record.choices : [];

  return choices.map((item, index) => {
    const choice = asRecord(item as Json);

    return {
      index:
        typeof choice.index === "number" && Number.isInteger(choice.index)
          ? choice.index
          : index,
      label: asString(choice.label, `选项 ${index + 1}`)
    };
  });
}

async function getPersistedRoomPlay(
  roomId: string
): Promise<GetRoomPlayResponse | null> {
  const config = getSupabaseServerConfig();

  if (!config) {
    return null;
  }

  const rows = await supabaseRest<
    Array<{
      id: string;
      public_title: string;
      visual_theme: string;
      room_json: Json;
    }>
  >(
    `rooms?id=eq.${encodeURIComponent(
      roomId
    )}&status=eq.active&visibility=in.(unlisted,public)&select=id,public_title,visual_theme,room_json&limit=1`,
    {
      method: "GET"
    },
    config
  );
  const room = rows[0];

  if (!room) {
    return null;
  }

  const roomJson = asRecord(room.room_json);
  const pet = asRecord((roomJson.pet ?? {}) as Json);

  return {
    roomId: room.id,
    publicTitle: room.public_title,
    visualTheme: room.visual_theme,
    objects: readRoomJsonObjects(room.room_json),
    imageClue: null,
    pet: {
      name: asString(pet.name, "纸团"),
      avatarUrl: null,
      mood: asString(pet.type, "curious"),
      maxHintLevel: 3
    },
    choices: readChoices(room.room_json),
    progress: {
      discoveredObjectIds: [],
      currentStep: "explore",
      hintLevelUsed: 0
    }
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const params = getRoomPlayParamsSchema.safeParse(await context.params);

  if (!params.success) {
    return apiError("validation_error", "Invalid room id", 422, params.error.flatten());
  }

  const response =
    (await getPersistedRoomPlay(params.data.roomId)) ??
    (await getRoomPlayService(params.data.roomId));

  return jsonResponse(getRoomPlayResponseSchema, response);
}
