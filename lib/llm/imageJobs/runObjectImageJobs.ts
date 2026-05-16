import type { LlmProvider } from "@/lib/llm/provider/types";
import { normalizeImageResponse } from "@/lib/llm/imageJobs/normalizeImageResponse";
import { downloadOrDecodeImage } from "@/lib/llm/imageJobs/downloadOrDecodeImage";
import { storeGeneratedAsset } from "@/lib/llm/imageJobs/storeGeneratedAsset";
import type { RoomAssetPlan } from "@/lib/llm/pipeline/types";

type PromiseTask<T> = () => Promise<T>;

class PromiseLimiter {
  private active = 0;
  private readonly queue: Array<{
    run: PromiseTask<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(private readonly limit: number) {}

  async run<T>(task: PromiseTask<T>): Promise<T> {
    if (this.active >= this.limit) {
      return new Promise<T>((resolve, reject) => {
        this.queue.push({
          run: task as PromiseTask<unknown>,
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

export type ObjectImageJobFailure = {
  objectId: string;
  objectName: string;
  status: "failed";
  error: string;
  retryable: boolean;
  fallbackPlan: {
    kind: "placeholder";
    reason: string;
  };
};

export type ObjectImageJobSuccess = {
  objectId: string;
  objectName: string;
  status: "success";
  assetId: string;
  storagePath: string;
  publicUrl: string | null;
  sourceType: "url" | "base64";
  mimeType: string;
  width?: number;
  height?: number;
};

export type ObjectImageJobResult =
  | ObjectImageJobSuccess
  | ObjectImageJobFailure;

export type RunObjectImageJobsInput = {
  roomId: string;
  creatorId: string;
  provider: LlmProvider;
  roomAssetPlan: RoomAssetPlan;
};

export type RunObjectImageJobsOutput = {
  roomAssetResults: ObjectImageJobResult[];
  generationSummary: {
    successCount: number;
    failedCount: number;
  };
};

function isRetryableError(message: string) {
  return /429|5\d\d|timeout|aborted|network|fetch|retry/i.test(message);
}

async function generateSingleObjectImage(
  input: RunObjectImageJobsInput,
  prompt: RoomAssetPlan["imagePromptPlan"]["objectImagePrompts"][number]
): Promise<ObjectImageJobResult> {
  const object = input.roomAssetPlan.roomDesign.objectConcepts.find(
    (item) => item.id === prompt.objectId
  );

  if (!object) {
    return {
      objectId: prompt.objectId,
      objectName: prompt.objectId,
      status: "failed",
      error: "OBJECT_PROMPT_NOT_FOUND",
      retryable: false,
      fallbackPlan: {
        kind: "placeholder",
        reason: "missing_object_concept"
      }
    };
  }

  try {
    const generated = await input.provider.imageGeneration({
      prompt: prompt.positivePrompt,
      size: prompt.size
    });
    const normalized =
      generated.images.length > 0
        ? generated
        : normalizeImageResponse(generated.raw);
    const decoded = await downloadOrDecodeImage(
      normalized.images,
      input.provider.config.timeoutMs
    );
    const stored = await storeGeneratedAsset({
      roomId: input.roomId,
      creatorId: input.creatorId,
      objectId: object.id,
      objectName: object.name,
      promptText: prompt.positivePrompt,
      sourceType: decoded.sourceType,
      buffer: decoded.buffer,
      mimeType: decoded.mimeType,
      providerName: input.provider.config.providerName,
      imageMode: input.provider.config.imageMode,
      responseFormat: input.provider.config.imageResponseFormat
    });

    return {
      objectId: object.id,
      objectName: object.name,
      status: "success",
      assetId: stored.assetId,
      storagePath: stored.storagePath,
      publicUrl: stored.publicUrl,
      sourceType: stored.sourceType,
      mimeType: stored.mimeType
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      objectId: object.id,
      objectName: object.name,
      status: "failed",
      error: errorMessage,
      retryable: isRetryableError(errorMessage),
      fallbackPlan: {
        kind: "placeholder",
        reason: errorMessage
      }
    };
  }
}

export async function runObjectImageJobs(
  input: RunObjectImageJobsInput
): Promise<RunObjectImageJobsOutput> {
  const prompts = input.roomAssetPlan.imagePromptPlan.objectImagePrompts;
  const limiter = new PromiseLimiter(
    input.provider.config.maxConcurrentImageJobs
  );
  const results = await Promise.all(
    prompts.map((prompt) =>
      limiter.run(() => generateSingleObjectImage(input, prompt))
    )
  );
  const successCount = results.filter(
    (result): result is ObjectImageJobSuccess => result.status === "success"
  ).length;

  return {
    roomAssetResults: results,
    generationSummary: {
      successCount,
      failedCount: results.length - successCount
    }
  };
}
