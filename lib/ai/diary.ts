import {
  diaryEntryJsonSchema,
  generateDiaryEntryMarkdownInputSchema,
  generateDiaryEntryMarkdownOutputSchema,
  memoryDocumentJsonSchema,
  parseStructuredOutput,
  summarizeMemoryDocumentInputSchema,
  summarizeMemoryDocumentOutputSchema,
  type GenerateDiaryEntryMarkdownInput,
  type GenerateDiaryEntryMarkdownOutput,
  type StructuredLlmClient,
  type SummarizeMemoryDocumentInput,
  type SummarizeMemoryDocumentOutput
} from "@/lib/ai/schemas";

const DIARY_SYSTEM_PROMPT = [
  "你是《心事小屋》的日记整理员，只输出符合 JSON Schema 的对象。",
  "markdownContent 要像一篇私人日记，而不是数据库日志或产品事件记录。",
  "日记应使用 Markdown，包含简短标题、几段自然文字、可以有少量列表。",
  "不同 owner.perspective 必须有不同视角：creator 写自己的藏起与被理解；player 写自己的猜测与靠近。",
  "当 owner.perspective=creator 时，可以包含 room.originalSentence。",
  "当 owner.perspective=player 时，默认不能包含 A 未授权的完整原句，即使输入里有 originalSentence 也要避免复述。",
  "不要编造重大经历；不要泄露其他用户的私密长期记忆。"
].join("\n");

const MEMORY_SYSTEM_PROMPT = [
  "你是《心事小屋》的长期记忆整理员，只输出符合 JSON Schema 的对象。",
  "你要把 newEventMarkdown 追加沉淀进 existingMarkdown，并生成 summary。",
  "必须保持 scope 清晰，不要把多个用户的私密记忆混在一起。",
  "updatedMarkdown 必须是 Markdown，保留已有内容的主要信息，再加入新的事件小节。",
  "summary 应是当前 scope 内的简短摘要，不要包含其他 owner 的信息。"
].join("\n");

function buildDiaryUserPrompt(input: GenerateDiaryEntryMarkdownInput) {
  return JSON.stringify(
    {
      task: "generateDiaryEntryMarkdown",
      language: "zh-CN",
      constraints: {
        diaryTone: true,
        notDatabaseLog: true,
        creatorMayIncludeOriginalSentence: true,
        playerMustNotIncludeUnauthorizedFullOriginalSentence: true
      },
      input
    },
    null,
    2
  );
}

function buildMemoryUserPrompt(input: SummarizeMemoryDocumentInput) {
  return JSON.stringify(
    {
      task: "summarizeMemoryDocument",
      language: "zh-CN",
      constraints: {
        appendAndSummarize: true,
        strictOwnerScopeIsolation: true,
        markdownOnlyInUpdatedMarkdown: true
      },
      input
    },
    null,
    2
  );
}

function normalizeDiaryOutput(
  output: GenerateDiaryEntryMarkdownOutput,
  input: GenerateDiaryEntryMarkdownInput
): GenerateDiaryEntryMarkdownOutput {
  if (
    input.owner.perspective === "player" &&
    input.room.originalSentence &&
    output.markdownContent.includes(input.room.originalSentence)
  ) {
    throw new Error("Player diary must not include creator original sentence");
  }

  return output;
}

function normalizeMemoryOutput(
  output: SummarizeMemoryDocumentOutput,
  input: SummarizeMemoryDocumentInput
): SummarizeMemoryDocumentOutput {
  const scopeHeader = `<!-- memory-scope: owner=${input.scope.ownerId}; type=${input.scope.scopeType}; id=${input.scope.scopeId ?? "none"} -->`;

  if (output.updatedMarkdown.includes(scopeHeader)) {
    return output;
  }

  return {
    ...output,
    updatedMarkdown: `${scopeHeader}\n\n${output.updatedMarkdown.trim()}`
  };
}

export function buildGenerateDiaryEntryRequest(
  input: GenerateDiaryEntryMarkdownInput
) {
  const parsedInput = generateDiaryEntryMarkdownInputSchema.parse(input);

  return {
    schemaName: "GenerateDiaryEntryMarkdownOutput",
    jsonSchema: diaryEntryJsonSchema,
    system: DIARY_SYSTEM_PROMPT,
    user: buildDiaryUserPrompt(parsedInput),
    temperature: 0.3
  };
}

export async function generateDiaryEntryMarkdown(
  input: GenerateDiaryEntryMarkdownInput,
  client: StructuredLlmClient
): Promise<GenerateDiaryEntryMarkdownOutput> {
  const parsedInput = generateDiaryEntryMarkdownInputSchema.parse(input);
  const request = buildGenerateDiaryEntryRequest(parsedInput);
  const rawOutput = await client(request);
  const parsedOutput = parseStructuredOutput(
    generateDiaryEntryMarkdownOutputSchema,
    rawOutput,
    request.schemaName
  );

  return normalizeDiaryOutput(parsedOutput, parsedInput);
}

export function buildSummarizeMemoryDocumentRequest(
  input: SummarizeMemoryDocumentInput
) {
  const parsedInput = summarizeMemoryDocumentInputSchema.parse(input);

  return {
    schemaName: "SummarizeMemoryDocumentOutput",
    jsonSchema: memoryDocumentJsonSchema,
    system: MEMORY_SYSTEM_PROMPT,
    user: buildMemoryUserPrompt(parsedInput),
    temperature: 0.2
  };
}

export async function summarizeMemoryDocument(
  input: SummarizeMemoryDocumentInput,
  client: StructuredLlmClient
): Promise<SummarizeMemoryDocumentOutput> {
  const parsedInput = summarizeMemoryDocumentInputSchema.parse(input);
  const request = buildSummarizeMemoryDocumentRequest(parsedInput);
  const rawOutput = await client(request);
  const parsedOutput = parseStructuredOutput(
    summarizeMemoryDocumentOutputSchema,
    rawOutput,
    request.schemaName
  );

  return normalizeMemoryOutput(parsedOutput, parsedInput);
}

export { DIARY_SYSTEM_PROMPT, MEMORY_SYSTEM_PROMPT };
