import type { LlmProvider } from "@/lib/llm/provider/types";
import {
  roomDesignJsonSchema,
  roomDesignSchema,
  semanticAnalysisSchema,
  secretPipelineInputSchema,
  type RoomDesign,
  type SecretPipelineInput,
  type SemanticAnalysis
} from "@/lib/llm/pipeline/types";

const HEART_CABIN_STYLE = [
  "旧纸",
  "信封",
  "胶带",
  "撕边纸片",
  "暖光",
  "纸板微缩小屋",
  "手账感",
  "不要科技感",
  "不要赛博风",
  "不要玻璃拟态"
].join("，");

const DESIGN_SYSTEM_PROMPT = [
  "你是《心事小屋》的房间与线索设计师，只输出符合 JSON Schema 的对象。",
  `整体视觉必须延续：${HEART_CABIN_STYLE}。`,
  "你的任务是基于语义分析设计一个可被前端渲染为 2.5D 微缩小屋的中间结构。",
  "objectConcepts 必须刚好 5 个，每个物件都必须具体、可视化、能作为独立图像元素摆进小屋。",
  "优先使用可画的日常物件：信封/书信、钟、月亮、椅子、聊天框便签、书、小植物、小钥匙、小纸条。",
  "不要输出抽象概念物件，例如孤独、时间、遗憾本身；必须转化为能画出的物件。",
  "choiceOptions 必须刚好 4 个，correctChoiceIndex 必须指向最准确的选项。",
  "publicTitle 和房间公开信息不能直接复述用户原句。"
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

    throw new Error("LLM_ROOM_DESIGN_JSON_MISSING");
  }
}

function buildUserPrompt(
  input: SecretPipelineInput,
  semanticAnalysis: SemanticAnalysis
) {
  return JSON.stringify(
    {
      task: "design_room_and_clue_objects",
      language: "zh-CN",
      originalInput: input,
      semanticAnalysis,
      constraints: {
        objectConceptCount: 5,
        choiceOptionCount: 4,
        exactCorrectChoiceCount: 1,
        renderTarget: "2.5d_miniature_room",
        publicFieldsDoNotLeakOriginalSentence: true,
        objectRules: [
          "每个物件都要有情绪隐喻",
          "每个物件都要有 clue、keyword 和 positionHint",
          "preferredAssetType 从枚举中选择；不确定时选 other",
          "sceneRole 描述它在小屋里的叙事作用，而不是 UI 功能"
        ]
      },
      preferredVisualObjectTypes: [
        "envelope_letter",
        "clock",
        "moon",
        "chair",
        "chat_note",
        "book",
        "plant",
        "key",
        "paper_note"
      ]
    },
    null,
    2
  );
}

function assertRoomDesign(design: RoomDesign) {
  const objectIds = new Set(design.objectConcepts.map((object) => object.id));
  const choiceIds = new Set(design.choiceOptions.map((choice) => choice.id));

  if (objectIds.size !== design.objectConcepts.length) {
    throw new Error("ROOM_DESIGN_OBJECT_IDS_MUST_BE_UNIQUE");
  }

  if (choiceIds.size !== design.choiceOptions.length) {
    throw new Error("ROOM_DESIGN_CHOICE_IDS_MUST_BE_UNIQUE");
  }

  if (!design.choiceOptions[design.correctChoiceIndex]) {
    throw new Error("ROOM_DESIGN_CORRECT_CHOICE_INDEX_INVALID");
  }
}

export async function designRoom(
  input: SecretPipelineInput,
  semanticAnalysis: SemanticAnalysis,
  provider: LlmProvider
): Promise<RoomDesign> {
  const parsedInput = secretPipelineInputSchema.parse(input);
  const parsedAnalysis = semanticAnalysisSchema.parse(semanticAnalysis);
  const result = await provider.chatCompletion({
    model: provider.config.chatModel,
    messages: [
      {
        role: "system",
        content: DESIGN_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: buildUserPrompt(parsedInput, parsedAnalysis)
      }
    ],
    temperature: 0.35,
    maxTokens: 2200,
    responseFormat: provider.config.enableSchemaValidation
      ? {
          type: "json_schema",
          name: "RoomDesign",
          schema: roomDesignJsonSchema
        }
      : {
          type: "json_object"
        }
  });
  const design = roomDesignSchema.parse(parseJsonPayload(result.content));

  assertRoomDesign(design);
  return design;
}
