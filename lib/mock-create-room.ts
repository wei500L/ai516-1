import type { CreateRoomDraft } from "@/lib/contracts";

export type MockCreatedRoom = {
  roomId: string;
  createdAt: string;
};

export async function mockCreateRoom(draft: CreateRoomDraft): Promise<MockCreatedRoom> {
  // Future integration point:
  // return fetch("/api/rooms/generate", { method: "POST", body: JSON.stringify(draft) }).then(...)
  void draft;
  await new Promise((resolve) => window.setTimeout(resolve, 4200));

  return {
    roomId: "mock-room",
    createdAt: new Date().toISOString()
  };
}
