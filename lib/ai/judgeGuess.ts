import {
  DIARY_ACCESS_AFFINITY_THRESHOLD,
  judgeGuessInputSchema,
  judgeGuessJsonSchema,
  judgeGuessOutputSchema,
  parseStructuredOutput,
  type JudgeGuessInput,
  type JudgeGuessOutput,
  type StructuredLlmClient
} from "@/lib/ai/schemas";

const JUDGE_SYSTEM_PROMPT = [
  "你是《心事小屋》的温柔评分员，只输出符合 JSON Schema 的对象。",
  "你要根据 hiddenMeaning、玩家点击的关键词、选项文本和自由猜测判断理解程度。",
  "评分要稳定、温柔，不嘲讽、不羞辱玩家。",
  "score 表示猜中程度；affinityScore 表示默契度。二者可以接近，但不要机械相等。",
  "不要直接泄露完整 hiddenMeaning，只能通过 comment 和 partialOriginalSentence 给有限反馈。",
  `只有 affinityScore >= ${DIARY_ACCESS_AFFINITY_THRESHOLD} 时 canRequestDiaryAccess 才能为 true。`,
  "revealLevel: 0=几乎不揭示，1=轻微方向，2=接近答案，3=高度命中但仍不输出完整隐私原句。",
  "hitKeywords 和 missedKeywords 必须是短关键词，不要整句。"
].join("\n");

function buildJudgeUserPrompt(input: JudgeGuessInput) {
  return JSON.stringify(
    {
      task: "judgeGuess",
      language: "zh-CN",
      diaryAccessAffinityThreshold: DIARY_ACCESS_AFFINITY_THRESHOLD,
      constraints: {
        gentleScoring: true,
        noMockery: true,
        noFullSecretLeak: true,
        stableIntegerScores: true
      },
      input
    },
    null,
    2
  );
}

function revealLevelForScore(score: number) {
  if (score >= 88) return 3;
  if (score >= 65) return 2;
  if (score >= 35) return 1;
  return 0;
}

function normalizeJudgeOutput(output: JudgeGuessOutput): JudgeGuessOutput {
  const score = Math.round(output.score);
  let affinityScore = Math.round(output.affinityScore);

  if (affinityScore === score) {
    affinityScore = Math.max(0, Math.min(100, score + (score >= 80 ? -3 : 4)));
  }

  const revealLevel = revealLevelForScore(score);

  return {
    ...output,
    score,
    affinityScore,
    revealLevel,
    canRequestDiaryAccess: affinityScore >= DIARY_ACCESS_AFFINITY_THRESHOLD,
    hitKeywords: Array.from(new Set(output.hitKeywords)).slice(0, 12),
    missedKeywords: Array.from(new Set(output.missedKeywords)).slice(0, 12)
  };
}

export function buildJudgeGuessRequest(input: JudgeGuessInput) {
  const parsedInput = judgeGuessInputSchema.parse(input);

  return {
    schemaName: "JudgeGuessOutput",
    jsonSchema: judgeGuessJsonSchema,
    system: JUDGE_SYSTEM_PROMPT,
    user: buildJudgeUserPrompt(parsedInput),
    temperature: 0.15
  };
}

export async function judgeGuess(
  input: JudgeGuessInput,
  client: StructuredLlmClient
): Promise<JudgeGuessOutput> {
  const request = buildJudgeGuessRequest(input);
  const rawOutput = await client(request);
  const parsedOutput = parseStructuredOutput(
    judgeGuessOutputSchema,
    rawOutput,
    request.schemaName
  );

  return normalizeJudgeOutput(parsedOutput);
}

export { JUDGE_SYSTEM_PROMPT };
