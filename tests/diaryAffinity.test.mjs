import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canRequestDiaryAccess } from "../lib/affinity/canRequestDiaryAccess.ts";

const low = canRequestDiaryAccess({
  requesterId: "player-a",
  roomId: "room-a",
  guess: {
    id: "guess-a",
    roomId: "room-a",
    playerId: "player-a",
    affinityScore: 79
  }
});

assert.equal(low.allowed, false);
assert.equal(low.reason, "score_too_low");
assert.equal(low.threshold, 80);

const allowed = canRequestDiaryAccess({
  requesterId: "player-a",
  roomId: "room-a",
  guess: {
    id: "guess-a",
    roomId: "room-a",
    playerId: "player-a",
    affinityScore: 80
  }
});

assert.equal(allowed.allowed, true);

const diarySource = readFileSync(
  new URL("../lib/diary/createDiaryEntry.ts", import.meta.url),
  "utf8"
);

assert.match(diarySource, /buildGuessedRoomDiaryMarkdown/);
assert.match(diarySource, /partialOriginalSentence/);
assert.match(diarySource, /不记录房间主人的完整私密原句/);

console.log("diary affinity tests passed");
