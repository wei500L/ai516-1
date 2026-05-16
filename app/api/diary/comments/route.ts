import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { appendMemoryDocument } from "@/lib/diary/updateMemoryDocument";
import {
  containsUnsafeCommentContent,
  createDiaryRepository
} from "@/lib/diary/repository";
import {
  getRequestUserId,
  getSupabaseServerConfig,
  supabaseRest
} from "@/lib/server/supabaseRest";
import {
  createDiaryCommentRequestSchema,
  createDiaryCommentResponseSchema
} from "@/lib/schemas/api";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createDiaryCommentRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const currentUserId = getRequestUserId(request);

  if (!currentUserId) {
    return apiError("unauthorized", "Missing user context", 401);
  }

  if (containsUnsafeCommentContent(parsed.data.content)) {
    return apiError("validation_error", "Comment contains unsafe content", 422);
  }

  const config = getSupabaseServerConfig();

  if (!config) {
    return apiError(
      "server_not_configured",
      "Supabase service role is not configured",
      500
    );
  }

  const entries = await supabaseRest<
    Array<{
      id: string;
      owner_id: string;
      room_id: string | null;
      guess_attempt_id: string | null;
    }>
  >(
    `diary_entries?id=eq.${encodeURIComponent(
      parsed.data.diaryEntryId
    )}&select=id,owner_id,room_id,guess_attempt_id&limit=1`,
    { method: "GET" },
    config
  );
  const entry = entries[0];

  if (!entry) {
    return apiError("not_found", "Diary entry not found", 404);
  }

  let allowed = entry.owner_id === currentUserId;

  if (!allowed) {
    const access = await supabaseRest<Array<{ id: string }>>(
      `diary_access_requests?diary_entry_id=eq.${encodeURIComponent(
        entry.id
      )}&requester_id=eq.${encodeURIComponent(
        currentUserId
      )}&status=eq.approved&select=id&limit=1`,
      { method: "GET" },
      config
    );
    allowed = access.length > 0;
  }

  if (!allowed) {
    return apiError("forbidden", "Diary access is not approved", 403);
  }

  const rows = await supabaseRest<
    Array<{
      id: string;
      diary_entry_id: string;
      author_id: string;
      owner_id: string;
      content: string;
      created_at: string;
    }>
  >(
    "diary_comments",
    {
      method: "POST",
      body: JSON.stringify({
        diary_entry_id: entry.id,
        author_id: currentUserId,
        owner_id: entry.owner_id,
        content: parsed.data.content
      })
    },
    config
  );
  const comment = rows[0];

  await appendMemoryDocument({
    repository: createDiaryRepository(config),
    scope: {
      ownerId: entry.owner_id,
      scopeType: "room",
      scopeId: entry.room_id
    },
    eventMarkdown: `- 收到一条授权日记留言。`
  });

  if (currentUserId !== entry.owner_id) {
    await appendMemoryDocument({
      repository: createDiaryRepository(config),
      scope: {
        ownerId: currentUserId,
        scopeType: "room",
        scopeId: entry.room_id
      },
      eventMarkdown: `- 在授权日记片段下留下了一条留言。`
    });
  }

  return jsonResponse(
    createDiaryCommentResponseSchema,
    {
      comment: {
        id: comment.id,
        diaryEntryId: comment.diary_entry_id,
        authorId: comment.author_id,
        ownerId: comment.owner_id,
        content: comment.content,
        createdAt: comment.created_at
      }
    },
    201
  );
}
