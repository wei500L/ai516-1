import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { respondDiaryAccessRequestService } from "@/lib/api/mock-services";
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

  const response = await respondDiaryAccessRequestService(
    params.data.id,
    parsed.data
  );

  return jsonResponse(respondDiaryAccessRequestResponseSchema, response);
}
