import {
  createOpenAiCompatibleProvider
} from "@/lib/llm/provider/openaiCompatibleProvider";
import type {
  LlmProvider,
  OpenAiCompatibleProviderConfig
} from "@/lib/llm/provider/types";
import type { LlmProviderSettingsRow } from "@/lib/server/llmSettingsRepository";
import { decryptApiKey } from "@/lib/server/llmKeyCrypto";

export function createProviderFromSettingsRow(
  row: LlmProviderSettingsRow
): LlmProvider {
  const config: OpenAiCompatibleProviderConfig = {
    providerName: row.provider_name,
    baseUrl: row.base_url,
    apiKey: decryptApiKey(row.api_key_encrypted),
    chatModel: row.chat_model,
    imageModel: row.image_model,
    chatEndpointPath: row.chat_endpoint_path,
    imageEndpointPath: row.image_endpoint_path,
    imageMode: row.image_mode,
    imageResponseFormat: row.image_response_format,
    defaultImageSize: row.default_image_size as
      | "512x512"
      | "768x768"
      | "1024x1024",
    timeoutMs: row.timeout_ms,
    maxConcurrentImageJobs: row.max_concurrent_image_jobs,
    enableSemanticAnalysis: row.enable_semantic_analysis,
    enableSchemaValidation: row.enable_schema_validation,
    globalVisualStylePrompt: row.global_visual_style_prompt,
    objectStylePrompt: row.object_style_prompt,
    negativePrompt: row.negative_prompt,
    isActive: row.is_active
  };

  return createOpenAiCompatibleProvider(config);
}

