import { publicRoomPlaySchema, type PublicRoomPlayData } from "@/lib/contracts";

export const mockRoomPublicData: PublicRoomPlayData = publicRoomPlaySchema.parse({
  roomId: "mock-room",
  roomTitle: "纸板月光小屋",
  publicTitle: "朋友的心事小屋",
  visualTheme: "旧纸、暖灯、纸板小屋、未寄出的信",
  objects: [
    {
      id: "letter-envelope",
      name: "未寄出的信封",
      clue: "它知道地址，却一直没有出发。",
      keyword: "犹豫",
      position: { x: 45, y: 68 },
      assetKey: "envelope"
    },
    {
      id: "slow-clock",
      name: "慢下来的钟",
      clue: "指针总在同一个傍晚停住，好像舍不得往前走。",
      keyword: "反复想起",
      position: { x: 31, y: 38 },
      assetKey: "clock"
    },
    {
      id: "window-plant",
      name: "窗边植物",
      clue: "它一直朝着有光的地方长，却没有把自己搬过去。",
      keyword: "靠近",
      position: { x: 24, y: 60 },
      assetKey: "plant"
    },
    {
      id: "moon-window",
      name: "月亮窗",
      clue: "窗外很亮的时候，它会偷偷看向对面的灯。",
      keyword: "想念",
      position: { x: 71, y: 40 },
      assetKey: "window"
    },
    {
      id: "quiet-note",
      name: "椅背便签",
      clue: "上面只写了两个点，像一句话说到一半又收回去。",
      keyword: "没说出口",
      position: { x: 78, y: 57 },
      assetKey: "chair-note"
    }
  ],
  imageClue: {
    url: "/assets/prototype/generated/cabin-cutout.png",
    caption: "放进信封的照片",
    safeDescription: "照片里是夜晚窗边的一盏灯，像是在等谁看见。"
  },
  pet: {
    type: "cat",
    name: "栗子",
    mood: "知道一点点，但会替秘密守口"
  },
  progress: 0,
  discoveredObjectIds: []
});
