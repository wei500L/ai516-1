# Room JSON Spec

`room_json` is the server-built render contract for the Heart Cabin play page. It combines semantic analysis, room design, generated object assets, and stable 2.5D layout metadata. The frontend should render this shape directly instead of guessing placement from loose fields.

## Internal Room JSON

Internal `room_json` may be stored on `rooms.room_json` and used by server-side scoring, pet chat, and owner views. It may contain answer fields.

```ts
type RoomJson = {
  schemaVersion: 1;
  renderTarget: "2.5d_miniature_cabin";
  roomId: string;
  roomTitle: string;
  publicTitle: string;
  emotionType: string;
  visualTheme: string;
  stage: {
    backgroundStyle: string;
    roomShellType: string;
    lighting: string;
    floorStyle: string;
    backgroundAsset?: StageAsset | null;
    foreground?: StageAsset[];
  };
  objects: Array<{
    id: string;
    name: string;
    clue: string;
    keyword: string;
    position: {
      x: number;
      y: number;
      z?: number;
      layer?: number;
    };
    anchor?: "bottom-center" | "center" | "top-left";
    scale?: number;
    assetUrl?: string;
    shadow?: {
      enabled: boolean;
      width: number;
      height: number;
      opacity: number;
      blur: number;
      offsetY: number;
    };
    render: {
      assetUrl: string;
      width: number;
      height: number;
      style: string;
      interactive: true;
      anchor?: "bottom-center" | "center" | "top-left";
      scale?: number;
      shadow?: {
        enabled: boolean;
        width: number;
        height: number;
        opacity: number;
        blur: number;
        offsetY: number;
      };
    };
    interactionType: "tap" | "tap_note" | "tap_reveal";
  }>;
  imageClue?: {
    assetUrl: string;
    clue: string;
  };
  pet: {
    type: "cat" | "dog";
    name: string;
    position: {
      x: number;
      y: number;
      z?: number;
      layer?: number;
    };
    chatEnabled: true;
    personality?: string;
  };
  choices: Array<{
    id: string;
    text: string;
  }>;
  correctChoiceIndex: number;
  hiddenMeaning: string;
  endingLine: string;
  shareText: string;
  generation?: Record<string, unknown>;
};

type StageAsset = {
  id: string;
  kind: "background" | "table_front" | "door_frame" | "cardboard_edge" | "rug_front" | "paper_floor_lip" | string;
  assetUrl?: string;
  alt?: string;
  position: {
    x: number;
    y: number;
    z?: number;
    layer?: number;
  };
  anchor?: "bottom-center" | "center" | "top-left";
  width: number;
  height: number;
  scale?: number;
  opacity?: number;
  layer?: number;
  style?: string;
};
```

Privacy-sensitive fields:

- `original_sentence` must stay outside `room_json` or remain server-only.
- `hiddenMeaning` is internal answer data.
- `correctChoiceIndex` is internal answer data.
- `generation` can include provider/model metadata and should not be required by clients.

## Public Transform

Play clients must receive data through `buildPublicRoomData` or `buildPlayApiResponse`, not raw `room_json`.

The transform removes:

- `roomTitle`
- `hiddenMeaning`
- `correctChoiceIndex`
- `generation`
- any database `original_sentence`/`originalSentence` fields, because those are never copied into public data

It preserves:

- `stage`
- `stage.backgroundAsset`
- `stage.foreground`
- object `position`
- object `assetUrl`
- object `anchor`
- object `scale`
- object `shadow`
- object `render`
- object `interactionType`
- `imageClue`
- public `choices` labels without correctness
- pet position and chat availability

`buildPlayApiResponse` also keeps backward-compatible fields required by the current API schema: `title`, `description`, `discovered`, `imageUrl`, `pet.avatarUrl`, `pet.mood`, and `progress`.

## Layout Rules

Coordinates are percentages on a fixed 2.5D stage:

- `x`: horizontal position from left to right, `0..100`
- `y`: vertical position from top to bottom, `0..100`
- `z`: pseudo-depth for 2.5D scale/shadow decisions
- `layer`: draw order, larger values render in front
- `anchor`: interactive objects should default to `bottom-center`, so `position.y` means the foot/contact point on the floor
- `scale`: optional render multiplier; clients can still add small depth-based scaling
- `shadow`: soft contact shadow under the anchor point

The default slot order is stable:

1. `tabletop`: desk/table props, letters, notes, books, clocks, keys
2. `window`: moon, rain, plants, light/window props
3. `rug_front`: foreground/floor/chair props
4. `bookshelf`: shelf/book/side props
5. `wall`: stickers, posters, photos, wall clues

`layoutRules.ts` first matches `positionHint`, `preferredAssetType`, `assetKey`, `name`, and `keyword` against slot keywords. If no unused slot matches, it assigns the first unused default slot. Small deterministic offsets prevent stacked objects from sharing exactly the same point.

## Stage Themes

`visualTheme` maps to stable stage style:

- `old_paper_dollhouse`
- `warm_notebook_cabin`
- `rainy_desk_miniature`
- `moonlit_paper_room`
- `pressed_flower_attic`

Unknown themes fall back to `old_paper_dollhouse`.

## Frontend Rendering Notes

The play page should:

- Treat `objects[].render.assetUrl` as the generated clue object image.
- Treat `objects[].assetUrl` as a convenient top-level alias for the generated clue object image when present.
- Use `render.width`, `render.height`, `anchor`, `scale`, `shadow`, and `position.layer` for deterministic paper miniature placement.
- Draw interactive clue objects with bottom-center anchors and a soft contact shadow so they appear grounded.
- Y-sort the object layer from smaller `position.y` to larger `position.y`; larger `y` renders visually in front.
- Draw `stage.foreground` after the object layer for table fronts, door frames, cardboard edges, rug lips, and other occluders.
- Use `stage` for the room shell, floor, background, and lighting styling.
- Use `interactionType` to decide tap behavior.
- Never infer correctness from choice order beyond sending `selectedChoiceIndex` back to the server.
