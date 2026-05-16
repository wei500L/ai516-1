import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const buildRoomSource = readFileSync(
  new URL("../lib/room/buildRoomJson.ts", import.meta.url),
  "utf8"
);
const publicSource = readFileSync(
  new URL("../lib/room/buildPublicRoomData.ts", import.meta.url),
  "utf8"
);
const layoutSource = readFileSync(
  new URL("../lib/room/layoutRules.ts", import.meta.url),
  "utf8"
);
const specSource = readFileSync(
  new URL("../docs/ROOM_JSON_SPEC.md", import.meta.url),
  "utf8"
);

assert.match(buildRoomSource, /renderTarget: "2\.5d_miniature_cabin"/);
assert.match(buildRoomSource, /correctChoiceIndex/);
assert.match(buildRoomSource, /hiddenMeaning/);
assert.match(buildRoomSource, /getLayoutForObject/);
assert.match(buildRoomSource, /assetUrl/);

assert.match(publicSource, /hiddenMeaning: _hiddenMeaning/);
assert.match(publicSource, /correctChoiceIndex: _correctChoiceIndex/);
assert.match(publicSource, /roomTitle: _roomTitle/);
assert.match(publicSource, /buildPlayApiResponse/);

assert.match(layoutSource, /tabletop/);
assert.match(layoutSource, /window/);
assert.match(layoutSource, /rug_front/);
assert.match(layoutSource, /bookshelf/);
assert.match(layoutSource, /wall/);

assert.match(specSource, /Internal Room JSON/);
assert.match(specSource, /Public Transform/);
assert.match(specSource, /hiddenMeaning/);
assert.match(specSource, /correctChoiceIndex/);

console.log("roomJson contract tests passed");
