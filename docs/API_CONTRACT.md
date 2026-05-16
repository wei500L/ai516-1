# 心事小屋 API Contract

本文档定义前端可依赖的 API 契约。当前 handler 为 mock/service placeholder，但所有请求和响应都已通过 Zod schema 固化。

代码入口：

- Zod schema：`lib/schemas/api.ts`
- TypeScript 类型：`lib/contracts/api.ts`
- 统一 HTTP helper：`lib/api/http.ts`
- mock service：`lib/api/mock-services.ts`

## 通用规则

所有接口返回 JSON。

统一错误结构：

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request body does not match API contract",
    "details": {}
  }
}
```

常见错误码：

- `invalid_json`：请求体不是合法 JSON。
- `validation_error`：路径参数或 body 不符合 schema。
- `unauthorized`：未登录。
- `forbidden`：无权访问该资源。
- `not_found`：资源不存在或不可见。
- `contract_response_invalid`：handler 返回值不符合响应 schema。

敏感字段隔离：

- play API 不能返回 `original_sentence`、`hidden_meaning`、`correct_choice_index`、private diary、full memory document。
- pet/chat 不能返回 `original_sentence` 或 `hidden_meaning`。
- diary API 只返回当前用户自己的日记列表。
- owner-results 只允许房间 creator 访问。

## 1. `POST /api/rooms/generate`

用途：用户 A 输入一句心事，可选关联已上传图片线索，生成房间。

当服务端存在完整 OpenAI 兼容配置时，该接口会执行分阶段生成：

1. 语义分析
2. 房间叙事结构与线索设计
3. 线索物件图像提示词
4. 并发生成线索物件元素图
5. 组装 `room_json`

无完整 AI 配置时保留 `generateRoomService` mock，便于本地开发。API key 只允许存在服务端配置中，不能由前端传入。

Request:

```ts
{
  sentence: string;
  emotionTags: string[];
  imageAssetId: string | null;
  visibility: "private" | "unlisted" | "public";
}
```

Response `201`:

```ts
{
  roomId: string;
  roomTitle: string;
  publicTitle: string;
  createdAt: string;
  redirectUrl: string;
}
```

## 2. `GET /api/rooms/:roomId/play`

用途：玩家 B 进入房间游玩。

Response `200`:

```ts
{
  roomId: string;
  publicTitle: string;
  visualTheme: string;
  objects: Array<{
    id: string;
    title: string;
    description: string;
    discovered: boolean;
    imageUrl?: string | null;
  }>;
  imageClue: {
    assetId: string;
    url: string | null;
    alt: string;
    safeDescription: string | null;
  } | null;
  pet: {
    name: string;
    avatarUrl: string | null;
    mood: string;
    maxHintLevel: 0 | 1 | 2 | 3;
  };
  choices?: Array<{
    index: number;
    label: string;
    description?: string;
  }>;
  progress: {
    discoveredObjectIds: string[];
    currentStep: "explore" | "guess" | "result";
    hintLevelUsed: number;
  };
}
```

禁止返回：

- `original_sentence`
- `hidden_meaning`
- `correct_choice_index`
- private diary
- full memory document

## 3. `POST /api/guesses`

用途：玩家提交猜测。

Request:

```ts
{
  roomId: string;
  shareToken: string | null;
  selectedObjectIds: string[];
  selectedChoiceIndex: number | null;
  freeTextGuess: string | null;
  petConversationSummary: string | null;
}
```

校验规则：

- `selectedChoiceIndex` 和非空 `freeTextGuess` 至少提供一个。
- 后端落库时必须确保玩家已确认“房间主人可查看你的猜测”。

Response `201`:

```ts
{
  guessId: string;
  score: number;
  affinityScore: number;
  title: string;
  comment: string;
  hitKeywords: string[];
  missedKeywords: string[];
  revealLevel: 0 | 1 | 2 | 3;
  partialOriginalSentence: string;
  resultUrl: string;
}
```

说明：`partialOriginalSentence` 只能是按 `revealLevel` 允许展示的片段，不能直接返回完整原句。

## 4. `GET /api/guesses/:guessId/result`

用途：玩家查看自己的结果。

Response `200`:

```ts
{
  score: number;
  affinityScore: number;
  title: string;
  comment: string;
  hitKeywords: string[];
  missedKeywords: string[];
  partialOriginalSentence: string;
  shareText: string;
  canRequestDiaryAccess: boolean;
  diaryAccessThreshold: number;
}
```

权限：只能查看自己的 guess result；creator 结果列表走 owner-results。

## 5. `GET /api/rooms/:roomId/owner-results`

用途：用户 A 查看自己房间的猜测结果列表。

权限：只有 `rooms.creator_id = currentUser.id` 可以访问。

Response `200`:

```ts
{
  guesses: Array<{
    guessId: string;
    player: {
      userId: string | null;
      anonymousId: string | null;
      displayName: string;
      avatarUrl: string | null;
    };
    selectedObjectIds: string[];
    selectedChoiceIndex: number | null;
    freeTextGuess: string | null;
    score: number;
    affinityScore: number;
    comment: string;
    diaryAccessRequest: {
      id: string;
      status: "pending" | "approved" | "rejected";
    } | null;
    createdAt: string;
  }>;
}
```

## 6. `POST /api/pet/chat`

用途：房间宠物辅助解谜。

Request:

```ts
{
  roomId: string;
  guessAttemptId: string | null;
  message: string;
  discoveredObjectIds: string[];
  hintLevelRequested: 0 | 1 | 2 | 3;
}
```

Response `200`:

```ts
{
  reply: string;
  hintLevel: 0 | 1 | 2 | 3;
  safetyBlocked: boolean;
  suggestedObjectId: string | null;
}
```

安全规则：

- 不能直接泄露答案。
- 不能返回 `original_sentence`、`hidden_meaning` 或完整日记。
- 只能基于 public room data、已发现线索和授权摘要生成提示。

## 7. `POST /api/diary/access-requests`

用途：默契度达标后，B 申请打开 A 的日记片段。

Request:

```ts
{
  roomId: string;
  guessId: string;
  message: string;
}
```

Response `201`:

```ts
{
  requestId: string;
  status: "pending" | "approved" | "rejected";
}
```

权限：后端必须验证该 guess 属于当前玩家，且 `affinityScore >= diaryAccessThreshold`。

## 8. `POST /api/diary/access-requests/:id/respond`

用途：A 同意或拒绝日记访问请求。

Request:

```ts
{
  status: "approved" | "rejected";
  responseMessage?: string | null;
}
```

Response `200`:

```ts
{
  requestId: string;
  status: "approved" | "rejected";
  respondedAt: string;
}
```

权限：只有日记 owner 可以响应。

## 9. `GET /api/diary`

用途：读取当前用户自己的日记列表。

Response `200`:

```ts
{
  entries: Array<{
    id: string;
    entryType:
      | "created_room"
      | "guessed_room"
      | "mutual_result"
      | "pet_memory"
      | "manual_note";
    title: string;
    markdownPreview: string;
    visibility: "private" | "shared_by_request" | "shared";
    roomId: string | null;
    guessAttemptId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

安全规则：该接口不接受 ownerId 参数，不返回他人的日记。

## 10. `POST /api/diary/comments`

用途：在授权日记片段下留言。

Request:

```ts
{
  diaryEntryId: string;
  content: string;
}
```

Response `201`:

```ts
{
  comment: {
    id: string;
    diaryEntryId: string;
    authorId: string;
    ownerId: string;
    content: string;
    createdAt: string;
  };
}
```

权限：只有日记 owner 或已获批准的 requester 可以留言。

## 11. `POST /api/assets/upload-url`

用途：为图片线索创建上传签名 URL，或作为后续直传处理入口。

Request:

```ts
{
  fileName: string;
  contentType: "image/png" | "image/jpeg" | "image/jpg" | "image/webp";
  fileSize: number;
  roomId: string;
  role: "clue_image";
}
```

Response `201`:

```ts
{
  assetId: string;
  uploadUrl: string;
  storagePath: string;
  previewUrl: string;
  publicUrl: string | null;
  expiresAt: string;
}
```

约束：

- 最大文件大小为 5 MB。
- bucket 应为私有。
- `publicUrl` 默认为 `null`，`previewUrl` 是短期 signed URL，play 页面应使用经过授权的 safe image data。
