import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { assertAdminAccess } from "@/lib/server/adminAccess";
import { assertRateLimit } from "@/lib/server/requestRateLimit";
import { getActiveLlmProviderSettingsRow } from "@/lib/server/llmSettingsRepository";
import { createProviderFromSettingsRow } from "@/lib/llm/provider/factory";
import {
  adminLlmTestChatRequestSchema,
  adminLlmTestResultSchema
} from "@/lib/schemas/adminLlmConfig";

export async function POST(request: Request) {
  const denied = assertAdminAccess(request);
  if (denied) return denied;

  const limited = assertRateLimit(
    `admin-llm-test-chat:${request.headers.get("x-user-id") ?? "anonymous"}`,
    6,
    60_000
  );

  if (limited) {
    return apiError("rate_limited", "Too many admin test requests", 429, {
      resetAt: new Date(limited).toISOString()
    });
  }

  const parsed = await parseJsonBody(request, adminLlmTestChatRequestSchema);
  if ("response" in parsed) return parsed.response;

  const active = await getActiveLlmProviderSettingsRow();
  if (!active) {
    return apiError("not_found", "No active LLM provider settings found", 404);
  }

  const provider = createProviderFromSettingsRow(active);
  const startedAt = Date.now();

  try {
    const result = await provider.chatCompletion({
      model: active.chat_model,
      messages: parsed.data.messages,
      responseFormat: active.enable_schema_validation
        ? {
            type: "json_object"
          }
        : undefined
    });

    return jsonResponse(adminLlmTestResultSchema, {
      ok: true,
      status: "ok",
      latencyMs: result.latencyMs ?? Date.now() - startedAt,
      message: "Chat completion test succeeded",
      error: null,
      modeSummary: [
        active.provider_name,
        active.base_url,
        active.chat_endpoint_path,
        active.chat_model
      ].join(" | ")
    });
  } catch (error) {
    return jsonResponse(adminLlmTestResultSchema, {
      ok: false,
      status: "error",
      latencyMs: Date.now() - startedAt,
      message: null,
      error: error instanceof Error ? error.message : "Chat completion test failed",
      modeSummary: [
        active.provider_name,
        active.base_url,
        active.chat_endpoint_path,
        active.chat_model
      ].join(" | ")
    });
  }
}

