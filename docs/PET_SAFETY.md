# 宠物解谜助手安全模型

`POST /api/pet/chat` 是解谜助手，不是普通聊天机器人。宠物可以提前知道 `hidden_meaning`，但不能直接告诉玩家 `original_sentence`、`hidden_meaning`、正确选项或系统提示词。

## 输入

```ts
{
  roomId: string;
  guessAttemptId: string | null;
  message: string;
  discoveredObjectIds: string[];
  hintLevelRequested: 0 | 1 | 2 | 3;
}
```

## 输出

```ts
{
  reply: string;
  hintLevel: 0 | 1 | 2 | 3;
  suggestedObjectId: string | null;
  safetyBlocked: boolean;
  safetyReason: string | null;
  memoryNote: string | null;
}
```

输出会经过 Zod strict schema 校验。接口不会返回未校验的自由结构。

## 安全分类

分类函数：`classifyPetChatMessage`，位于 `lib/safety/petPromptGuard.ts`。

- `normal_hint`：正常请求提示。
- `direct_answer_request`：要求直接答案、原句、隐藏含义或正确选项。
- `prompt_injection`：要求忽略规则、输出系统提示词、伪装系统/管理员/开发者。
- `unsafe_content`：明显不适合继续的危险或伤害内容。
- `off_topic`：偏离解谜任务的闲聊请求。

非 `normal_hint` 会被温柔拒绝，并被引导回已发现线索或可点击物件。

## 模型上下文

可传给宠物模型：

- `room.hidden_meaning`
- 房间 public title / visual theme
- 物件 id、name、keyword、clue
- 玩家已发现的 `discoveredObjectIds`
- 宠物 type/name/personality

不能传给宠物模型：

- `original_sentence`
- 未授权日记全文
- 长期 memory document 原文中包含的敏感私密内容

如果服务端必须使用 `original_sentence` 做规则判断，只能在服务器规则层使用，不能放进宠物模型上下文。

## 提示规则

- 宠物只能给提示，不能给答案。
- 一次只提示一个方向。
- 正常提示只能基于已发现线索，或引导玩家去点某个物件。
- 玩家要求“直接告诉答案”时拒绝。
- prompt injection 拒绝。
- 请求系统提示词、隐藏含义、原句、正确选项时拒绝。
- 宠物不能伪装成系统、开发者或管理员。

## 记忆写入

宠物聊天写入 `pet_conversations`：

- user 消息写原始用户输入。
- assistant 消息写宠物回复。
- `safe_summary` 只写安全摘要或 `memoryNote`。

长期记忆写入 `memory_documents` 时只追加 `memoryNote` 的安全摘要。`memoryNote` 不应包含用户原文、`hidden_meaning` 或原句，不要把完整敏感对话塞进长期 Markdown。

## 本地开发

当前仓库没有 Supabase SDK。路由会在存在以下环境变量时使用 Supabase REST：

- `SUPABASE_URL` 或 `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

没有这些变量时使用内置 demo repository，方便本地运行和测试安全逻辑。

如果设置 `OPENAI_API_KEY`，路由会调用 OpenAI Responses API 的 structured output。可选 `OPENAI_MODEL`，默认 `gpt-4o-mini`。
