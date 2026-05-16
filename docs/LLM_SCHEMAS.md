# 心事小屋 LLM Schemas

LLM 层位于 `lib/ai`，所有模型输出必须先经过 Zod 校验，再交给 API 或数据库层。前端不解析自由散文。Zod object 均使用 strict 模式，模型返回额外字段会被拒绝。

## 调用接口

业务函数接收统一的结构化 LLM client：

```ts
type StructuredLlmClient = (request: {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  system: string;
  user: string;
  temperature?: number;
}) => Promise<unknown>;
```

后续接 OpenAI、Vercel AI SDK 或 Supabase Edge Function 时，只需要实现这个 client，并确保返回值是已经按 `jsonSchema` 生成的 JSON 对象。

## OpenAI 兼容配置

第一阶段配置从服务端环境变量读取，不暴露给前端：

- `HEART_CABIN_OPENAI_BASE_URL` 或 `OPENAI_BASE_URL`，默认 `https://api.openai.com/v1`
- `HEART_CABIN_OPENAI_API_KEY` 或 `OPENAI_API_KEY`
- `HEART_CABIN_OPENAI_CHAT_MODEL` 或 `OPENAI_CHAT_MODEL` / `OPENAI_MODEL`
- `HEART_CABIN_OPENAI_IMAGE_MODEL` 或 `OPENAI_IMAGE_MODEL`
- `HEART_CABIN_IMAGE_GENERATION_MODE` 或 `OPENAI_IMAGE_GENERATION_MODE`

`HEART_CABIN_IMAGE_GENERATION_MODE` 取值：

- `images_generations`：调用 `POST /v1/images/generations`
- `chat_completions`：调用 `POST /v1/chat/completions`，适配例如 `narra-image` 这类图像模型

LLM 结构化文本统一优先调用 `POST /chat/completions`。配置会自动归一到带 `/v1` 的基础地址，例如 `https://narra.c0ffee.space/v1`。如果没有完整服务端配置，房间生成接口会回退到 mock，方便本地开发。

## 分阶段房间生成

新的房间生成流水线位于 `lib/ai/generateRoomPipeline.ts`：

1. `SecretAnalysisOutput`：分析用户输入的情绪、隐含需要、冲突和隐喻种子。
2. `RoomNarrativeOutput`：生成房间标题、隐藏含义、5 个线索物件、4 个猜测选项、宠物和分享文本。
3. `ClueImagePromptOutput`：为每个线索物件生成图像提示词。
4. 并发调用图像生成模型，为每个线索物件生成单独元素图。
5. 统一组装 `room_json`，供前端渲染 2.5D 微缩小屋。

图像返回支持 URL、`b64_json`、`base64`、data URL 或 chat completion 中的 JSON 内容。URL 会直接记录；base64 会落到服务端 `public/generated/room-assets/`，该目录已加入 `.gitignore`。后续生产环境应替换为 Supabase Storage 或对象存储。

## `generateRoomFromSecret`

输入 schema：`generateRoomFromSecretInputSchema`

```ts
{
  sentence: string;
  emotionTags: string[];
  imageSafeDescription?: string | null;
  creatorStylePreference?: string | null;
}
```

输出 schema：`generateRoomFromSecretOutputSchema`

稳定约束：

- `objects.length === 5`
- `choices.length === 4`
- `choices` 中必须且只能有 1 个 `isCorrect = true`
- public 字段不得直接复述 `sentence`
- 图片描述只能作为辅助线索，不能成为答案本身

输出字段：

- `roomTitle`
- `publicTitle`
- `emotionType`
- `hiddenMeaning`
- `visualTheme`
- `objects[]`
- `choices[]`
- `endingLine`
- `shareText`
- `pet`

## `judgeGuess`

输入 schema：`judgeGuessInputSchema`

```ts
{
  hiddenMeaning: string;
  selectedObjectKeywords: string[];
  selectedChoiceText?: string | null;
  freeTextGuess?: string | null;
}
```

输出 schema：`judgeGuessOutputSchema`

稳定约束：

- `score` 是 0-100 的整数。
- `affinityScore` 是 0-100 的整数。
- `score` 和 `affinityScore` 可以接近，但后处理避免机械相等。
- `canRequestDiaryAccess` 由 `affinityScore >= 70` 决定。
- `revealLevel` 由最终 `score` 归一化得到。
- `partialOriginalSentence` 最长 120 字，不能承担完整答案泄露职责。

## `generateDiaryEntryMarkdown`

输入 schema：`generateDiaryEntryMarkdownInputSchema`

```ts
{
  owner: {
    userId: string;
    displayName: string;
    perspective: "creator" | "player";
  };
  room: {
    roomId: string;
    roomTitle: string;
    publicTitle: string;
    emotionType: string;
    originalSentence?: string | null;
    hiddenMeaning?: string | null;
  };
  guess: {
    guessId: string;
    playerDisplayName?: string | null;
    selectedObjectKeywords: string[];
    freeTextGuess?: string | null;
    selectedChoiceText?: string | null;
    score: number;
    affinityScore: number;
    comment?: string | null;
  } | null;
  eventType:
    | "created_room"
    | "guessed_room"
    | "mutual_result"
    | "pet_memory"
    | "manual_note";
}
```

输出 schema：

```ts
{
  title: string;
  markdownContent: string;
  summary: string;
}
```

约束：

- Markdown 要像日记，不像数据库日志。
- creator 视角可以包含自己的 `originalSentence`。
- player 视角不能包含 A 未授权的完整原句；服务层会做后处理检查。

## `summarizeMemoryDocument`

输入 schema：`summarizeMemoryDocumentInputSchema`

```ts
{
  existingMarkdown: string;
  newEventMarkdown: string;
  scope: {
    ownerId: string;
    scopeType: "user" | "room" | "relationship" | "pet";
    scopeId: string | null;
  };
}
```

输出 schema：

```ts
{
  updatedMarkdown: string;
  summary: string;
}
```

约束：

- 追加和摘要式沉淀。
- 不混合多个 owner 的私密记忆。
- `updatedMarkdown` 会自动补充 scope 注释头，便于排查和防串用。
