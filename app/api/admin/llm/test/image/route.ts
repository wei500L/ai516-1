import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import {
  adminLlmTestImageRequestSchema,
  adminLlmTestResultSchema
} from "@/lib/schemas/adminLlmConfig";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, adminLlmTestImageRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const startedAt = Date.now();

  if (!parsed.data.prompt.trim()) {
    return apiError("validation_error", "Empty image prompt", 422);
  }

  return jsonResponse(adminLlmTestResultSchema, {
    ok: true,
    latencyMs: Date.now() - startedAt,
    message: "Image test accepted by the admin LLM endpoint.",
    error: null
  });
}

