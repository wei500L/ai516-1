# 《心事小屋》线索物件图像生成流水线

本模块位于 `lib/llm/imageJobs/*`，负责把 `RoomAssetPlan.imagePromptPlan` 中的 5 个线索物件 prompt 并发变成可落库的图片资产。

## 输入

- `provider`
- `roomAssetPlan`
- `roomId`
- `creatorId`

其中 `roomAssetPlan.imagePromptPlan.objectImagePrompts` 固定 5 条。

## 处理流程

1. `runObjectImageJobs()` 读取 5 个 prompt。
2. 通过 Promise-based limiter 并发执行，限制值取自 `provider.config.maxConcurrentImageJobs`。
3. 每个任务调用 provider 的 `imageGeneration()`。
4. 对返回值执行 `normalizeImageResponse()`，兼容：
   - `data[].url`
   - `data[].b64_json`
   - `base64`
   - data URL
   - chat completion 中返回的嵌入 JSON
5. 使用 `downloadOrDecodeImage()` 将 URL 下载成 buffer，或将 base64 解码成 buffer。
6. 使用 `uploadGeneratedAsset()` 上传到 Supabase Storage，或在缺少后端存储时回退到本地 `public/generated/room-assets/`。
7. 使用 `storeGeneratedAsset()` 写入 `room_assets`。

## 返回结构

```ts
{
  roomAssetResults: [...],
  generationSummary: {
    successCount: number,
    failedCount: number
  }
}
```

单个任务失败不会中断其他任务。失败项会返回：

- `status: "failed"`
- `error`
- `retryable`
- `fallbackPlan`

成功项会返回：

- `assetId`
- `storagePath`
- `publicUrl`
- `sourceType`
- `mimeType`

## 存储约定

- 资产表：`room_assets`
- 资产类型：`image`
- 角色：`clue_image`
- 存储桶：`room-assets`

服务端优先使用 Supabase Storage。若没有配置 Supabase 服务角色，则会回退到本地 `public/generated/room-assets/`，以保证开发环境可运行。

## 失败策略

- 不允许 1 张失败导致整组失败。
- 对失败项保留错误信息和可重试标记。
- 上游可根据 `fallbackPlan` 决定是否替换为占位素材。

## 注意

这套图片是“微缩小屋中的线索物件素材”，不是首页海报，也不是完整房间全景图。
