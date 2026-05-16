import {
  appendMemoryDocument,
  type MemoryDocumentRepository
} from "@/lib/diary/updateMemoryDocument";

export type DiaryEntryType =
  | "created_room"
  | "guessed_room"
  | "mutual_result"
  | "pet_memory"
  | "manual_note";

export type DiaryRepository = MemoryDocumentRepository & {
  createDiaryEntry(args: {
    ownerId: string;
    roomId: string | null;
    guessAttemptId: string | null;
    entryType: DiaryEntryType;
    title: string;
    markdownContent: string;
    visibility?: "private" | "shared_by_request" | "shared";
  }): Promise<{ id: string }>;
};

export type RoomDiaryContext = {
  id: string;
  creatorId: string;
  roomTitle: string;
  publicTitle: string;
  originalSentence: string;
  hiddenMeaning: string;
  emotionType: string;
};

export type GuessDiaryContext = {
  id: string;
  roomId: string;
  playerId: string;
  selectedObjectKeywords: string[];
  selectedChoiceText: string | null;
  freeTextGuess: string | null;
  score: number;
  affinityScore: number;
  comment: string | null;
  partialOriginalSentence: string | null;
};

function lines(items: Array<string | null | undefined>) {
  return items.filter(Boolean).join("\n");
}

export function buildCreatedRoomDiaryMarkdown(room: RoomDiaryContext) {
  return lines([
    `# ${room.roomTitle}`,
    "",
    "今天把一句心事折进了一间小屋。",
    "",
    `> ${room.originalSentence}`,
    "",
    `我真正想藏起来的意思是：${room.hiddenMeaning}`,
    "",
    `公开给别人看的名字是「${room.publicTitle}」，情绪标签是「${room.emotionType}」。`,
    "",
    "希望走进来的人，不一定马上猜中，但能认真看见那些细小的线索。"
  ]);
}

export function buildGuessedRoomDiaryMarkdown(args: {
  room: Pick<RoomDiaryContext, "publicTitle" | "emotionType">;
  guess: GuessDiaryContext;
}) {
  return lines([
    `# 我走进了「${args.room.publicTitle}」`,
    "",
    "我按自己的节奏看完了那些线索。",
    "",
    args.guess.selectedObjectKeywords.length > 0
      ? `我记住的线索关键词：${args.guess.selectedObjectKeywords.join("、")}`
      : "我还没有抓住太多明确的线索。",
    args.guess.selectedChoiceText
      ? `我选择的方向：${args.guess.selectedChoiceText}`
      : null,
    args.guess.freeTextGuess
      ? `我自己的猜测：${args.guess.freeTextGuess}`
      : null,
    "",
    `猜中分数：${args.guess.score}`,
    `默契度：${args.guess.affinityScore}`,
    args.guess.comment ? `小屋给我的回应：${args.guess.comment}` : null,
    args.guess.partialOriginalSentence
      ? `半揭晓的原句片段：${args.guess.partialOriginalSentence}`
      : null,
    "",
    "这篇日记只记录我看到的线索和我的理解，不记录房间主人的完整私密原句。"
  ]);
}

export function buildMutualResultDiaryMarkdown(args: {
  room: RoomDiaryContext;
  guess: GuessDiaryContext;
  playerDisplayName: string;
}) {
  return lines([
    `# ${args.playerDisplayName} 来过这间小屋`,
    "",
    `TA 走进了「${args.room.publicTitle}」，留下了一次猜测。`,
    "",
    `我的原句：${args.room.originalSentence}`,
    `隐藏含义：${args.room.hiddenMeaning}`,
    "",
    args.guess.selectedObjectKeywords.length > 0
      ? `TA 注意到的线索：${args.guess.selectedObjectKeywords.join("、")}`
      : "TA 还没有点到很多线索。",
    args.guess.selectedChoiceText
      ? `TA 选择的方向：${args.guess.selectedChoiceText}`
      : null,
    args.guess.freeTextGuess ? `TA 写下的猜测：${args.guess.freeTextGuess}` : null,
    "",
    `猜中分数：${args.guess.score}`,
    `默契度：${args.guess.affinityScore}`,
    args.guess.comment ? `系统评语：${args.guess.comment}` : null,
    "",
    "这不是一条数据库记录，而是一次被靠近的痕迹。"
  ]);
}

export async function createCreatedRoomDiary(args: {
  repository: DiaryRepository;
  room: RoomDiaryContext;
}) {
  const markdownContent = buildCreatedRoomDiaryMarkdown(args.room);
  const entry = await args.repository.createDiaryEntry({
    ownerId: args.room.creatorId,
    roomId: args.room.id,
    guessAttemptId: null,
    entryType: "created_room",
    title: args.room.roomTitle,
    markdownContent,
    visibility: "private"
  });

  await appendMemoryDocument({
    repository: args.repository,
    scope: {
      ownerId: args.room.creatorId,
      scopeType: "room",
      scopeId: args.room.id
    },
    eventMarkdown: `- 创建了小屋「${args.room.roomTitle}」，情绪是「${args.room.emotionType}」。`
  });

  return entry;
}

export async function createGuessDiaryEntries(args: {
  repository: DiaryRepository;
  room: RoomDiaryContext;
  guess: GuessDiaryContext;
  playerDisplayName: string;
}) {
  const playerMarkdown = buildGuessedRoomDiaryMarkdown({
    room: args.room,
    guess: args.guess
  });
  const ownerMarkdown = buildMutualResultDiaryMarkdown(args);

  const playerEntry = await args.repository.createDiaryEntry({
    ownerId: args.guess.playerId,
    roomId: args.room.id,
    guessAttemptId: args.guess.id,
    entryType: "guessed_room",
    title: `我猜了「${args.room.publicTitle}」`,
    markdownContent: playerMarkdown,
    visibility: "private"
  });

  const ownerEntry = await args.repository.createDiaryEntry({
    ownerId: args.room.creatorId,
    roomId: args.room.id,
    guessAttemptId: args.guess.id,
    entryType: "mutual_result",
    title: `${args.playerDisplayName} 的猜测`,
    markdownContent: ownerMarkdown,
    visibility: "shared_by_request"
  });

  await appendMemoryDocument({
    repository: args.repository,
    scope: {
      ownerId: args.guess.playerId,
      scopeType: "room",
      scopeId: args.room.id
    },
    eventMarkdown: `- 猜测了「${args.room.publicTitle}」，默契度 ${args.guess.affinityScore}。`
  });

  await appendMemoryDocument({
    repository: args.repository,
    scope: {
      ownerId: args.room.creatorId,
      scopeType: "room",
      scopeId: args.room.id
    },
    eventMarkdown: `- ${args.playerDisplayName} 完成了一次猜测，默契度 ${args.guess.affinityScore}。`
  });

  return {
    playerEntry,
    ownerEntry
  };
}

export async function createDiaryEntriesForCompletedGuess(args: {
  repository: DiaryRepository;
  room: RoomDiaryContext;
  guess: GuessDiaryContext;
  playerDisplayName?: string | null;
}) {
  return createGuessDiaryEntries({
    repository: args.repository,
    room: args.room,
    guess: args.guess,
    playerDisplayName: args.playerDisplayName ?? "一位玩家"
  });
}
