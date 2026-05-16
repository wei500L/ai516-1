export type LlmMessageRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmMessageRole;
  content: string;
};

export type ChatCompletionRequest = {
  model: string;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?:
    | {
        type: "json_object";
      }
    | {
        type: "json_schema";
        name: string;
        schema: Record<string, unknown>;
        strict?: boolean;
      };
};

export type ChatCompletionResult = {
  raw: unknown;
  model: string | null;
  content: string;
  latencyMs: number;
};

export type NormalizedImageItem = {
  type: "url" | "base64";
  mimeType?: string;
  url?: string;
  base64?: string;
};

export type NormalizedImageResponse = {
  images: NormalizedImageItem[];
  raw: unknown;
};

export type ImageGenerationRequest = {
  prompt: string;
  size?: string;
  responseFormat?: "url" | "b64_json" | "auto";
};

export type OpenAiCompatibleProviderConfig = {
  providerName: string;
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  imageModel: string;
  chatEndpointPath: string;
  imageEndpointPath: string;
  imageMode: "images_api" | "chat_completions_image_model";
  imageResponseFormat: "url" | "b64_json" | "auto";
  defaultImageSize: "512x512" | "768x768" | "1024x1024";
  timeoutMs: number;
  maxConcurrentImageJobs: number;
  enableSemanticAnalysis: boolean;
  enableSchemaValidation: boolean;
  globalVisualStylePrompt: string;
  objectStylePrompt: string;
  negativePrompt: string | null;
  isActive?: boolean;
};

export type LlmProvider = {
  readonly kind: "openai_compatible";
  readonly config: OpenAiCompatibleProviderConfig;
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResult>;
  imageGeneration(request: ImageGenerationRequest): Promise<NormalizedImageResponse>;
  normalizeImageResponse(raw: unknown): NormalizedImageResponse;
};

