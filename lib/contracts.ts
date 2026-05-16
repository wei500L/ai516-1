import { z } from "zod";

export const clueSchema = z.object({
  id: z.string(),
  title: z.string(),
  hint: z.string(),
  visual: z.enum(["envelope", "clock", "plant", "window", "pet"])
});

export const roomPreviewSchema = z.object({
  roomId: z.string(),
  publicTitle: z.string(),
  clueCount: z.number().int().positive(),
  clues: z.array(clueSchema),
  moodTags: z.array(z.string())
});

export type Clue = z.infer<typeof clueSchema>;
export type RoomPreview = z.infer<typeof roomPreviewSchema>;

export const createRoomDraftSchema = z.object({
  sentence: z.string().min(0).max(120),
  moodTags: z.array(z.enum(["想念", "压力", "吐槽", "暗恋", "小确幸"])),
  envelopeImage: z
    .object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      previewUrl: z.string()
    })
    .nullable()
});

export type CreateRoomDraft = z.infer<typeof createRoomDraftSchema>;
export type MoodTag = CreateRoomDraft["moodTags"][number];

export const roomObjectPositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100)
});

export const roomObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  clue: z.string(),
  keyword: z.string(),
  position: roomObjectPositionSchema,
  assetKey: z.enum(["envelope", "clock", "plant", "window", "chair-note"])
});

export const imageClueSchema = z.object({
  url: z.string(),
  caption: z.string(),
  safeDescription: z.string()
});

export const petCompanionSchema = z.object({
  type: z.enum(["cat", "dog"]),
  name: z.string(),
  mood: z.string()
});

export const publicRoomPlaySchema = z.object({
  roomId: z.string(),
  roomTitle: z.string(),
  publicTitle: z.string(),
  visualTheme: z.string(),
  objects: z.array(roomObjectSchema).length(5),
  imageClue: imageClueSchema.nullable(),
  pet: petCompanionSchema,
  progress: z.number().min(0).max(5),
  discoveredObjectIds: z.array(z.string())
});

export type RoomObject = z.infer<typeof roomObjectSchema>;
export type PublicRoomPlayData = z.infer<typeof publicRoomPlaySchema>;

export const guessOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string()
});

export const publicGuessPageSchema = z.object({
  roomId: z.string(),
  publicTitle: z.string(),
  clues: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      clue: z.string(),
      keyword: z.string()
    })
  ),
  options: z.array(guessOptionSchema)
});

export const guessSubmissionSchema = z.object({
  roomId: z.string(),
  selectedOptionId: z.string(),
  ownGuess: z.string().max(80),
  discoveredObjectIds: z.array(z.string())
});

export const publicGuessResultSchema = z.object({
  guessId: z.string(),
  roomId: z.string(),
  title: z.string(),
  scorePercent: z.number().min(0).max(100),
  tacitScore: z.number().min(0).max(100),
  tacitThreshold: z.number().min(0).max(100),
  badgeTitle: z.string(),
  comment: z.string(),
  hitKeywords: z.array(z.string()),
  missedNote: z.string(),
  partialOriginalSentence: z.string(),
  shareText: z.string(),
  canRequestDiary: z.boolean(),
  savedToDiary: z.boolean()
});

export const ownerResultViewSchema = z.object({
  guesserName: z.string(),
  selectedOptionLabel: z.string(),
  discoveredClues: z.array(z.string()),
  finalGuess: z.string(),
  scorePercent: z.number().min(0).max(100),
  tacitScore: z.number().min(0).max(100),
  diaryRequested: z.boolean(),
  diaryRequestMessage: z.string().nullable()
});

export type GuessOption = z.infer<typeof guessOptionSchema>;
export type PublicGuessPageData = z.infer<typeof publicGuessPageSchema>;
export type GuessSubmission = z.infer<typeof guessSubmissionSchema>;
export type PublicGuessResult = z.infer<typeof publicGuessResultSchema>;
export type OwnerResultViewData = z.infer<typeof ownerResultViewSchema>;

export const demoRoom: RoomPreview = roomPreviewSchema.parse({
  roomId: "demo-paper-cabin",
  publicTitle: "朋友的心事小屋",
  clueCount: 5,
  moodTags: ["想念", "不愿先开口", "偷偷关注"],
  clues: [
    {
      id: "envelope",
      title: "未寄出的信",
      hint: "它知道地址，却一直没有出发。",
      visual: "envelope"
    },
    {
      id: "clock",
      title: "停住的钟",
      hint: "时间总在某个名字附近慢下来。",
      visual: "clock"
    },
    {
      id: "plant",
      title: "窗边植物",
      hint: "被照顾得很好，却不敢搬到阳光正中。",
      visual: "plant"
    },
    {
      id: "window",
      title: "月亮窗",
      hint: "每次亮起来，都会想看看对面有没有灯。",
      visual: "window"
    },
    {
      id: "pet",
      title: "小猫纸条",
      hint: "它只会绕着答案打转，不会把答案叼出来。",
      visual: "pet"
    }
  ]
});
