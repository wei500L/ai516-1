import type {
  ChatCompletionRequest,
  ImageGenerationRequest,
  LlmProvider,
  NormalizedImageItem,
  NormalizedImageResponse,
  OpenAiCompatibleProviderConfig
} from "@/lib/llm/provider/types";
import {
  joinOpenAiCompatibleUrl,
  normalizeEndpointPath
} from "@/lib/server/llmKeyCrypto";

type RetryPolicy = {
  attempts: number;
  backoffMs: number;
};

const imageLimiters = new Map<string, PromiseLimiter>();

class PromiseLimiter {
  private active = 0;
  private readonly queue: Array<{
    run: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(private readonly limit: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      return new Promise<T>((resolve, reject) => {
        this.queue.push({
          run: task as () => Promise<unknown>,
          resolve: resolve as (value: unknown) => void,
          reject
        });
      });
    }

    this.active += 1;

    try {
      return await task();
    } finally {
      this.active -= 1;
      const next = this.queue.shift();

      if (next) {
        void this.run(() => next.run())
          .then(next.resolve)
          .catch(next.reject);
      }
    }
  }
}

function getImageLimiter(config: OpenAiCompatibleProviderConfig) {
  const key = [
    config.providerName,
    config.baseUrl,
    config.imageModel,
    config.maxConcurrentImageJobs
  ].join("|");
  const existing = imageLimiters.get(key);

  if (existing) {
    return existing;
  }

  const created = new PromiseLimiter(config.maxConcurrentImageJobs);
  imageLimiters.set(key, created);
  return created;
}

function buildUrl(config: OpenAiCompatibleProviderConfig, endpointPath: string) {
  return joinOpenAiCompatibleUrl(config.baseUrl, endpointPath);
}

function redactedApiKey(key: string) {
  if (key.length <= 8) {
    return "********";
  }

  return `${key.slice(0, 3)}********${key.slice(-4)}`;
}

function extractTextFromContent(content: unknown): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const parts = content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (!part || typeof part !== "object") {
          return "";
        }

        const record = part as Record<string, unknown>;

        if (typeof record.text === "string") {
          return record.text;
        }

        if (typeof record.content === "string") {
          return record.content;
        }

        if (typeof record.url === "string") {
          return JSON.stringify({ url: record.url });
        }

        if (record.image_url && typeof record.image_url === "object") {
          const imageUrl = record.image_url as Record<string, unknown>;

          if (typeof imageUrl.url === "string") {
            return JSON.stringify({ url: imageUrl.url });
          }
        }

        if (
          typeof record.b64_json === "string" ||
          typeof record.base64 === "string" ||
          typeof record.image === "string"
        ) {
          return JSON.stringify({
            b64_json:
              typeof record.b64_json === "string"
                ? record.b64_json
                : typeof record.base64 === "string"
                  ? record.base64
                  : record.image
          });
        }

        return "";
      })
      .filter(Boolean)
      .join("");

    return parts.trim() ? parts : null;
  }

  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>;

    if (typeof record.text === "string") {
      return record.text;
    }

    if (typeof record.content === "string") {
      return record.content;
    }

    if (typeof record.url === "string") {
      return JSON.stringify({ url: record.url });
    }

    if (
      typeof record.b64_json === "string" ||
      typeof record.base64 === "string" ||
      typeof record.image === "string"
    ) {
      return JSON.stringify({
        b64_json:
          typeof record.b64_json === "string"
            ? record.b64_json
            : typeof record.base64 === "string"
              ? record.base64
              : record.image
      });
    }
  }

  return null;
}

function extractChatCompletionText(payload: unknown) {
  const record = payload as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };

  const text = extractTextFromContent(record.choices?.[0]?.message?.content);

  if (!text) {
    throw new Error("OPENAI_COMPATIBLE_CHAT_TEXT_MISSING");
  }

  return text;
}

function extractJsonLikeText(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (fenced?.[1]) {
      return JSON.parse(fenced[1]);
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    return trimmed;
  }
}

function normalizeBase64Payload(value: string) {
  const dataUrl = value.match(/^data:([^;]+);base64,(.+)$/);

  if (dataUrl) {
    return {
      mimeType: dataUrl[1],
      base64: dataUrl[2]
    };
  }

  return {
    mimeType: "image/png",
    base64: value
  };
}

function imageItemFromCandidate(candidate: unknown): NormalizedImageItem | null {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return {
        type: "url",
        url: trimmed
      };
    }

    if (trimmed.startsWith("data:image/") || /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      const normalized = normalizeBase64Payload(trimmed);
      return {
        type: "base64",
        mimeType: normalized.mimeType,
        base64: normalized.base64
      };
    }

    const parsed = extractJsonLikeText(trimmed);

    if (parsed && parsed !== trimmed) {
      return imageItemFromCandidate(parsed);
    }

    return null;
  }

  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const normalized = imageItemFromCandidate(item);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  if (typeof candidate === "object") {
    const record = candidate as Record<string, unknown>;

    const directUrl =
      typeof record.url === "string"
        ? record.url
        : typeof record.image_url === "string"
          ? record.image_url
          : typeof record.imageUrl === "string"
            ? record.imageUrl
            : null;

    if (directUrl) {
      return {
        type: "url",
        url: directUrl
      };
    }

    const nestedUrl = (() => {
      const imageUrl = record.image_url;
      if (imageUrl && typeof imageUrl === "object") {
        const nested = imageUrl as Record<string, unknown>;
        return typeof nested.url === "string" ? nested.url : null;
      }
      return null;
    })();

    if (nestedUrl) {
      return {
        type: "url",
        url: nestedUrl
      };
    }

    const rawBase64 =
      typeof record.b64_json === "string"
        ? record.b64_json
        : typeof record.base64 === "string"
          ? record.base64
          : typeof record.image === "string"
            ? record.image
            : typeof record.data === "string"
              ? record.data
              : null;

    if (rawBase64) {
      const normalized = normalizeBase64Payload(rawBase64);
      return {
        type: "base64",
        mimeType: normalized.mimeType,
        base64: normalized.base64
      };
    }

    if (typeof record.text === "string" || typeof record.content === "string") {
      return imageItemFromCandidate(record.text ?? record.content);
    }
  }

  return null;
}

function pushImageCandidate(
  list: NormalizedImageItem[],
  seen: Set<string>,
  candidate: NormalizedImageItem | null
) {
  if (!candidate) {
    return;
  }

  const fingerprint =
    candidate.type === "url"
      ? `url:${candidate.url}`
      : `base64:${candidate.mimeType ?? "image/png"}:${candidate.base64}`;

  if (seen.has(fingerprint)) {
    return;
  }

  seen.add(fingerprint);
  list.push(candidate);
}

function extractImagesFromPayload(payload: unknown): NormalizedImageItem[] {
  const images: NormalizedImageItem[] = [];
  const seen = new Set<string>();
  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    for (const item of record.data) {
      const object = item as Record<string, unknown>;
      pushImageCandidate(images, seen, imageItemFromCandidate(object));
    }
  }

  if (Array.isArray(record.choices)) {
    for (const choice of record.choices as Array<Record<string, unknown>>) {
      pushImageCandidate(images, seen, imageItemFromCandidate(choice));
      const message = choice.message;
      if (message && typeof message === "object") {
        const messageRecord = message as Record<string, unknown>;
        pushImageCandidate(
          images,
          seen,
          imageItemFromCandidate(messageRecord.content ?? messageRecord.image)
        );
      }
    }
  }

  if (record.output && Array.isArray(record.output)) {
    for (const entry of record.output as Array<Record<string, unknown>>) {
      const content = entry.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          pushImageCandidate(images, seen, imageItemFromCandidate(part));
        }
      } else {
        pushImageCandidate(images, seen, imageItemFromCandidate(content));
      }
    }
  }

  pushImageCandidate(images, seen, imageItemFromCandidate(record.url));
  pushImageCandidate(images, seen, imageItemFromCandidate(record.b64_json));
  pushImageCandidate(images, seen, imageItemFromCandidate(record.base64));
  pushImageCandidate(images, seen, imageItemFromCandidate(record.image));

  return images;
}

async function fetchJsonWithRetry(
  url: string,
  init: RequestInit,
  config: OpenAiCompatibleProviderConfig,
  retryPolicy: RetryPolicy
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retryPolicy.attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    const start = Date.now();

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {})
        }
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const retriable = response.status === 429 || response.status >= 500;

        if (retriable && attempt < retryPolicy.attempts) {
          lastError = new Error(
            `OPENAI_COMPATIBLE_${response.status}:${body.slice(0, 400)}`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, retryPolicy.backoffMs * attempt)
          );
          continue;
        }

        throw new Error(
          `OPENAI_COMPATIBLE_${response.status}:${body.slice(0, 400)}`
        );
      }

      const json = await response.json();
      clearTimeout(timeout);
      return { json, latencyMs };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt < retryPolicy.attempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryPolicy.backoffMs * attempt)
        );
        continue;
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("OPENAI_COMPATIBLE_REQUEST_FAILED");
}

export function normalizeImageResponse(raw: unknown): NormalizedImageResponse {
  return {
    images: extractImagesFromPayload(raw),
    raw
  };
}

export function createOpenAiCompatibleProvider(
  config: OpenAiCompatibleProviderConfig
): LlmProvider {
  const retryPolicy: RetryPolicy = { attempts: 2, backoffMs: 250 };

  return {
    kind: "openai_compatible",
    config,
    async chatCompletion(request: ChatCompletionRequest) {
      const payload = {
        model: request.model || config.chatModel,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        response_format: request.responseFormat
          ? request.responseFormat.type === "json_schema"
            ? {
                type: "json_schema",
                json_schema: {
                  name: request.responseFormat.name,
                  schema: request.responseFormat.schema,
                  strict: request.responseFormat.strict ?? true
                }
              }
            : { type: request.responseFormat.type }
          : config.enableSchemaValidation
            ? { type: "json_object" }
            : undefined
      };

      const response = await fetchJsonWithRetry(
        buildUrl(config, normalizeEndpointPath(config.chatEndpointPath)),
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        config,
        retryPolicy
      );
      const content = extractChatCompletionText(response.json);
      const model = (response.json as { model?: string }).model ?? request.model;

      return {
        raw: response.json,
        model: typeof model === "string" ? model : null,
        content,
        latencyMs: response.latencyMs
      };
    },
    async imageGeneration(request: ImageGenerationRequest) {
      const limiter = getImageLimiter(config);

      return limiter.run(async () => {
        const response =
          config.imageMode === "images_api"
            ? await fetchJsonWithRetry(
                buildUrl(config, normalizeEndpointPath(config.imageEndpointPath)),
                {
                  method: "POST",
                  body: JSON.stringify({
                    model: config.imageModel,
                    prompt: request.prompt,
                    size: request.size ?? config.defaultImageSize,
                    response_format:
                      request.responseFormat ?? config.imageResponseFormat,
                    n: 1
                  })
                },
                config,
                retryPolicy
              )
            : await fetchJsonWithRetry(
                buildUrl(config, normalizeEndpointPath(config.chatEndpointPath)),
                {
                  method: "POST",
                  body: JSON.stringify({
                    model: config.imageModel,
                    messages: [
                      {
                        role: "user",
                        content: request.prompt
                      }
                    ],
                    temperature: 0.2
                  })
                },
                config,
                retryPolicy
              );

        return normalizeImageResponse(response.json);
      });
    },
    normalizeImageResponse
  };
}

export function summarizeProviderConfig(config: OpenAiCompatibleProviderConfig) {
  return [
    config.providerName,
    config.baseUrl,
    config.chatModel,
    config.imageModel,
    config.imageMode,
    config.imageResponseFormat
  ].join(" | ");
}

export function redactProviderConfig(config: OpenAiCompatibleProviderConfig) {
  return {
    ...config,
    apiKey: redactedApiKey(config.apiKey)
  };
}
