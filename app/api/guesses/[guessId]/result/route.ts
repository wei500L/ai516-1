import { apiError, jsonResponse } from "@/lib/api/http";
import { getGuessResultService } from "@/lib/api/mock-services";
import {
  getGuessResultParamsSchema,
  getGuessResultResponseSchema
} from "@/lib/schemas/api";

type RouteContext = {
  params: Promise<{
    guessId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = getGuessResultParamsSchema.safeParse(await context.params);

  if (!params.success) {
    return apiError("validation_error", "Invalid guess id", 422, params.error.flatten());
  }

  const response = await getGuessResultService(params.data.guessId);

  return jsonResponse(getGuessResultResponseSchema, response);
}
