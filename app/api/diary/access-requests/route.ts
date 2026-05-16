import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import {
  canRequestDiaryAccess,
  DEFAULT_DIARY_ACCESS_THRESHOLD
} from "@/lib/affinity/canRequestDiaryAccess";
import {
  getRequestUserId,
  getSupabaseServerConfig,
  supabaseRest
} from "@/lib/server/supabaseRest";
import {
  createDiaryAccessRequestRequestSchema,
  createDiaryAccessRequestResponseSchema
} from "@/lib/schemas/api";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(
    request,
    createDiaryAccessRequestRequestSchema
  );

  if ("response" in parsed) {
    return parsed.response;
  }

  const requesterId = getRequestUserId(request);

  if (!requesterId) {
    return apiError("unauthorized", "Missing user context", 401);
  }

  const config = getSupabaseServerConfig();

  if (!config) {
    return apiError(
      "server_not_configured",
      "Supabase service role is not configured",
      500
    );
  }

  const guesses = await supabaseRest<
    Array<{
      id: string;
      room_id: string;
      player_id: string | null;
      affinity_score: number | null;
    }>
  >(
    `guess_attempts?id=eq.${encodeURIComponent(
      parsed.data.guessId
    )}&select=id,room_id,player_id,affinity_score&limit=1`,
    { method: "GET" },
    config
  );
  const guess = guesses[0];

  if (!guess) {
    return apiError("not_found", "Guess not found", 404);
  }

  const decision = canRequestDiaryAccess({
    requesterId,
    roomId: parsed.data.roomId,
    guess: {
      id: guess.id,
      roomId: guess.room_id,
      playerId: guess.player_id,
      affinityScore: guess.affinity_score
    },
    threshold: DEFAULT_DIARY_ACCESS_THRESHOLD
  });

  if (!decision.allowed) {
    return apiError(
      "forbidden",
      `Diary access request denied: ${decision.reason}`,
      403,
      {
        threshold: decision.threshold
      }
    );
  }

  const rooms = await supabaseRest<Array<{ creator_id: string }>>(
    `rooms?id=eq.${encodeURIComponent(
      parsed.data.roomId
    )}&select=creator_id&limit=1`,
    { method: "GET" },
    config
  );
  const ownerId = rooms[0]?.creator_id;

  if (!ownerId) {
    return apiError("not_found", "Room not found", 404);
  }

  const diaryEntryId =
    parsed.data.diaryEntryId ??
    (
      await supabaseRest<Array<{ id: string }>>(
        `diary_entries?owner_id=eq.${encodeURIComponent(
          ownerId
        )}&room_id=eq.${encodeURIComponent(
          parsed.data.roomId
        )}&guess_attempt_id=eq.${encodeURIComponent(
          parsed.data.guessId
        )}&entry_type=eq.mutual_result&select=id&limit=1`,
        { method: "GET" },
        config
      )
    )[0]?.id;

  if (!diaryEntryId) {
    return apiError("not_found", "Shareable diary entry not found", 404);
  }

  const rows = await supabaseRest<Array<{ id: string; status: "pending" }>>(
    "diary_access_requests",
    {
      method: "POST",
      body: JSON.stringify({
        diary_entry_id: diaryEntryId,
        requester_id: requesterId,
        owner_id: ownerId,
        room_id: parsed.data.roomId,
        guess_attempt_id: parsed.data.guessId,
        message: parsed.data.message,
        status: "pending"
      })
    },
    config
  );

  return jsonResponse(
    createDiaryAccessRequestResponseSchema,
    {
      requestId: rows[0]?.id ?? "",
      status: "pending",
      threshold: decision.threshold
    },
    201
  );
}
