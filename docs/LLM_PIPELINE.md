# 《心事小屋》LLM 内容生成流水线

本模块位于 `lib/llm/pipeline/*`，用于把一句心事拆成可验证的中间结构。它不直接调用前端，也不生成完整房间大场景图。

## 目标结构

新的流水线输出 `RoomAssetPlan`：

```ts
{
  semanticAnalysis,
  roomDesign,
  imagePromptPlan,
  generationPlan: {
    maxConcurrentImageJobs,
    jobs
  }
}
```

所有阶段均由 Zod schema 校验，LLM 响应必须是结构化 JSON。调用方不应解析自由文本。

## Step 1: 语义分析

入口：`analyzeSecret(input, provider)`

输入：

- `originalSentence`
- `emotionTags`
- `imageClueSafeDescription`
- `creatorStylePreference`

输出：

- `coreEmotion`
- `emotionalTone`
- `relationshipContext`
- `hiddenMeaning`
- `keySubtexts`
- `metaphorDirections`
- `difficultyLevel`
- `safetyAssessment`

这一阶段只分析心事语义，不生成 UI 文案、房间结构或图像提示词。

## Step 2: 房间与线索设计

入口：`designRoom(input, semanticAnalysis, provider)`

输出 `RoomDesign`，其中：

- `objectConcepts` 固定 5 个
- `choiceOptions` 固定 4 个
- `correctChoiceIndex` 指向正确选项
- 每个物件必须具体、可视化、适合作为独立图像元素

物件优先使用能放进微缩小屋的线索类型：

- 信封 / 书信
- 钟
- 月亮
- 椅子
- 聊天框便签
- 书
- 小植物
- 小钥匙
- 小纸条

不要使用“孤独”“遗憾”“等待”这类不可直接绘制的抽象概念作为物件。

## Step 3: 图像提示词生成

入口：`generateObjectPrompts(semanticAnalysis, roomDesign, provider)`

输出：

- `sharedStylePrompt`
- `objectImagePrompts`

每个 prompt 都面向“房间中的线索物件元素图”，不是完整场景图。统一风格为：

- 2.5D
- miniature handmade diorama
- paper craft
- cardboard
- old paper
- soft warm lighting
- cozy
- storybook
- scrapbook
- slightly top-front angle
- isolated object asset
- transparent or clean background preference

默认负向约束包括：

- no full room scene
- no realistic product photography
- no cyberpunk
- no futuristic UI
- no glassmorphism
- no neon
- no complex background

## Step 4: 生成计划

入口：

- `buildRoomAssetPlan(semanticAnalysis, roomDesign, imagePromptPlan, provider)`
- 或完整调用 `createRoomAssetPlan(input, provider)`

`generationPlan.jobs` 会把每个物件提示词整理为后续图像生成任务：

- `jobId`
- `objectId`
- `objectName`
- `prompt`
- `negativePrompt`
- `size`
- `providerMode`
- `responseFormat`

后续图像生成层应读取这些 jobs，并按照后台配置的 `maxConcurrentImageJobs` 并发生成，再调用 provider 的 `normalizeImageResponse()` 统一处理 URL/base64。

## Provider 依赖

流水线依赖 `LlmProvider`：

- 使用 `chatCompletion()` 生成结构化阶段输出
- 使用 provider 配置中的 `chatModel`
- 使用 `enableSchemaValidation` 决定请求 `json_schema` 或 `json_object`
- 使用 provider 配置中的视觉 prompt、图像模式、响应格式和并发数组装 generation plan

Provider 仍保持 OpenAI-compatible 抽象，不绑定具体供应商。

## 现有旧流程关系

旧的 `lib/ai/generateRoomPipeline.ts` 暂时保留，避免一次性改动现有生成入口。新流程先作为独立后端能力落地，后续可逐步把 `/api/rooms/generate` 切到 `createRoomAssetPlan()`，再接图像并发生成和 `room_json` 组装。
