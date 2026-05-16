import type { LlmProvider } from "@/lib/llm/provider/types";
import {
  imagePromptPlanJsonSchema,
  imagePromptPlanSchema,
  roomAssetPlanSchema,
  roomDesignSchema,
  semanticAnalysisSchema,
  type ImagePromptPlan,
  type RoomAssetPlan,
  type RoomDesign,
  type SemanticAnalysis
} from "@/lib/llm/pipeline/types";

const SHARED_STYLE_PROMPT = [
  "2.5D miniature handmade diorama",
  "paper craft object asset",
  "cardboard texture",
  "old paper scrapbook style",
  "warm soft lighting",
  "cozy storybook mood",
  "slightly top-front angle",
  "isolated object asset",
  "transparent or clean background if supported",
  "for placement inside a tiny handmade room"
].join(", ");

const DEFAULT_NEGATIVE_PROMPT = [
  "no full room scene",
  "no realistic product photography",
  "no glossy plastic",
  "no cyberpunk",
  "no futuristic UI",
  "no glassmorphism",
  "no neon",
  "no complex background",
  "no harsh studio lighting",
  "no text-heavy poster"
].join(", ");

const ASSET_PROMPT_STRATEGIES = {
  envelope_letter:
    "信封/书信用旧纸信封、没寄出的折痕、轻微胶带、手写痕迹来表达未说出口的话；避免可读隐私文本。",
  clock:
    "钟用倒着走、停在某个温柔时刻、纸板指针或轻微裂纹来表达时间卡住；保持玩具比例。",
  moon:
    "月亮用纸片月亮、剪贴阴影、窗边小挂饰或桌面月光来表达远处的陪伴；不要画成完整夜景。",
  chair:
    "椅子用空椅、歪斜靠背、旧纸坐垫或等待姿态来表达缺席与想靠近；要能独立摆放。",
  chat_note:
    "聊天框便签用关着灯的小对话框、未发送纸条、贴在墙上的便签气泡来表达没发出的消息；不要做科技屏幕。",
  book:
    "书用合上的旧书、夹着纸条、翻到空白页或压着花瓣来表达没讲完的故事；避免大段文字。",
  plant:
    "小植物用纸盆栽、低头嫩芽、卷边叶子或新芽来表达被照顾的希望；保持纸艺质感。",
  key:
    "小钥匙用纸板钥匙、旧铜色但不金属炫光、挂着标签来表达入口、答案或迟到的勇气。",
  paper_note:
    "小纸条用撕边纸片、胶带固定、折角和浅浅字迹来表达线索；文字只作不可读纹理。",
  other:
    "其他物件也必须是小屋中可摆放的纸艺小物，具备清楚轮廓、温柔隐喻和干净背景。"
} as const;

const IMAGE_PROMPT_SYSTEM_PROMPT = [
  "你是《心事小屋》的线索物件图像提示词设计师，只输出符合 JSON Schema 的对象。",
  "你要为 5 个 objectConcepts 生成图像模型可直接使用的 prompt。",
  "这些图片不是完整大场景，而是小屋中的独立线索物件素材。",
  `所有 positivePrompt 都必须包含或等价表达：${SHARED_STYLE_PROMPT}。`,
  "每个 prompt 都要说明物件本体、情绪隐喻、材质、视角、背景偏好和适合放进微缩小屋。",
  "不要生成科技风、赛博风、玻璃拟态、写实摄影棚商品图或复杂背景。",
  "输出必须结构化 JSON，不能包含自由散文。"
].join("\n");

function parseJsonPayload(content: string): unknown {
  const trimmed = content.trim();

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

    throw new Error("LLM_IMAGE_PROMPT_PLAN_JSON_MISSING");
  }
}

function buildUserPrompt(
  semanticAnalysis: SemanticAnalysis,
  roomDesign: RoomDesign,
  configuredStylePrompt: string,
  configuredObjectStylePrompt: string,
  configuredNegativePrompt: string | null
) {
  return JSON.stringify(
    {
      task: "generate_object_image_prompts",
      language: "zh-CN",
      semanticAnalysis,
      roomDesign: {
        roomTitle: roomDesign.roomTitle,
        emotionType: roomDesign.emotionType,
        visualTheme: roomDesign.visualTheme,
        objectConcepts: roomDesign.objectConcepts
      },
      sharedStylePrompt: [
        SHARED_STYLE_PROMPT,
        configuredStylePrompt,
        configuredObjectStylePrompt
      ]
        .filter(Boolean)
        .join(", "),
      defaultNegativePrompt:
        configuredNegativePrompt || DEFAULT_NEGATIVE_PROMPT,
      assetPromptStrategies: ASSET_PROMPT_STRATEGIES,
      constraints: {
        exactPromptCount: 5,
        size: "use provider default size unless a square size is needed",
        objectAssetOnly: true,
        transparentOrCleanBackgroundPreference: true,
        noReadablePrivateText: true
      }
    },
    null,
    2
  );
}

function assertImagePromptPlan(plan: ImagePromptPlan, roomDesign: RoomDesign) {
  const objectIds = new Set(roomDesign.objectConcepts.map((object) => object.id));
  const promptIds = new Set(
    plan.objectImagePrompts.map((prompt) => prompt.objectId)
  );

  if (promptIds.size !== plan.objectImagePrompts.length) {
    throw new Error("IMAGE_PROMPT_OBJECT_IDS_MUST_BE_UNIQUE");
  }

  for (const objectId of objectIds) {
    if (!promptIds.has(objectId)) {
      throw new Error(`IMAGE_PROMPT_MISSING_OBJECT_${objectId}`);
    }
  }
}

export async function generateObjectPrompts(
  semanticAnalysis: SemanticAnalysis,
  roomDesign: RoomDesign,
  provider: LlmProvider
): Promise<ImagePromptPlan> {
  const parsedAnalysis = semanticAnalysisSchema.parse(semanticAnalysis);
  const parsedDesign = roomDesignSchema.parse(roomDesign);
  const result = await provider.chatCompletion({
    model: provider.config.chatModel,
    messages: [
      {
        role: "system",
        content: IMAGE_PROMPT_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: buildUserPrompt(
          parsedAnalysis,
          parsedDesign,
          provider.config.globalVisualStylePrompt,
          provider.config.objectStylePrompt,
          provider.config.negativePrompt
        )
      }
    ],
    temperature: 0.25,
    maxTokens: 2600,
    responseFormat: provider.config.enableSchemaValidation
      ? {
          type: "json_schema",
          name: "ImagePromptPlan",
          schema: imagePromptPlanJsonSchema
        }
      : {
          type: "json_object"
        }
  });
  const plan = imagePromptPlanSchema.parse(parseJsonPayload(result.content));

  assertImagePromptPlan(plan, parsedDesign);
  return plan;
}

export function buildRoomAssetPlan(
  semanticAnalysis: SemanticAnalysis,
  roomDesign: RoomDesign,
  imagePromptPlan: ImagePromptPlan,
  provider: LlmProvider
): RoomAssetPlan {
  const objectById = new Map(
    roomDesign.objectConcepts.map((object) => [object.id, object])
  );
  const jobs = imagePromptPlan.objectImagePrompts.map((prompt) => {
    const object = objectById.get(prompt.objectId);

    if (!object) {
      throw new Error(`GENERATION_PLAN_UNKNOWN_OBJECT_${prompt.objectId}`);
    }

    return {
      jobId: `job_${prompt.objectId}`,
      objectId: prompt.objectId,
      objectName: object.name,
      prompt: [imagePromptPlan.sharedStylePrompt, prompt.positivePrompt]
        .filter(Boolean)
        .join(", "),
      negativePrompt:
        prompt.negativePrompt ||
        provider.config.negativePrompt ||
        DEFAULT_NEGATIVE_PROMPT,
      size: prompt.size || provider.config.defaultImageSize,
      providerMode: provider.config.imageMode,
      responseFormat: provider.config.imageResponseFormat
    };
  });

  return roomAssetPlanSchema.parse({
    semanticAnalysis,
    roomDesign,
    imagePromptPlan,
    generationPlan: {
      maxConcurrentImageJobs: provider.config.maxConcurrentImageJobs,
      jobs
    }
  });
}

export async function generateRoomAssetPlan(
  semanticAnalysis: SemanticAnalysis,
  roomDesign: RoomDesign,
  provider: LlmProvider
): Promise<RoomAssetPlan> {
  const imagePromptPlan = await generateObjectPrompts(
    semanticAnalysis,
    roomDesign,
    provider
  );

  return buildRoomAssetPlan(
    semanticAnalysis,
    roomDesign,
    imagePromptPlan,
    provider
  );
}
