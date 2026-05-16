import {
  adminLlmConfigDraftSchema,
  adminLlmConfigViewSchema,
  type AdminLlmConfigDraft
} from "@/lib/schemas/adminLlmConfig";
import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
  normalizeEndpointPath,
  normalizeServiceBaseUrl
} from "@/lib/server/llmKeyCrypto";
import { getSupabaseServerConfig, supabaseRest } from "@/lib/server/supabaseRest";

export type LlmProviderSettingsRow = {
  id: string;
  provider_name: string;
  base_url: string;
  api_key_encrypted: string;
  chat_model: string;
  image_model: string;
  chat_endpoint_path: string;
  image_endpoint_path: string;
  image_mode: "images_api" | "chat_completions_image_model";
  image_response_format: "url" | "b64_json" | "auto";
  default_image_size: "512x512" | "768x768" | "1024x1024";
  timeout_ms: number;
  max_concurrent_image_jobs: number;
  enable_semantic_analysis: boolean;
  enable_concurrent_image_generation: boolean;
  enable_schema_validation: boolean;
  global_visual_style_prompt: string;
  object_style_prompt: string;
  negative_prompt: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LlmProviderSettingsInput = AdminLlmConfigDraft;

export type LlmProviderSettingsView = AdminLlmConfigDraft & {
  id: string;
  isActive: boolean;
};

function getConfig() {
  return getSupabaseServerConfig();
}

function rowToView(row: LlmProviderSettingsRow): LlmProviderSettingsView {
  return adminLlmConfigViewSchema.parse({
    id: row.id,
    isActive: row.is_active,
    provider: {
      providerName: row.provider_name,
      baseUrl: row.base_url,
      apiKey: "",
      apiKeyMasked: maskApiKey(decryptApiKey(row.api_key_encrypted)),
      chatModel: row.chat_model,
      imageModel: row.image_model,
      defaultTimeoutMs: row.timeout_ms,
      maxConcurrentImageJobs: row.max_concurrent_image_jobs,
      enableSemanticAnalysis: row.enable_semantic_analysis,
      enableConcurrentImageGeneration: row.enable_concurrent_image_generation
    },
    chat: {
      chatEndpointPath: row.chat_endpoint_path,
      enableStructuredSchemaValidation: row.enable_schema_validation
    },
    image: {
      imageMode: row.image_mode,
      imagesEndpointPath: row.image_endpoint_path,
      imageResponseFormat: row.image_response_format,
      imageSize: row.default_image_size
    },
    style: {
      globalVisualStylePrompt: row.global_visual_style_prompt,
      style2dPrompt: row.object_style_prompt,
      miniatureHouseStylePrompt: row.global_visual_style_prompt,
      negativePrompt: row.negative_prompt
    }
  });
}

export function rowToDraft(row: LlmProviderSettingsRow): AdminLlmConfigDraft {
  const view = rowToView(row);
  return viewToPublicDraft(view);
}

function viewToInsertPayload(
  input: LlmProviderSettingsInput,
  existingEncryptedKey?: string | null
) {
  const apiKey =
    input.provider.apiKey.trim().length > 0
      ? input.provider.apiKey.trim()
      : existingEncryptedKey
        ? decryptApiKey(existingEncryptedKey)
        : null;

  if (!apiKey) {
    throw new Error("LLM_PROVIDER_API_KEY_REQUIRED");
  }

  const baseUrl = normalizeServiceBaseUrl(input.provider.baseUrl);
  const chatEndpointPath = normalizeEndpointPath(input.chat.chatEndpointPath);
  const imageEndpointPath = normalizeEndpointPath(input.image.imagesEndpointPath);

  return {
    provider_name: input.provider.providerName.trim(),
    base_url: baseUrl,
    api_key_encrypted: encryptApiKey(apiKey),
    chat_model: input.provider.chatModel.trim(),
    image_model: input.provider.imageModel.trim(),
    chat_endpoint_path: chatEndpointPath,
    image_endpoint_path: imageEndpointPath,
    image_mode: input.image.imageMode,
    image_response_format: input.image.imageResponseFormat,
    default_image_size: input.image.imageSize,
    timeout_ms: input.provider.defaultTimeoutMs,
    max_concurrent_image_jobs: input.provider.maxConcurrentImageJobs,
    enable_semantic_analysis: input.provider.enableSemanticAnalysis,
    enable_concurrent_image_generation:
      input.provider.enableConcurrentImageGeneration,
    enable_schema_validation: input.chat.enableStructuredSchemaValidation,
    global_visual_style_prompt: input.style.globalVisualStylePrompt.trim(),
    object_style_prompt: input.style.style2dPrompt.trim(),
    negative_prompt: input.style.negativePrompt?.trim() || null,
    is_active: input.isActive ?? true
  };
}

function viewToPublicDraft(view: LlmProviderSettingsView): AdminLlmConfigDraft {
  return {
    id: view.id,
    isActive: view.isActive,
    provider: {
      ...view.provider,
      apiKey: "",
      apiKeyMasked: view.provider.apiKeyMasked ?? null
    },
    chat: view.chat,
    image: view.image,
    style: view.style
  };
}

export async function listLlmProviderSettings() {
  const config = getConfig();

  if (!config) {
    return [];
  }

  const rows = await supabaseRest<LlmProviderSettingsRow[]>(
    "llm_provider_settings?select=*&order=updated_at.desc",
    { method: "GET" },
    config
  );

  return rows.map((row) => rowToDraft(row));
}

export async function getActiveLlmProviderSettings() {
  const config = getConfig();

  if (!config) {
    return null;
  }

  const rows = await supabaseRest<LlmProviderSettingsRow[]>(
    "llm_provider_settings?is_active=eq.true&select=*&limit=1",
    { method: "GET" },
    config
  );

  return rows[0] ? rowToDraft(rows[0]) : null;
}

export async function saveLlmProviderSettings(
  input: LlmProviderSettingsInput
) {
  const config = getConfig();

  if (!config) {
    throw new Error("SUPABASE_SERVER_CONFIG_MISSING");
  }

  const existing = input.id
    ? await supabaseRest<LlmProviderSettingsRow[]>(
        `llm_provider_settings?id=eq.${encodeURIComponent(input.id)}&select=*&limit=1`,
        { method: "GET" },
        config
      )
    : await getActiveRow(config);
  const existingRow = existing?.[0] ?? null;
  const payload = viewToInsertPayload(input, existingRow?.api_key_encrypted);
  const normalized = {
    ...payload,
    base_url: normalizeServiceBaseUrl(payload.base_url)
  };

  if (existingRow) {
    const rows = await supabaseRest<LlmProviderSettingsRow[]>(
      `llm_provider_settings?id=eq.${encodeURIComponent(existingRow.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(normalized)
      },
      config
    );
    const row = rows[0] ?? existingRow;

    if (normalized.is_active) {
      await supabaseRest(
        `llm_provider_settings?id=neq.${encodeURIComponent(row.id)}&is_active=eq.true`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: false })
        },
        config
      );
    }

    return rowToDraft(row);
  }

  const rows = await supabaseRest<LlmProviderSettingsRow[]>(
    "llm_provider_settings",
    {
      method: "POST",
      body: JSON.stringify(normalized)
    },
    config
  );
  const row = rows[0];

  if (!row) {
    throw new Error("LLM_PROVIDER_SETTINGS_SAVE_EMPTY");
  }

  if (normalized.is_active) {
    await supabaseRest(
      `llm_provider_settings?id=neq.${encodeURIComponent(row.id)}&is_active=eq.true`,
      {
        method: "PATCH",
        body: JSON.stringify({ is_active: false })
      },
      config
    );
  }

  return rowToDraft(row);
}

export async function getActiveLlmProviderSettingsRow() {
  const config = getConfig();

  if (!config) {
    return null;
  }

  const rows = await supabaseRest<LlmProviderSettingsRow[]>(
    "llm_provider_settings?is_active=eq.true&select=*&limit=1",
    { method: "GET" },
    config
  );

  return rows[0] ?? null;
}

async function getActiveRow(config: NonNullable<ReturnType<typeof getConfig>>) {
  const rows = await supabaseRest<LlmProviderSettingsRow[]>(
    "llm_provider_settings?is_active=eq.true&select=*&limit=1",
    { method: "GET" },
    config
  );

  return rows;
}

export async function resetLlmProviderSettings() {
  const config = getConfig();

  if (!config) {
    throw new Error("SUPABASE_SERVER_CONFIG_MISSING");
  }

  const defaults = createDefaultLlmProviderSettingsDraft();
  const saved = await saveLlmProviderSettings(defaults);
  return saved;
}

export function createDefaultLlmProviderSettingsDraft(): AdminLlmConfigDraft {
  return adminLlmConfigDraftSchema.parse({
    id: null,
    isActive: true,
    provider: {
      providerName: "OpenAI Compatible",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      apiKeyMasked: null,
      chatModel: "gpt-4o-mini",
      imageModel: "gpt-image-1",
      defaultTimeoutMs: 30000,
      maxConcurrentImageJobs: 3,
      enableSemanticAnalysis: true,
      enableConcurrentImageGeneration: true
    },
    chat: {
      chatEndpointPath: "/v1/chat/completions",
      enableStructuredSchemaValidation: true
    },
    image: {
      imageMode: "images_api",
      imagesEndpointPath: "/v1/images/generations",
      imageResponseFormat: "auto",
      imageSize: "1024x1024"
    },
    style: {
      globalVisualStylePrompt:
        "旧纸、信封、胶带、撕边纸片、暖光、纸板微缩小屋、手账感。",
      style2dPrompt:
        "2.5D 微缩模型，适合前端拼接，不要大场景，不要赛博感。",
      miniatureHouseStylePrompt:
        "纸板小屋、旧纸边缘、手作痕迹、温柔低饱和、带一点生活气。",
      negativePrompt: "科技感, 赛博风, 玻璃拟态, 霓虹, 金属UI"
    }
  });
}

export function normalizeLlmProviderSettingsDraft(
  input: Partial<AdminLlmConfigDraft> | null | undefined
) {
  const draft = createDefaultLlmProviderSettingsDraft();

  if (!input) {
    return draft;
  }

  return adminLlmConfigDraftSchema.parse({
    ...draft,
    ...input,
    provider: {
      ...draft.provider,
      ...(input.provider ?? {})
    },
    chat: {
      ...draft.chat,
      ...(input.chat ?? {})
    },
    image: {
      ...draft.image,
      ...(input.image ?? {})
    },
    style: {
      ...draft.style,
      ...(input.style ?? {})
    }
  });
}

export function createOpenAiCompatibleProviderConfigFromView(
  view: LlmProviderSettingsView
) {
  return {
    id: view.id,
    providerName: view.provider.providerName,
    baseUrl: view.provider.baseUrl,
    apiKey: view.provider.apiKey,
    chatModel: view.provider.chatModel,
    imageModel: view.provider.imageModel,
    chatEndpointPath: view.chat.chatEndpointPath,
    imageEndpointPath: view.image.imagesEndpointPath,
    imageMode: view.image.imageMode,
    imageResponseFormat: view.image.imageResponseFormat,
    defaultImageSize: view.image.imageSize,
    timeoutMs: view.provider.defaultTimeoutMs,
    maxConcurrentImageJobs: view.provider.maxConcurrentImageJobs,
    enableSemanticAnalysis: view.provider.enableSemanticAnalysis,
    enableSchemaValidation: view.chat.enableStructuredSchemaValidation,
    globalVisualStylePrompt: view.style.globalVisualStylePrompt,
    objectStylePrompt: view.style.style2dPrompt,
    negativePrompt: view.style.negativePrompt,
    isActive: view.isActive
  };
}
