import {
  generateRoomFromSecretInputSchema,
  parseStructuredOutput,
  roomNarrativeJsonSchema,
  roomNarrativeOutputSchema,
  secretAnalysisJsonSchema,
  secretAnalysisOutputSchema,
  clueImagePromptJsonSchema,
  clueImagePromptOutputSchema,
  type ClueImagePromptOutput,
  type GenerateRoomFromSecretInput,
  type GenerateRoomFromSecretOutput,
  type RoomNarrativeOutput,
  type SecretAnalysisOutput,
  type StructuredLlmClient
} from "@/lib/ai/schemas";
import type { AiProviderConfig } from "@/lib/ai/adminConfig";
import {
  generateOpenAiCompatibleImage,
  type ImageGenerationRequest
} from "@/lib/ai/openAiCompatible";
import {
  persistGeneratedImage,
  type PersistedGeneratedImage
} from "@/lib/ai/imageStorage";

const HEART_CABIN_STYLE = [
  "旧纸手账风",
  "信封与胶带",
  "撕边纸片",
  "暖光",
  "纸板微缩小屋",
  "手作纸板质感",
  "2.5D 微缩模型",
  "低饱和",
  "不要科技感",
  "不要赛博风",
  "不要玻璃拟态"
].join("，");

const ANALYSIS_SYSTEM_PROMPT = [
  "你是《心事小屋》的语义分析助手，只输出符合 JSON Schema 的对象。",
  "你的任务是分析用户心事的情绪、关系张力和可隐喻表达。",
  "不要编造用户没有表达过的重大事实，不做医疗、法律、金融诊断。",
  "输出必须结构化，不能包含自由散文。"
].join("\n");

const NARRATIVE_SYSTEM_PROMPT = [
  "你是《心事小屋》的房间叙事设计师，只输出符合 JSON Schema 的对象。",
  `视觉风格必须是：${HEART_CABIN_STYLE}。`,
  "你要把语义分析转化为 5 个可点击线索物件、4 个猜测选项、宠物和公开分享文本。",
  "public 字段不得直接复述用户原句。",
  "hiddenMeaning 可以总结真实含义，但不能加入用户没有表达过的重大事实。",
  "objects 必须刚好 5 个，choices 必须刚好 4 个，且 choices 中只能有 1 个 isCorrect=true。",
  "线索要温柔、隐喻但不能过难，玩家通过 5 个物件和 4 个选项应该能猜到大意。"
].join("\n");

const IMAGE_PROMPT_SYSTEM_PROMPT = [
  "你是《心事小屋》的线索物件图像提示词设计师，只输出符合 JSON Schema 的对象。",
  "每张图只画一个小屋中的线索物件元素，不是完整大场景。",
  `统一视觉风格：${HEART_CABIN_STYLE}。`,
  "提示词必须适合图像模型直接生成，并明确透明或干净背景，方便前端组合进 2.5D 小屋。",
  "禁止科技感、赛博风、玻璃拟态、金属 UI、霓虹。"
].join("\n");

function buildStructuredPrompt(task: string, payload: unknown) {
  return JSON.stringify(
    {
      task,
      language: "zh-CN",
      payload
    },
    null,
    2
  );
}

async function analyzeSecret(
  input: GenerateRoomFromSecretInput,
  client: StructuredLlmClient
): Promise<SecretAnalysisOutput> {
  const raw = await client({
    schemaName: "SecretAnalysisOutput",
    jsonSchema: secretAnalysisJsonSchema,
    system: ANALYSIS_SYSTEM_PROMPT,
    user: buildStructuredPrompt("analyzeSecretSemantics", input),
    temperature: 0.2
  });

  return parseStructuredOutput(
    secretAnalysisOutputSchema,
    raw,
    "SecretAnalysisOutput"
  );
}

async function generateNarrative(
  input: GenerateRoomFromSecretInput,
  analysis: SecretAnalysisOutput,
  client: StructuredLlmClient
): Promise<RoomNarrativeOutput> {
  const raw = await client({
    schemaName: "RoomNarrativeOutput",
    jsonSchema: roomNarrativeJsonSchema,
    system: NARRATIVE_SYSTEM_PROMPT,
    user: buildStructuredPrompt("generateRoomNarrative", {
      originalInput: input,
      analysis,
      constraints: {
        exactObjectCount: 5,
        exactChoiceCount: 4,
        exactCorrectChoiceCount: 1,
        noDirectOriginalSentenceLeak: true
      }
    }),
    temperature: 0.35
  });

  return parseStructuredOutput(
    roomNarrativeOutputSchema,
    raw,
    "RoomNarrativeOutput"
  );
}

async function generateImagePrompts(
  narrative: RoomNarrativeOutput,
  analysis: SecretAnalysisOutput,
  client: StructuredLlmClient
): Promise<ClueImagePromptOutput> {
  const raw = await client({
    schemaName: "ClueImagePromptOutput",
    jsonSchema: clueImagePromptJsonSchema,
    system: IMAGE_PROMPT_SYSTEM_PROMPT,
    user: buildStructuredPrompt("generateClueObjectImagePrompts", {
      analysis,
      room: {
        visualTheme: narrative.visualTheme,
        objects: narrative.objects.map((object) => ({
          id: object.id,
          name: object.name,
          visualDescription: object.visualDescription,
          keyword: object.keyword
        }))
      }
    }),
    temperature: 0.25
  });

  return parseStructuredOutput(
    clueImagePromptOutputSchema,
    raw,
    "ClueImagePromptOutput"
  );
}

async function generateAndPersistImage(
  config: AiProviderConfig,
  request: ImageGenerationRequest,
  objectId: string
): Promise<PersistedGeneratedImage> {
  const image = await generateOpenAiCompatibleImage(config, request);

  return persistGeneratedImage(image, objectId);
}

function assertNarrative(output: RoomNarrativeOutput, sentence: string) {
  const correctChoices = output.choices.filter((choice) => choice.isCorrect);

  if (correctChoices.length !== 1) {
    throw new Error("Generated room must contain exactly one correct choice");
  }

  const objectIds = new Set(output.objects.map((object) => object.id));
  const choiceIds = new Set(output.choices.map((choice) => choice.id));

  if (objectIds.size !== output.objects.length) {
    throw new Error("Generated room object ids must be unique");
  }

  if (choiceIds.size !== output.choices.length) {
    throw new Error("Generated room choice ids must be unique");
  }

  const normalizedSentence = sentence.replace(/\s+/g, "");
  const publicStrings = [
    output.roomTitle,
    output.publicTitle,
    output.emotionType,
    output.endingLine,
    output.shareText,
    output.pet.name,
    output.pet.personality,
    output.pet.safetyBehavior,
    ...output.objects.flatMap((object) => [
      object.name,
      object.visualDescription,
      object.clue,
      object.keyword,
      object.positionHint
    ]),
    ...output.choices.map((choice) => choice.text)
  ];
  const leaked = publicStrings.some((value) => {
    const normalizedValue = value.replace(/\s+/g, "");

    return normalizedSentence.length < 8
      ? normalizedValue.includes(normalizedSentence)
      : normalizedValue.includes(normalizedSentence) ||
          normalizedSentence.includes(normalizedValue);
  });

  if (leaked) {
    throw new Error("Generated room leaked the original sentence in public fields");
  }
}

export type GeneratedRoomPipelineResult = {
  room: GenerateRoomFromSecretOutput;
  roomJson: Record<string, unknown>;
  analysis: SecretAnalysisOutput;
  imagePrompts: ClueImagePromptOutput;
};

export async function generateRoomWithImages(
  input: GenerateRoomFromSecretInput,
  client: StructuredLlmClient,
  config: AiProviderConfig
): Promise<GeneratedRoomPipelineResult> {
  const parsedInput = generateRoomFromSecretInputSchema.parse(input);
  const analysis = await analyzeSecret(parsedInput, client);
  const narrative = await generateNarrative(parsedInput, analysis, client);

  assertNarrative(narrative, parsedInput.sentence);

  const imagePrompts = await generateImagePrompts(narrative, analysis, client);
  const promptByObjectId = new Map(
    imagePrompts.objects.map((object) => [object.objectId, object])
  );
  const imageResults = await Promise.all(
    narrative.objects.map(async (object) => {
      const imagePrompt = promptByObjectId.get(object.id);

      if (!imagePrompt) {
        throw new Error(`Missing image prompt for room object ${object.id}`);
      }

      const persisted = await generateAndPersistImage(
        config,
        {
          prompt: imagePrompt.prompt,
          size: "1024x1024"
        },
        object.id
      );

      return [object.id, persisted] as const;
    })
  );
  const imageByObjectId = new Map(imageResults);
  const objects = narrative.objects.map((object) => {
    const imagePrompt = promptByObjectId.get(object.id);
    const image = imageByObjectId.get(object.id);

    return {
      ...object,
      imagePrompt: imagePrompt?.prompt ?? null,
      negativePrompt: imagePrompt?.negativePrompt ?? null,
      imageUrl: image?.url ?? null,
      imageStoragePath: image?.storagePath ?? null,
      imageSourceType: image?.sourceType ?? null
    };
  });
  const room: GenerateRoomFromSecretOutput = {
    ...narrative,
    hiddenMeaning: narrative.hiddenMeaning.trim(),
    objects
  };
  const roomJson = {
    schemaVersion: 1,
    renderTarget: "2.5d_miniature_cabin",
    style: HEART_CABIN_STYLE,
    publicTitle: room.publicTitle,
    visualTheme: room.visualTheme,
    objects,
    choices: room.choices.map((choice, index) => ({
      index,
      id: choice.id,
      label: choice.text
    })),
    pet: room.pet,
    endingLine: room.endingLine,
    shareText: room.shareText,
    generation: {
      imageGenerationMode: config.imageGenerationMode,
      chatModel: config.chatModel,
      imageModel: config.imageModel
    }
  };

  return {
    room,
    roomJson,
    analysis,
    imagePrompts
  };
}

