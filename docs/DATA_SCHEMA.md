# 心事小屋数据模型

本文档对应 `supabase/migrations/20260516000000_heart_cabin_schema.sql` 和 `lib/database.types.ts`。当前阶段只覆盖数据库 schema、类型定义和权限边界，不包含前端和 LLM 实现。

## 核心对象

### `profiles`

用户公开资料表，`id` 关联 Supabase `auth.users.id`。

字段：`id`、`display_name`、`avatar_url`、`created_at`。

### `rooms`

A 创建的心事小屋。

字段：`id`、`creator_id`、`original_sentence`、`hidden_meaning`、`room_title`、`public_title`、`emotion_type`、`visual_theme`、`room_json`、`visibility`、`status`、`created_at`、`updated_at`。

隐私说明：

- `original_sentence` 是 A 的原始心事，敏感。
- `hidden_meaning` 是正确含义/答案，敏感。
- 玩家 B 的 play 页面不能直接读取 `rooms` 表，而是通过 `get_room_play_payload(share_token)` 获取安全字段。
- `room_json` 只能存放可给玩家看的线索、物件和展示配置，不应写入答案、原句或隐藏含义。RPC 会剥离常见答案键，但这只是兜底。

### `room_assets`

图片线索元数据表。

字段：`id`、`room_id`、`creator_id`、`storage_path`、`public_url`、`signed_url_strategy`、`asset_type`、`role`、`safe_description`、`created_at`。

设计：

- `asset_type` 当前为 `image`。
- `role` 当前为 `clue_image`。
- Supabase Storage bucket 为私有 `room-assets`。
- play payload 只返回 `public_url` 或 `signed_url_strategy` 等安全字段，不返回 `storage_path`。

### `room_shares`

分享链接表。

字段：`id`、`room_id`、`creator_id`、`share_token`、`target_user_id`、`created_at`、`expires_at`。

设计：

- `share_token` 是分享链接入口，不把房间敏感信息编码进链接。
- `target_user_id` 为空表示任何拿到链接的人可进入；非空时只允许目标用户访问。
- `expires_at` 为空表示不过期。

### `guess_attempts`

B 的猜测提交与系统计算结果。

字段：`id`、`room_id`、`share_id`、`player_id`、`anonymous_id`、`selected_object_ids`、`selected_choice_index`、`free_text_guess`、`score`、`affinity_score`、`hit_keywords`、`missed_keywords`、`title`、`comment`、`reveal_level`、`owner_visibility_acknowledged_at`、`created_at`。

设计：

- `player_id` 和 `anonymous_id` 必须二选一。
- `owner_visibility_acknowledged_at` 是提交前已提示“房间主人可查看你的猜测”的数据库证明。
- 客户端只能插入玩家输入字段；`score`、`affinity_score`、`hit_keywords`、`missed_keywords`、`title`、`comment`、`reveal_level` 建议由服务端计算后写入。
- A 可以读取自己房间下的 guess attempt；登录 B 可以读取自己的 guess attempt。

### `pet_conversations`

宠物聊天记录。

字段：`id`、`room_id`、`share_id`、`guess_attempt_id`、`user_id`、`role`、`content`、`safe_summary`、`hint_level`、`created_at`。

设计：

- `share_id` 是为“提交猜测前也能聊天”补充的权限锚点。
- 普通客户端只能插入 `role = user` 的消息。
- `assistant` 消息、摘要和实际提示等级应由服务端写入。
- 宠物聊天只绑定房间/分享/猜测，不直接绑定日记或长期记忆，避免绕过日记权限。

### `diary_entries`

双方可留存的日记条目。

字段：`id`、`owner_id`、`room_id`、`guess_attempt_id`、`entry_type`、`title`、`markdown_content`、`visibility`、`created_at`、`updated_at`。

`entry_type`：

- `created_room`
- `guessed_room`
- `mutual_result`
- `pet_memory`
- `manual_note`

`visibility`：

- `private`，默认值。
- `shared_by_request`，可通过申请授权查看。
- `shared`，已共享状态；非 owner 仍需有授权记录。

### `diary_access_requests`

B 达到默契度阈值后申请打开 A 的日记片段。

字段：`id`、`diary_entry_id`、`requester_id`、`owner_id`、`room_id`、`guess_attempt_id`、`message`、`status`、`created_at`、`responded_at`。

设计：

- `status` 为 `pending`、`approved`、`rejected`。
- 当前数据库阈值由 `diary_access_threshold()` 定义为 `70`。
- 插入申请时校验：申请人是该 `guess_attempt` 的玩家、房间属于日记 owner、`affinity_score >= 70`。
- 只有 `visibility` 为 `shared_by_request` 或 `shared` 的日记片段可被申请；默认 `private` 不可直接申请。

### `diary_comments`

获得日记访问权后留言。

字段：`id`、`diary_entry_id`、`author_id`、`owner_id`、`content`、`created_at`。

只有日记 owner 或已获批准的 requester 可以读取/留言。

### `memory_documents`

Markdown 长期记忆沉淀表。

字段：`id`、`owner_id`、`scope_type`、`scope_id`、`markdown_content`、`summary`、`created_at`、`updated_at`。

`scope_type`：

- `user`
- `room`
- `relationship`
- `pet`

设计：

- 该表按 `owner_id` 强隔离。
- 不作为共享日记表使用。
- 宠物长期记忆只读写当前 owner 的 memory document，不能以此读取他人日记。

### `relationship_scores`

A/B 在一次互动中的默契度沉淀。

字段：`id`、`user_a_id`、`user_b_id`、`room_id`、`guess_attempt_id`、`affinity_score`、`created_at`。

设计：

- 每个 `guess_attempt_id` 只生成一条关系分数。
- 只有关系双方可读取。
- 写入建议由服务端完成。

## 推荐业务流

1. A 登录后创建 `profiles` 和 `rooms`，写入完整 `original_sentence`、`hidden_meaning`、`room_json`。
2. A 上传图片到私有 bucket `room-assets`，写入 `room_assets`。
3. A 创建 `room_shares`，得到 `share_token`。
4. B 打开分享链接，调用 `get_room_play_payload(share_token)` 获取安全房间数据和图片线索元数据。
5. B 提交猜测，写入 `guess_attempts`，必须带 `owner_visibility_acknowledged_at`。
6. 服务端计算 `score`、`affinity_score`、关键词命中、揭示级别，并写回 `guess_attempts`。
7. A 读取自己房间下的 `guess_attempts`。
8. A/B 分别写入自己的 `diary_entries`，默认 `private`。
9. 若 B 的 `affinity_score >= 70`，B 可创建 `diary_access_requests`。
10. A 批准后，B 可读取该日记条目并写入 `diary_comments`。
