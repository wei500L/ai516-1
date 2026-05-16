import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import {
  getRequestUserId,
  getSupabaseServerConfig,
  supabaseRest
} from "@/lib/server/supabaseRest";
import {
  respondDiaryAccessRequestParamsSchema,
  respondDiaryAccessRequestRequestSchema,
  respondDiaryAccessRequestResponseSchema
} from "@/lib/schemas/api";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const params = respondDiaryAccessRequestParamsSchema.safeParse(
    await context.params
  );

  if (!params.success) {
    return apiError(
      "validation_error",
      "Invalid access request id",
      422,
      params.error.flatten()
    );
  }

  const parsed = await parseJsonBody(
    request,
    respondDiaryAccessRequestRequestSchema
  );

  if ("response" in parsed) {
    return parsed.response;
  }

  const currentUserId = getRequestUserId(request);

  if (!currentUserId) {
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

  const requests = await supabaseRest<
    Array<{ id: string; owner_id: string; status: string }>
  >(
    `diary_access_requests?id=eq.${encodeURIComponent(
      params.data.id
    )}&select=id,owner_id,status&limit=1`,
    { method: "GET" },
    config
  );
  const accessRequest = requests[0];

  if (!accessRequest) {
    return apiError("not_found", "Diary access request not found", 404);
  }

  if (accessRequest.owner_id !== currentUserId) {
    return apiError("forbidden", "Only the diary owner can respond", 403);
  }

  const respondedAt = new Date().toISOString();

  await supabaseRest(
    `diary_access_requests?id=eq.${encodeURIComponent(params.data.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: parsed.data.status,
        responded_at: respondedAt
      })
    },
    config
  );

  return jsonResponse(respondDiaryAccessRequestResponseSchema, {
    requestId: params.data.id,
    status: parsed.data.status,
    respondedAt
  });
}
