import {
  ownerResultViewSchema,
  publicGuessPageSchema,
  publicGuessResultSchema,
  type GuessSubmission,
  type OwnerResultViewData,
  type PublicGuessPageData,
  type PublicGuessResult
} from "@/lib/contracts";
import { mockRoomPublicData } from "@/lib/mock-room-public";

export const mockGuessPageData: PublicGuessPageData = publicGuessPageSchema.parse({
  roomId: mockRoomPublicData.roomId,
  publicTitle: mockRoomPublicData.publicTitle,
  clues: mockRoomPublicData.objects.map((object) => ({
    id: object.id,
    name: object.name,
    clue: object.clue,
    keyword: object.keyword
  })),
  options: [
    {
      id: "miss-someone",
      label: "TA 想念一个人，却不太敢先开口",
      description: "线索都在绕着靠近、犹豫和没说出口打转。"
    },
    {
      id: "work-pressure",
      label: "TA 最近被工作压得有点喘不过气",
      description: "有疲惫感，但房间里还有一点温柔的等待。"
    },
    {
      id: "quiet-goodbye",
      label: "TA 正在学习和一段关系告别",
      description: "像放下，又像还没有完全放下。"
    }
  ]
});

export const mockGuessResult: PublicGuessResult = publicGuessResultSchema.parse({
  guessId: "guess-mock-86",
  roomId: mockRoomPublicData.roomId,
  title: "你靠近了这句话",
  scorePercent: 86,
  tacitScore: 86,
  tacitThreshold: 80,
  badgeTitle: "半糖侦探",
  comment: "你看懂了想念，也看懂了嘴硬，只差一点点勇气。",
  hitKeywords: ["想念", "不愿先开口", "偷偷关注"],
  missedNote: "害羞和自尊",
  partialOriginalSentence: "我有点想你，□□□□□□",
  shareText: "我把一句心事藏进了一间小屋，你能猜出来吗？",
  canRequestDiary: true,
  savedToDiary: true
});

export const mockOwnerResultViewData: OwnerResultViewData = ownerResultViewSchema.parse({
  guesserName: "朋友 B",
  selectedOptionLabel: "TA 想念一个人，却不太敢先开口",
  discoveredClues: ["未寄出的信封", "慢下来的钟", "窗边植物", "月亮窗", "椅背便签"],
  finalGuess: "我觉得这句话是在说有点想念，但又不好意思主动。",
  scorePercent: 86,
  tacitScore: 86,
  diaryRequested: true,
  diaryRequestMessage: "我想听听这句话背后的那一小段故事。"
});

export async function mockSubmitGuess(submission: GuessSubmission) {
  // Future integration point: POST /api/rooms/:roomId/guesses
  void submission;
  await new Promise((resolve) => window.setTimeout(resolve, 650));
  return {
    guessId: mockGuessResult.guessId
  };
}
