import type { LlmProvider } from "@/lib/llm/provider/types";
import {
  semanticAnalysisJsonSchema,
  semanticAnalysisSchema,
  secretPipelineInputSchema,
  type SecretPipelineInput,
  type SemanticAnalysis
} from "@/lib/llm/pipeline/types";

const ANALYSIS_SYSTEM_PROMPT = [
  "你是《心事小屋》的语义分析助手，只输出符合 JSON Schema 的对象。",
  "任务是分析一句心事背后的真实情绪、关系语境、隐藏含义和空间隐喻方向。",
  "不要直接生成 UI 文案、房间 JSON 或图像提示词。",
  "不要编造用户没有表达过的重大事实，不做医疗、法律、金融诊断。",
  "安全评估只判断这句心事是否适合继续做温柔的隐喻化表达；如涉及明确自伤、暴力、违法或未成年人性化内容，allowed=false 并说明原因。",
  "输出必须是结构化 JSON，不能包含自由散文。"
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

    throw new Error("LLM_SEMANTIC_ANALYSIS_JSON_MISSING");
  }
}

function buildUserPrompt(input: SecretPipelineInput) {
  return JSON.stringify(
    {
      task: "analyze_secret_semantics",
      language: "zh-CN",
      input,
      outputContract: {
        coreEmotion: "核心情绪，短词或短语",
        emotionalTone: "整体情绪质地，例如克制、怀念、委屈、释然",
        relationshipContext: "关系语境，不确定时写未知或自我关系",
        hiddenMeaning: "心事背后的真实语义，不直接照抄原句",
        keySubtexts: "2-8 个隐含情绪/需求/冲突",
        metaphorDirections: "3-8 个适合空间与物件设计的隐喻方向",
        difficultyLevel: "easy | medium | hard",
        safetyAssessment: "是否允许继续生成温柔隐喻内容"
      }
    },
    null,
    2
  );
}

export async function analyzeSecret(
  input: SecretPipelineInput,
  provider: LlmProvider
): Promise<SemanticAnalysis> {
  const parsedInput = secretPipelineInputSchema.parse(input);
  const result = await provider.chatCompletion({
    model: provider.config.chatModel,
    messages: [
      {
        role: "system",
        content: ANALYSIS_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: buildUserPrompt(parsedInput)
      }
    ],
    temperature: 0.2,
    maxTokens: 1200,
    responseFormat: provider.config.enableSchemaValidation
      ? {
          type: "json_schema",
          name: "SemanticAnalysis",
          schema: semanticAnalysisJsonSchema
        }
      : {
          type: "json_object"
        }
  });

  return semanticAnalysisSchema.parse(parseJsonPayload(result.content));
}
