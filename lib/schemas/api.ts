import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional()
  })
});

export const idSchema = z.string().min(1);
export const nullableIdSchema = idSchema.nullable();
export const isoDateTimeSchema = z.string().datetime();

export const roomVisibilitySchema = z.enum(["private", "unlisted", "public"]);
export const revealLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3)
]);
export const diaryAccessRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected"
]);
export const diaryEntryVisibilitySchema = z.enum([
  "private",
  "shared_by_request",
  "shared"
]);
export const diaryEntryTypeSchema = z.enum([
  "created_room",
  "guessed_room",
  "mutual_result",
  "pet_memory",
  "manual_note"
]);

export const publicRoomObjectSchema = z.object({
  id: idSchema,
  title: z.string(),
  description: z.string(),
  discovered: z.boolean(),
  imageUrl: z.string().url().nullable().optional()
});

export const publicImageClueSchema = z.object({
  assetId: idSchema,
  url: z.string().url().nullable(),
  alt: z.string(),
  safeDescription: z.string().nullable()
});

export const publicPetSchema = z.object({
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  mood: z.string(),
  maxHintLevel: revealLevelSchema
});

export const publicChoiceSchema = z.object({
  index: z.number().int().min(0),
  label: z.string(),
  description: z.string().optional()
});

export const playProgressSchema = z.object({
  discoveredObjectIds: z.array(idSchema),
  currentStep: z.enum(["explore", "guess", "result"]),
  hintLevelUsed: revealLevelSchema
});

export const playerDisplaySchema = z.object({
  userId: nullableIdSchema,
  anonymousId: z.string().nullable(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable()
});

export const diaryAccessRequestSummarySchema = z.object({
  id: idSchema,
  status: diaryAccessRequestStatusSchema
});

export const diaryEntrySummarySchema = z.object({
  id: idSchema,
  entryType: diaryEntryTypeSchema,
  title: z.string(),
  markdownPreview: z.string(),
  visibility: diaryEntryVisibilitySchema,
  roomId: nullableIdSchema,
  guessAttemptId: nullableIdSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});

export const diaryCommentSchema = z.object({
  id: idSchema,
  diaryEntryId: idSchema,
  authorId: idSchema,
  ownerId: idSchema,
  content: z.string(),
  createdAt: isoDateTimeSchema
});

export const generateRoomRequestSchema = z.object({
  sentence: z.string().min(1).max(500),
  emotionTags: z.array(z.string().min(1)).max(12),
  imageAssetId: nullableIdSchema,
  visibility: roomVisibilitySchema
});

export const generateRoomResponseSchema = z.object({
  roomId: idSchema,
  roomTitle: z.string(),
  publicTitle: z.string(),
  createdAt: isoDateTimeSchema,
  redirectUrl: z.string()
});

export const getRoomPlayParamsSchema = z.object({
  roomId: idSchema
});

export const getRoomPlayResponseSchema = z.object({
  roomId: idSchema,
  publicTitle: z.string(),
  visualTheme: z.string(),
  objects: z.array(publicRoomObjectSchema),
  imageClue: publicImageClueSchema.nullable(),
  pet: publicPetSchema,
  choices: z.array(publicChoiceSchema).optional(),
  progress: playProgressSchema
});

export const submitGuessRequestSchema = z
  .object({
    roomId: idSchema,
    shareToken: z.string().min(1).nullable(),
    selectedObjectIds: z.array(idSchema),
    selectedChoiceIndex: z.number().int().min(0).nullable(),
    freeTextGuess: z.string().max(2000).nullable(),
    petConversationSummary: z.string().max(4000).nullable()
  })
  .refine(
    (value) =>
      value.selectedChoiceIndex !== null ||
      (value.freeTextGuess !== null && value.freeTextGuess.trim().length > 0),
    {
      message: "Either selectedChoiceIndex or freeTextGuess is required",
      path: ["freeTextGuess"]
    }
  );

export const submitGuessResponseSchema = z.object({
  guessId: idSchema,
  score: z.number().min(0).max(100),
  affinityScore: z.number().int().min(0).max(100),
  title: z.string(),
  comment: z.string(),
  hitKeywords: z.array(z.string()),
  missedKeywords: z.array(z.string()),
  revealLevel: revealLevelSchema,
  partialOriginalSentence: z.string(),
  resultUrl: z.string()
});

export const getGuessResultParamsSchema = z.object({
  guessId: idSchema
});

export const getGuessResultResponseSchema = z.object({
  score: z.number().min(0).max(100),
  affinityScore: z.number().int().min(0).max(100),
  title: z.string(),
  comment: z.string(),
  hitKeywords: z.array(z.string()),
  missedKeywords: z.array(z.string()),
  partialOriginalSentence: z.string(),
  shareText: z.string(),
  canRequestDiaryAccess: z.boolean(),
  diaryAccessThreshold: z.number().int().min(0).max(100)
});

export const getOwnerResultsParamsSchema = z.object({
  roomId: idSchema
});

export const ownerRoomGuessSchema = z.object({
  guessId: idSchema,
  player: playerDisplaySchema,
  selectedObjectIds: z.array(idSchema),
  selectedChoiceIndex: z.number().int().min(0).nullable(),
  freeTextGuess: z.string().nullable(),
  score: z.number().min(0).max(100),
  affinityScore: z.number().int().min(0).max(100),
  comment: z.string(),
  diaryAccessRequest: diaryAccessRequestSummarySchema.nullable(),
  createdAt: isoDateTimeSchema
});

export const getOwnerResultsResponseSchema = z.object({
  guesses: z.array(ownerRoomGuessSchema)
});

export const petChatRequestSchema = z.object({
  roomId: idSchema,
  guessAttemptId: nullableIdSchema,
  message: z.string().min(1).max(2000),
  discoveredObjectIds: z.array(idSchema),
  hintLevelRequested: revealLevelSchema
});

export const petChatResponseSchema = z.object({
  reply: z.string(),
  hintLevel: revealLevelSchema,
  safetyBlocked: z.boolean(),
  suggestedObjectId: nullableIdSchema
});

export const createDiaryAccessRequestRequestSchema = z.object({
  roomId: idSchema,
  guessId: idSchema,
  message: z.string().max(1000)
});

export const createDiaryAccessRequestResponseSchema = z.object({
  requestId: idSchema,
  status: diaryAccessRequestStatusSchema
});

export const respondDiaryAccessRequestParamsSchema = z.object({
  id: idSchema
});

export const respondDiaryAccessRequestRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  responseMessage: z.string().max(1000).nullable().optional()
});

export const respondDiaryAccessRequestResponseSchema = z.object({
  requestId: idSchema,
  status: z.enum(["approved", "rejected"]),
  respondedAt: isoDateTimeSchema
});

export const getDiaryResponseSchema = z.object({
  entries: z.array(diaryEntrySummarySchema)
});

export const createDiaryCommentRequestSchema = z.object({
  diaryEntryId: idSchema,
  content: z.string().min(1).max(2000)
});

export const createDiaryCommentResponseSchema = z.object({
  comment: diaryCommentSchema
});

export const createAssetUploadUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(png|jpeg|jpg|webp|gif)$/),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
  roomId: nullableIdSchema,
  role: z.enum(["clue_image"])
});

export const createAssetUploadUrlResponseSchema = z.object({
  assetId: idSchema,
  uploadUrl: z.string().url(),
  storagePath: z.string(),
  publicUrl: z.string().url().nullable(),
  expiresAt: isoDateTimeSchema
});
