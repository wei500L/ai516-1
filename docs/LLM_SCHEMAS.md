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
