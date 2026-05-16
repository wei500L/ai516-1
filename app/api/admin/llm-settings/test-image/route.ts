import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { assertAdminAccess } from "@/lib/server/adminAccess";
import { assertRateLimit } from "@/lib/server/requestRateLimit";
import { getActiveLlmProviderSettingsRow } from "@/lib/server/llmSettingsRepository";
import { createProviderFromSettingsRow } from "@/lib/llm/provider/factory";
import {
  adminLlmTestImageRequestSchema,
  adminLlmTestResultSchema
} from "@/lib/schemas/adminLlmConfig";

export async function POST(request: Request) {
  const denied = assertAdminAccess(request);
  if (denied) return denied;

  const limited = assertRateLimit(
    `admin-llm-test-image:${request.headers.get("x-user-id") ?? "anonymous"}`,
    4,
    60_000
  );

  if (limited) {
    return apiError("rate_limited", "Too many admin test requests", 429, {
      resetAt: new Date(limited).toISOString()
    });
  }

  const parsed = await parseJsonBody(request, adminLlmTestImageRequestSchema);
  if ("response" in parsed) return parsed.response;

  const active = await getActiveLlmProviderSettingsRow();
  if (!active) {
    return apiError("not_found", "No active LLM provider settings found", 404);
  }

  const provider = createProviderFromSettingsRow(active);
  const startedAt = Date.now();

  try {
    const result = await provider.imageGeneration({
      prompt: parsed.data.prompt,
      size: active.default_image_size,
      responseFormat: active.image_response_format
    });

    return jsonResponse(adminLlmTestResultSchema, {
      ok: true,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      message: `Image generation test succeeded with ${result.images.length} image(s)`,
      error: null,
      modeSummary: [
        active.provider_name,
        active.base_url,
        active.image_mode,
        active.image_endpoint_path,
        active.image_response_format
      ].join(" | ")
    });
  } catch (error) {
    return jsonResponse(adminLlmTestResultSchema, {
      ok: false,
      status: "error",
      latencyMs: Date.now() - startedAt,
      message: null,
      error: error instanceof Error ? error.message : "Image generation test failed",
      modeSummary: [
        active.provider_name,
        active.base_url,
        active.image_mode,
        active.image_endpoint_path,
        active.image_response_format
      ].join(" | ")
    });
  }
}

