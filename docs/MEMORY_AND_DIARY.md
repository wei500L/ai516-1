# Markdown 日记与长期记忆

本文档说明图片线索、日记沉淀、默契度访问申请和留言系统的后端边界。

## 图片线索上传

接口：`POST /api/assets/upload-url`

请求：

```ts
{
  fileName: string;
  contentType: "image/jpeg" | "image/jpg" | "image/png" | "image/webp";
  fileSize: number;
  roomId: string;
  role: "clue_image";
}
```

限制：

- 只允许 jpg/png/webp。
- 最大 5MB。
- 必须带当前用户上下文，当前仓库用 `x-user-id` 请求头占位。
- 只有房间 owner 可以创建图片线索。
- Storage bucket 是私有 `room-assets`，返回的是短期 signed upload URL 和短期 preview URL。
- 创建 `room_assets` 记录，`asset_type = image`，`role = clue_image`。
- `signed_url_strategy.audit_status = pending_review` 预留后续图片审核。

安全原则：

- 不提供“列出所有图片”的接口。
- 图片路径包含 owner 和 room：`{ownerId}/{roomId}/{assetId}-{fileName}.{ext}`。
- 不把图片 URL 全部公开。

## 日记沉淀

核心代码：

- `lib/diary/createDiaryEntry.ts`
- `lib/diary/updateMemoryDocument.ts`
- `lib/diary/repository.ts`

创建房间后应调用 `createCreatedRoomDiary`：

- 为 A 创建 `diary_entries.entry_type = created_room`。
- A 的日记可以包含自己的原句、隐藏含义、小屋标题。
- 同步追加 A 自己 scope 下的 `memory_documents`。

B 猜完后应调用 `createDiaryEntriesForCompletedGuess`：

- 为 B 创建 `guessed_room` 日记。
- 为 A 创建 `mutual_result` 日记，记录 B 的猜测摘要和默契度。
- 分别更新 A/B 自己 owner scope 下的 `memory_documents`。

B 的日记默认只包含：

- B 看到或点击过的线索关键词。
- B 自己的选择和自由猜测。
- B 自己的分数、默契度和结果反馈。
- `partialOriginalSentence` 半揭晓片段。

B 的日记不能包含：

- A 未授权的完整原句。
- A 的完整日记内容。
- A 的长期 memory document。

## 长期记忆隔离

`memory_documents` 只是一份 Markdown 沉淀，不是权限来源。

隔离规则：

- 每次写入必须带 `ownerId`。
- A 的 room memory 与 B 的 room memory 分别写入各自 `owner_id`。
- 即使是同一个 `roomId`，A/B 也不能共用同一个 Markdown 文档。
- 授权访问日记不会自动授权访问 memory document。

权限必须以数据库中的 `diary_access_requests`、`diary_entries.owner_id` 和 RLS/服务端校验为准。

## 默契度访问申请

接口：`POST /api/diary/access-requests`

默认阈值：`80`，定义在 `lib/affinity/canRequestDiaryAccess.ts`。

允许申请条件：

- 当前用户是该 `guess_attempt.player_id`。
- `guess_attempt.room_id` 与请求 `roomId` 一致。
- `guess_attempt.affinity_score >= 80`。
- 找到 A 的 `mutual_result` 日记片段，或请求显式指定 `diaryEntryId`。

申请创建后：

- `status = pending`
- A 可通过 `POST /api/diary/access-requests/[id]/respond` approve/reject。

低默契度、非猜测本人、错房间、未登录均不能申请。

## 留言

接口：`POST /api/diary/comments`

允许留言条件：

- 当前用户是日记 owner；或
- 当前用户是 approved `diary_access_requests.requester_id`。

留言安全：

- 基础过滤 `<script>`、`javascript:`、事件处理属性等明显危险内容。
- 留言写入 `diary_comments`。
- A/B 各自的相关互动只追加安全摘要到自己的 `memory_documents`，不混合双方私密记忆。

## 本地与生产

当前仓库没有 Supabase Auth SDK。接口使用 `x-user-id` 请求头作为当前用户上下文占位，生产环境应替换为真实 Supabase Auth session。

接口需要：

- `SUPABASE_URL` 或 `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

如果没有配置，日记列表返回空列表；需要写入数据库的接口会返回 `server_not_configured`。
