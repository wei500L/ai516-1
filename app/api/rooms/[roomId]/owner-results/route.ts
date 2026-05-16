import { apiError, jsonResponse } from "@/lib/api/http";
import { getOwnerResultsService } from "@/lib/api/mock-services";
import {
  getOwnerResultsParamsSchema,
  getOwnerResultsResponseSchema
} from "@/lib/schemas/api";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = getOwnerResultsParamsSchema.safeParse(await context.params);

  if (!params.success) {
    return apiError("validation_error", "Invalid room id", 422, params.error.flatten());
  }

  const response = await getOwnerResultsService(params.data.roomId);

  return jsonResponse(getOwnerResultsResponseSchema, response);
}
