import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import {
  adminLlmTestChatRequestSchema,
  adminLlmTestResultSchema
} from "@/lib/schemas/adminLlmConfig";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, adminLlmTestChatRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const startedAt = Date.now();
  const hasPrompt = parsed.data.messages.some((message) => message.content.trim());

  if (!hasPrompt) {
    return apiError("validation_error", "Empty test prompt", 422);
  }

  return jsonResponse(adminLlmTestResultSchema, {
    ok: true,
    latencyMs: Date.now() - startedAt,
    message: "Chat test accepted by the admin LLM endpoint.",
    error: null
  });
}

