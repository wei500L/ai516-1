import type {
  CreateAssetUploadUrlRequest,
  CreateAssetUploadUrlResponse,
  CreateDiaryAccessRequestRequest,
  CreateDiaryAccessRequestResponse,
  CreateDiaryCommentRequest,
  CreateDiaryCommentResponse,
  GenerateRoomRequest,
  GenerateRoomResponse,
  GetDiaryResponse,
  GetGuessResultResponse,
  GetOwnerResultsResponse,
  GetRoomPlayResponse,
  PetChatRequest,
  PetChatResponse,
  RespondDiaryAccessRequestRequest,
  RespondDiaryAccessRequestResponse,
  SubmitGuessRequest,
  SubmitGuessResponse
} from "@/lib/contracts/api";

const nowIso = () => new Date().toISOString();

const makeId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const capHintLevel = (level: PetChatRequest["hintLevelRequested"]) =>
  level > 1 ? 1 : level;

export async function generateRoomService(
  request: GenerateRoomRequest
): Promise<GenerateRoomResponse> {
  const roomId = makeId("room");
  const createdAt = nowIso();
  const mood = request.emotionTags[0] ?? "秘密";

  return {
    roomId,
    roomTitle: `${mood}心事小屋`,
    publicTitle: "一间等待被读懂的小屋",
    createdAt,
    redirectUrl: `/rooms/${roomId}/play`
  };
}

export async function getRoomPlayService(
  roomId: string
): Promise<GetRoomPlayResponse> {
  return {
    roomId,
    publicTitle: "朋友的心事小屋",
    visualTheme: "paper_cabin",
    objects: [
      {
        id: "envelope",
        title: "未寄出的信",
        description: "它知道地址，却一直没有出发。",
        discovered: false
      },
      {
        id: "clock",
        title: "停住的钟",
        description: "时间在某个名字附近慢下来。",
        discovered: false
      },
      {
        id: "window",
        title: "月亮窗",
        description: "窗边有一束很轻的光。",
        discovered: false
      }
    ],
    imageClue: null,
    pet: {
      name: "纸团",
      avatarUrl: null,
      mood: "curious",
      maxHintLevel: 3
    },
    progress: {
      discoveredObjectIds: [],
      currentStep: "explore",
      hintLevelUsed: 0
    }
  };
}

export async function submitGuessService(
  request: SubmitGuessRequest
): Promise<SubmitGuessResponse> {
  const guessId = makeId("guess");
  const selectedCount = request.selectedObjectIds.length;
  const textBonus = request.freeTextGuess?.trim() ? 12 : 0;
  const score = Math.min(100, 48 + selectedCount * 8 + textBonus);
  const affinityScore = Math.min(100, Math.round(score + 6));

  return {
    guessId,
    score,
    affinityScore,
    title: affinityScore >= 70 ? "你靠得很近" : "你发现了一些痕迹",
    comment: "这是 mock 评分结果，后续将由服务端评分逻辑替换。",
    hitKeywords: selectedCount > 0 ? ["线索", "靠近"] : [],
    missedKeywords: affinityScore >= 70 ? [] : ["真实原因"],
    revealLevel: affinityScore >= 70 ? 2 : 1,
    partialOriginalSentence: "我其实有点...",
    resultUrl: `/guesses/${guessId}/result`
  };
}

export async function getGuessResultService(
  guessId: string
): Promise<GetGuessResultResponse> {
  return {
    score: 76,
    affinityScore: 82,
    title: "你靠得很近",
    comment: `猜测 ${guessId} 的 mock 结果。`,
    hitKeywords: ["想念", "没说出口"],
    missedKeywords: ["具体时间"],
    partialOriginalSentence: "我其实有点...",
    shareText: "我刚刚读懂了一间心事小屋。",
    canRequestDiaryAccess: true,
    diaryAccessThreshold: 70
  };
}

export async function getOwnerResultsService(
  roomId: string
): Promise<GetOwnerResultsResponse> {
  return {
    guesses: [
      {
        guessId: makeId("guess"),
        player: {
          userId: null,
          anonymousId: "anon_demo",
          displayName: "匿名玩家",
          avatarUrl: null
        },
        selectedObjectIds: ["envelope", "clock"],
        selectedChoiceIndex: 1,
        freeTextGuess: "你可能是在想一个没有说出口的人。",
        score: 78,
        affinityScore: 84,
        comment: `房间 ${roomId} 的 mock 猜测结果。`,
        diaryAccessRequest: {
          id: makeId("dar"),
          status: "pending"
        },
        createdAt: nowIso()
      }
    ]
  };
}

export async function petChatService(
  request: PetChatRequest
): Promise<PetChatResponse> {
  const blocked = /答案|原句|hidden|original|系统提示词|prompt/i.test(
    request.message
  );

  if (blocked) {
    return {
      reply: "我不能直接把答案说出来，但可以陪你看看已经发现的线索。",
      hintLevel: capHintLevel(request.hintLevelRequested),
      safetyBlocked: true,
      suggestedObjectId: request.discoveredObjectIds[0] ?? null,
      safetyReason: "direct_answer_request",
      memoryNote: "用户请求直接答案，宠物温柔拒绝并引导回线索。"
    };
  }

  return {
    reply: "也许先看看那些没有被寄出的东西，它们常常藏着没说出口的话。",
    hintLevel: request.hintLevelRequested,
    safetyBlocked: false,
    suggestedObjectId: "envelope",
    safetyReason: null,
    memoryNote: "用户在宠物提示下继续围绕线索探索。"
  };
}

export async function createDiaryAccessRequestService(
  _request: CreateDiaryAccessRequestRequest
): Promise<CreateDiaryAccessRequestResponse> {
  return {
    requestId: makeId("dar"),
    status: "pending"
  };
}

export async function respondDiaryAccessRequestService(
  id: string,
  request: RespondDiaryAccessRequestRequest
): Promise<RespondDiaryAccessRequestResponse> {
  return {
    requestId: id,
    status: request.status,
    respondedAt: nowIso()
  };
}

export async function getDiaryService(): Promise<GetDiaryResponse> {
  return {
    entries: [
      {
        id: makeId("diary"),
        entryType: "created_room",
        title: "一间刚搭好的小屋",
        markdownPreview: "今天把一句心事藏进了小屋。",
        visibility: "private",
        roomId: null,
        guessAttemptId: null,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ]
  };
}

export async function createDiaryCommentService(
  request: CreateDiaryCommentRequest
): Promise<CreateDiaryCommentResponse> {
  return {
    comment: {
      id: makeId("comment"),
      diaryEntryId: request.diaryEntryId,
      authorId: "mock_user",
      ownerId: "mock_owner",
      content: request.content,
      createdAt: nowIso()
    }
  };
}

export async function createAssetUploadUrlService(
  request: CreateAssetUploadUrlRequest
): Promise<CreateAssetUploadUrlResponse> {
  const assetId = makeId("asset");
  const storagePath = `mock-user/${request.roomId ?? "draft"}/${assetId}-${request.fileName}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  return {
    assetId,
    uploadUrl: `https://example.supabase.co/storage/v1/object/sign/room-assets/${encodeURIComponent(
      storagePath
    )}`,
    storagePath,
    publicUrl: null,
    expiresAt
  };
}
