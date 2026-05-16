import { jsonResponse, parseJsonBody } from "@/lib/api/http";
import { submitGuessService } from "@/lib/api/mock-services";
import {
  submitGuessRequestSchema,
  submitGuessResponseSchema
} from "@/lib/schemas/api";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, submitGuessRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const response = await submitGuessService(parsed.data);

  return jsonResponse(submitGuessResponseSchema, response, 201);
}
