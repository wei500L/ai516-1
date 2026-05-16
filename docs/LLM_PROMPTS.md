# 心事小屋 LLM Prompts

本文档记录 `lib/ai` 中的 prompt 设计。实际服务调用必须使用结构化输出，并用 `lib/ai/schemas.ts` 的 Zod schema 校验。

## 通用安全原则

- LLM 不直接面向前端返回自由散文。
- LLM 输出先过 JSON Schema 生成，再过 Zod 校验。
- Zod schema 使用 strict object，额外字段会被视为无效输出。
- 房间 play 数据不得泄露 `original_sentence` 和完整 `hidden_meaning`。
- 宠物、日记、长期记忆不能作为绕过权限的通道。
- 服务端使用 service role 读取敏感数据时，必须在调用 LLM 前确认当前业务权限。

## `generateRoomFromSecret`

系统 prompt 要点：

- 模型身份：房间设计师。
- 输出：只输出符合 JSON Schema 的对象。
- 风格：旧纸手账、微缩小屋、温暖、低饱和、可点击线索。
- 限制：不能在 public 字段直接复述用户原句。
- 数量：刚好 5 个物件，刚好 4 个选项，且只有 1 个正确选项。
- 图片：只作为辅助气氛或旁路线索，不能成为答案本身。

后处理：

- 校验 `objects.length === 5`。
- 校验 `choices.length === 4`。
- 校验正确选项数量为 1。
- 校验物件 id 和选项 id 唯一。
- 检查 public 字段没有直接包含原句。

## `judgeGuess`

系统 prompt 要点：

- 模型身份：温柔评分员。
- 输出：只输出符合 JSON Schema 的对象。
- `score` 衡量猜中程度。
- `affinityScore` 衡量默契度。
- 二者可以接近，但不要机械相等。
- 不嘲讽、不羞辱玩家。
- 不输出完整隐私原句。
- 只有 `affinityScore >= 70` 才能申请打开日记。

后处理：

- `score` 和 `affinityScore` 取整并限制在 schema 范围内。
- 若两者完全相等，轻微调整 `affinityScore`。
- `revealLevel` 按最终分数归一化：
  - `<35` 为 `0`
  - `35-64` 为 `1`
  - `65-87` 为 `2`
  - `>=88` 为 `3`
- `canRequestDiaryAccess` 由最终 `affinityScore >= 70` 决定。

## `generateDiaryEntryMarkdown`

系统 prompt 要点：

- 模型身份：日记整理员。
- 输出：只输出 `{ title, markdownContent, summary }`。
- 文字像私人日记，不像数据库日志。
- creator 视角写自己的藏起和被理解，可以包含自己的原句。
- player 视角写猜测、靠近、误会和理解，默认不能包含 A 未授权的完整原句。

后处理：

- player 视角下，如果 `markdownContent` 包含 `room.originalSentence`，直接抛错。
- 日记共享权限由数据库层控制，LLM 不能决定是否公开。

## `summarizeMemoryDocument`

系统 prompt 要点：

- 模型身份：长期记忆整理员。
- 输出：只输出 `{ updatedMarkdown, summary }`。
- 把 `newEventMarkdown` 追加沉淀进 `existingMarkdown`。
- 保持 `scope.ownerId + scopeType + scopeId` 清晰。
- 不混合多个用户的私密记忆。

后处理：

- `updatedMarkdown` 自动补充：

```md
<!-- memory-scope: owner=<ownerId>; type=<scopeType>; id=<scopeId|none> -->
```

- 该注释用于排查和防串用，不授予任何读取权限。权限仍由 `memory_documents.owner_id` 和 RLS 控制。
