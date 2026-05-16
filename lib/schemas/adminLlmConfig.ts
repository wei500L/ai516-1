import { z } from "zod";

export const adminLlmImageModeSchema = z.enum([
  "images_api",
  "chat_completions_image_model"
]);

export const adminLlmImageResponseFormatSchema = z.enum([
  "url",
  "b64_json",
  "auto"
]);

export const adminLlmImageSizeSchema = z.enum([
  "512x512",
  "768x768",
  "1024x1024"
]);

export const adminLlmProviderConfigSchema = z
  .object({
    providerName: z.string().trim().min(1).max(64),
    baseUrl: z.string().trim().url(),
    apiKey: z.string().trim().min(1).max(512),
    apiKeyMasked: z.string().trim().max(64).nullable().optional(),
    chatModel: z.string().trim().min(1).max(128),
    imageModel: z.string().trim().min(1).max(128),
    defaultTimeoutMs: z.number().int().min(1000).max(120000),
    maxConcurrentImageJobs: z.number().int().min(1).max(12),
    enableSemanticAnalysis: z.boolean(),
    enableConcurrentImageGeneration: z.boolean()
  })
  .strict();

export const adminLlmProviderDraftSchema = z
  .object({
    providerName: z.string().trim().min(1).max(64),
    baseUrl: z.string().trim().url(),
    apiKey: z.string().trim().max(512),
    apiKeyMasked: z.string().trim().max(64).nullable().optional(),
    chatModel: z.string().trim().min(1).max(128),
    imageModel: z.string().trim().min(1).max(128),
    defaultTimeoutMs: z.number().int().min(1000).max(120000),
    maxConcurrentImageJobs: z.number().int().min(1).max(12),
    enableSemanticAnalysis: z.boolean(),
    enableConcurrentImageGeneration: z.boolean()
  })
  .strict();

export const adminLlmChatConfigSchema = z
  .object({
    chatEndpointPath: z.string().trim().min(1).max(128),
    enableStructuredSchemaValidation: z.boolean()
  })
  .strict();

export const adminLlmImageConfigSchema = z
  .object({
    imageMode: adminLlmImageModeSchema,
    imagesEndpointPath: z.string().trim().min(1).max(128),
    imageResponseFormat: adminLlmImageResponseFormatSchema,
    imageSize: adminLlmImageSizeSchema
  })
  .strict();

export const adminLlmStyleConfigSchema = z
  .object({
    globalVisualStylePrompt: z.string().trim().min(1).max(4000),
    style2dPrompt: z.string().trim().min(1).max(4000),
    miniatureHouseStylePrompt: z.string().trim().min(1).max(4000),
    negativePrompt: z.string().trim().max(4000).nullable()
  })
  .strict();

export const adminLlmConfigSchema = z
  .object({
    id: z.string().trim().min(1).max(80).nullable().optional(),
    provider: adminLlmProviderConfigSchema,
    chat: adminLlmChatConfigSchema,
    image: adminLlmImageConfigSchema,
    style: adminLlmStyleConfigSchema,
    isActive: z.boolean().optional()
  })
  .strict();

export const adminLlmConfigDraftSchema = z
  .object({
    id: z.string().trim().min(1).max(80).nullable().optional(),
    provider: adminLlmProviderDraftSchema,
    chat: adminLlmChatConfigSchema,
    image: adminLlmImageConfigSchema,
    style: adminLlmStyleConfigSchema,
    isActive: z.boolean().optional()
  })
  .strict();

export const adminLlmConfigViewSchema = adminLlmConfigDraftSchema.extend({
  id: z.string().trim().min(1).max(80),
  isActive: z.boolean()
});

export const adminLlmTestChatRequestSchema = z
  .object({
    messages: z.array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1).max(4000)
      })
    )
  })
  .strict();

export const adminLlmTestImageRequestSchema = z
  .object({
    prompt: z.string().min(1).max(4000)
  })
  .strict();

export const adminLlmTestResultSchema = z
  .object({
    ok: z.boolean(),
    status: z.enum(["ok", "error"]).optional(),
    latencyMs: z.number().int().nonnegative(),
    message: z.string().max(2000).nullable(),
    error: z.string().max(2000).nullable(),
    modeSummary: z.string().max(1000).optional()
  })
  .strict();

export type AdminLlmImageMode = z.infer<typeof adminLlmImageModeSchema>;
export type AdminLlmImageResponseFormat = z.infer<
  typeof adminLlmImageResponseFormatSchema
>;
export type AdminLlmImageSize = z.infer<typeof adminLlmImageSizeSchema>;
export type AdminLlmProviderConfig = z.infer<
  typeof adminLlmProviderConfigSchema
>;
export type AdminLlmProviderDraft = z.infer<typeof adminLlmProviderDraftSchema>;
export type AdminLlmChatConfig = z.infer<typeof adminLlmChatConfigSchema>;
export type AdminLlmImageConfig = z.infer<typeof adminLlmImageConfigSchema>;
export type AdminLlmStyleConfig = z.infer<typeof adminLlmStyleConfigSchema>;
export type AdminLlmConfig = z.infer<typeof adminLlmConfigSchema>;
export type AdminLlmConfigDraft = z.infer<typeof adminLlmConfigDraftSchema>;
export type AdminLlmConfigView = z.infer<typeof adminLlmConfigViewSchema>;
export type AdminLlmTestChatRequest = z.infer<
  typeof adminLlmTestChatRequestSchema
>;
export type AdminLlmTestImageRequest = z.infer<
  typeof adminLlmTestImageRequestSchema
>;
export type AdminLlmTestResult = z.infer<typeof adminLlmTestResultSchema>;

export function createDefaultAdminLlmConfigDraft(): AdminLlmConfigDraft {
  return adminLlmConfigDraftSchema.parse({
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
      chatEndpointPath: "/chat/completions",
      enableStructuredSchemaValidation: true
    },
    image: {
      imageMode: "images_api",
      imagesEndpointPath: "/images/generations",
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
    },
    isActive: true
  });
}
