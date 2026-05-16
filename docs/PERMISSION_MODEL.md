# 心事小屋权限模型

权限实现以 Supabase RLS、列授权和安全 RPC 组合完成。重点原则：行权限不能隐藏列，所以 `rooms.original_sentence` 和 `rooms.hidden_meaning` 不通过 play 读取路径暴露。

## 角色

- A：房间创建者，`rooms.creator_id = auth.uid()`。
- B：玩家，可能是登录用户 `guess_attempts.player_id`，也可能是匿名用户 `guess_attempts.anonymous_id`。
- 服务端：使用 service role 执行评分、生成宠物回复、生成 signed URL、沉淀长期记忆等可信操作。

## 房间读取

### A 读取自己的完整房间

`rooms` 表开启 RLS。只有 `creator_id = auth.uid()` 的登录用户可以 `select/insert/update/delete` 自己的房间。

A 可以读取：

- `original_sentence`
- `hidden_meaning`
- `room_title`
- `room_json`
- 其他完整房间字段

### B 打开 play 页面

B 不直接读取 `rooms` 表。play 页面调用：

```ts
supabase.rpc("get_room_play_payload", { p_share_token: token })
```

该 RPC 校验：

- share token 存在；
- share 未过期；
- target user 匹配，或 `target_user_id` 为空；
- room 为 `active`；
- room visibility 为 `unlisted` 或 `public`。

返回字段只包含：

- `room.id`
- `room.creator_id`
- `room.public_title`
- `room.emotion_type`
- `room.visual_theme`
- 安全处理后的 `room.room_json`
- 安全图片线索元数据
- 隐私提示文案

不返回：

- `original_sentence`
- `hidden_meaning`
- `room_title`
- `room_assets.storage_path`

## 猜测提交

`guess_attempts` 插入规则：

- 必须引用有效的 `share_id` 和 `room_id`。
- 必须满足 `is_active_share(share_id, room_id)`。
- 登录玩家必须满足 `player_id = auth.uid()` 且 `anonymous_id is null`。
- 匿名玩家必须满足 `player_id is null` 且 `anonymous_id is not null`。
- 必须写入 `owner_visibility_acknowledged_at`。

客户端列授权只允许插入玩家输入相关字段，不授权客户端直接写 `score`、`affinity_score`、`hit_keywords`、`missed_keywords`、`title`、`comment`、`reveal_level`。这些字段应由服务端评分流程写入。

A 可以读取自己房间下的 guess attempt。登录 B 可以读取自己的 guess attempt。匿名 B 默认不开放历史读取，避免仅凭客户端匿名 ID 枚举他人记录。

## 图片线索

Supabase Storage bucket：`room-assets`，私有。

约定路径：

```text
{creator_id}/{room_id}/{asset_id-or-filename}
```

Storage RLS 只允许 owner 直接管理自己路径下的对象。B 在 play 页面只能看到 `room_assets.public_url` 或 `signed_url_strategy`。如果使用 signed URL，应由服务端在校验 share token 后生成短期 URL。

## 宠物聊天

`pet_conversations` 使用 `room_id + share_id` 作为提交前聊天的权限锚点。

普通客户端只能插入：

- `role = user`
- 当前 share 可访问的消息
- 自己的 `user_id`，或匿名时 `user_id = null`

普通客户端不能插入 `assistant` 消息，不能写 `safe_summary`。宠物回复、摘要、提示等级应由服务端写入。

宠物聊天不拥有读取 `diary_entries` 或 `memory_documents` 的跨表权限。服务端给宠物注入上下文时必须先按当前用户和当前授权范围取数，不能用宠物对话作为绕过日记授权的入口。

## 日记权限

`diary_entries.visibility` 默认 `private`。

非 owner 读取日记必须存在已批准的 `diary_access_requests`：

```text
diary_access_requests.status = approved
diary_access_requests.requester_id = auth.uid()
```

`visibility = shared` 不是全站公开语义，而是“该条目可处在共享状态”。数据库策略仍要求 owner 身份或 approved request。

## 日记申请

B 创建 `diary_access_requests` 时，数据库校验：

- `requester_id = auth.uid()`；
- B 是对应 `guess_attempts.player_id`；
- `guess_attempts.room_id = room_id`；
- `rooms.creator_id = owner_id`；
- `diary_entries.owner_id = owner_id`；
- `diary_entries.room_id = room_id`；
- `diary_entries.visibility` 是 `shared_by_request` 或 `shared`；
- `guess_attempts.affinity_score >= diary_access_threshold()`。

当前阈值：`70`。

A 可以将申请更新为 `approved` 或 `rejected`，并必须写入 `responded_at`。

## 日记留言

`diary_comments` 读取和插入都依赖 `has_diary_access(diary_entry_id)`：

- owner 可以看和写；
- 已获批准的 requester 可以看和写；
- 其他用户不可访问。

## 长期 Markdown 记忆

`memory_documents` 只按 `owner_id = auth.uid()` 开放。

隔离规则：

- `scope_type = user`：只属于当前 owner。
- `scope_type = room`：只属于当前 owner 对某个 room 的记忆。
- `scope_type = relationship`：只属于当前 owner 对某段关系的总结。
- `scope_type = pet`：只属于当前 owner 的宠物记忆。

该表不参与日记共享。即使 B 获得 A 某篇日记访问权，也不会自动获得 A 的 memory document 访问权。

## 服务端职责

以下操作应由可信服务端完成：

- 根据 `share_token` 生成图片 signed URL；
- 计算猜测 `score` 和 `affinity_score`；
- 写入 `relationship_scores`；
- 写入 `assistant` 宠物消息和 `safe_summary`；
- 生成或更新 `memory_documents`；
- 必要时创建双方的系统日记条目。

服务端使用 service role 时会绕过 RLS，因此必须在应用层重复校验当前用户、房间、分享、日记申请之间的关系。
