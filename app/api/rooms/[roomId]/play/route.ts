import { apiError, jsonResponse } from "@/lib/api/http";
import { getRoomPlayService } from "@/lib/api/mock-services";
import {
  getRoomPlayParamsSchema,
  getRoomPlayResponseSchema
} from "@/lib/schemas/api";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = getRoomPlayParamsSchema.safeParse(await context.params);

  if (!params.success) {
    return apiError("validation_error", "Invalid room id", 422, params.error.flatten());
  }

  const response = await getRoomPlayService(params.data.roomId);

  return jsonResponse(getRoomPlayResponseSchema, response);
}
