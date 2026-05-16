# LLM Provider Config

后台 LLM 配置模块用于管理 OpenAI Compatible Provider，不把 provider 写死到 OpenAI 官方。

## 数据表

迁移文件：`supabase/migrations/20260516010000_llm_provider_settings.sql`

表：`llm_provider_settings`

关键字段：

- `provider_name`
- `base_url`
- `api_key_encrypted`
- `chat_model`
- `image_model`
- `chat_endpoint_path`
- `image_endpoint_path`
- `image_mode`
- `image_response_format`
- `default_image_size`
- `timeout_ms`
- `max_concurrent_image_jobs`
- `enable_semantic_analysis`
- `enable_concurrent_image_generation`
- `enable_schema_validation`
- `global_visual_style_prompt`
- `object_style_prompt`
- `negative_prompt`
- `is_active`

`api_key_encrypted` 由服务端使用 AES-256-GCM 加密。优先使用 `HEART_CABIN_LLM_SETTINGS_ENCRYPTION_KEY`，其次 `LLM_PROVIDER_ENCRYPTION_KEY`，再退到 `SUPABASE_SERVICE_ROLE_KEY`。GET 接口只返回脱敏 key。

当前通过唯一部分索引保证同一时间只有一条 `is_active = true`。

## API

- `GET /api/admin/llm-settings`
- `POST /api/admin/llm-settings`
- `POST /api/admin/llm-settings/test-chat`
- `POST /api/admin/llm-settings/test-image`

请求与响应使用 `lib/schemas/adminLlmConfig.ts` 里的 Zod schema。

管理员访问目前支持：

- `HEART_CABIN_ADMIN_API_TOKEN` + 请求头 `x-admin-token`
- `HEART_CABIN_ADMIN_USER_IDS` + 请求头 `x-user-id`

如果两个环境变量都未配置，开发环境默认放行。

## Provider 层

目录：`lib/llm/provider`

- `types.ts`：Provider 类型。
- `openaiCompatibleProvider.ts`：OpenAI Compatible 实现。
- `factory.ts`：从数据库配置创建 Provider。

Provider 能力：

- `chatCompletion()`
- `imageGeneration()`
- `normalizeImageResponse()`

支持接口：

- `POST {baseUrl}{chatEndpointPath}`
- `POST {baseUrl}{imageEndpointPath}`

`baseUrl` 会归一到 `/v1`，endpoint path 可以写 `/v1/chat/completions` 或 `/chat/completions`。

## 图像模式

`images_api`：

```json
{
  "model": "image-model",
  "prompt": "...",
  "size": "1024x1024",
  "response_format": "url"
}
```

`chat_completions_image_model`：

```json
{
  "model": "narra-image",
  "messages": [{ "role": "user", "content": "..." }]
}
```

## 图片响应归一化

`normalizeImageResponse()` 返回：

```ts
{
  images: Array<{
    type: "url" | "base64";
    mimeType?: string;
    url?: string;
    base64?: string;
  }>;
  raw: unknown;
}
```

兼容：

- `data[].url`
- `data[].b64_json`
- `choices[].message.content`
- data URL
- 常见 `base64` / `image` / `image_url` 变体

测试接口只返回耗时、状态和模式摘要，不把第三方原始响应裸露给前端主流程。

