import type { LlmProvider } from "@/lib/llm/provider/types";
import { analyzeSecret } from "@/lib/llm/pipeline/analyzeSecret";
import { designRoom } from "@/lib/llm/pipeline/designRoom";
import {
  buildRoomAssetPlan,
  generateObjectPrompts
} from "@/lib/llm/pipeline/generateObjectPrompts";
import {
  secretPipelineInputSchema,
  type RoomAssetPlan,
  type SecretPipelineInput
} from "@/lib/llm/pipeline/types";

export async function createRoomAssetPlan(
  input: SecretPipelineInput,
  provider: LlmProvider
): Promise<RoomAssetPlan> {
  const parsedInput = secretPipelineInputSchema.parse(input);
  const semanticAnalysis = await analyzeSecret(parsedInput, provider);

  if (!semanticAnalysis.safetyAssessment.allowed) {
    throw new Error(
      semanticAnalysis.safetyAssessment.reason ||
        "SECRET_PIPELINE_SAFETY_BLOCKED"
    );
  }

  const roomDesign = await designRoom(parsedInput, semanticAnalysis, provider);
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

export * from "@/lib/llm/pipeline/analyzeSecret";
export * from "@/lib/llm/pipeline/designRoom";
export * from "@/lib/llm/pipeline/generateObjectPrompts";
export * from "@/lib/llm/pipeline/types";
