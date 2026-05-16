export type RoomVisualTheme =
  | "old_paper_dollhouse"
  | "warm_notebook_cabin"
  | "rainy_desk_miniature"
  | "moonlit_paper_room"
  | "pressed_flower_attic"
  | string;

export type RoomStage = {
  backgroundStyle: string;
  roomShellType: string;
  lighting: string;
  floorStyle: string;
};

export type RoomObjectPosition = {
  x: number;
  y: number;
  z?: number;
  layer?: number;
};

export type RoomObjectRender = {
  assetUrl: string;
  width: number;
  height: number;
  style: string;
  interactive: true;
};

export type LayoutSlotKey =
  | "tabletop"
  | "window"
  | "rug_front"
  | "bookshelf"
  | "wall";

export type LayoutSlot = {
  key: LayoutSlotKey;
  label: string;
  position: RoomObjectPosition;
  render: Pick<RoomObjectRender, "width" | "height" | "style">;
  matchers: string[];
};

export const STAGE_BY_THEME: Record<string, RoomStage> = {
  old_paper_dollhouse: {
    backgroundStyle: "aged-paper-backdrop-with-taped-corners",
    roomShellType: "open-front-cardboard-dollhouse",
    lighting: "soft-warm-desk-lamp",
    floorStyle: "folded-kraft-paper-floor"
  },
  warm_notebook_cabin: {
    backgroundStyle: "warm-notebook-paper-with-pencil-shadow",
    roomShellType: "open-front-paper-cabin",
    lighting: "honey-colored-window-glow",
    floorStyle: "lined-notebook-woodgrain-floor"
  },
  rainy_desk_miniature: {
    backgroundStyle: "rainy-window-paper-diorama",
    roomShellType: "desk-corner-cardboard-room",
    lighting: "cool-rainy-light-with-small-warm-lamp",
    floorStyle: "muted-blue-gray-paper-floor"
  },
  moonlit_paper_room: {
    backgroundStyle: "moonlit-washi-paper-backdrop",
    roomShellType: "open-front-night-paper-room",
    lighting: "soft-moonlight-plus-tiny-warm-lantern",
    floorStyle: "deep-indigo-paper-floor-with-cutout-shadows"
  },
  pressed_flower_attic: {
    backgroundStyle: "pressed-flower-scrapbook-wall",
    roomShellType: "sloped-roof-paper-attic",
    lighting: "late-afternoon-amber-attic-light",
    floorStyle: "pale-wood-paper-floor-with-flower-flecks"
  }
};

export const DEFAULT_STAGE: RoomStage = STAGE_BY_THEME.old_paper_dollhouse;

export const LAYOUT_SLOTS: LayoutSlot[] = [
  {
    key: "tabletop",
    label: "桌上",
    position: { x: 42, y: 62, z: 18, layer: 30 },
    render: {
      width: 128,
      height: 128,
      style: "paper-cutout-tabletop-prop-drop-shadow"
    },
    matchers: [
      "桌",
      "信",
      "纸",
      "note",
      "letter",
      "envelope",
      "book",
      "clock",
      "key"
    ]
  },
  {
    key: "window",
    label: "窗边",
    position: { x: 72, y: 37, z: 28, layer: 24 },
    render: {
      width: 118,
      height: 132,
      style: "paper-cutout-window-side-prop-soft-backlight"
    },
    matchers: ["窗", "月", "雨", "光", "window", "moon", "rain", "plant"]
  },
  {
    key: "rug_front",
    label: "地毯前",
    position: { x: 50, y: 82, z: 8, layer: 42 },
    render: {
      width: 148,
      height: 126,
      style: "foreground-paper-cutout-prop-long-shadow"
    },
    matchers: ["地", "毯", "前", "椅", "chair", "rug", "floor", "toy"]
  },
  {
    key: "bookshelf",
    label: "书架旁",
    position: { x: 22, y: 48, z: 24, layer: 22 },
    render: {
      width: 116,
      height: 146,
      style: "paper-cutout-shelf-side-prop-ambient-shadow"
    },
    matchers: ["书", "架", "旁", "book", "shelf", "plant", "clock"]
  },
  {
    key: "wall",
    label: "墙面",
    position: { x: 52, y: 28, z: 36, layer: 12 },
    render: {
      width: 138,
      height: 106,
      style: "flat-wall-paper-sticker-with-tape-shadow"
    },
    matchers: ["墙", "贴", "画", "照片", "星", "wall", "photo", "poster", "moon"]
  }
];

const THEME_RENDER_SUFFIX: Record<string, string> = {
  old_paper_dollhouse: "aged-paper-low-saturation",
  warm_notebook_cabin: "warm-notebook-handmade-texture",
  rainy_desk_miniature: "rain-muted-paper-texture",
  moonlit_paper_room: "moonlit-paper-blue-shadow",
  pressed_flower_attic: "pressed-flower-washi-texture"
};

export type LayoutObjectInput = {
  id: string;
  name?: string;
  keyword?: string;
  positionHint?: string;
  preferredAssetType?: string;
  assetKey?: string;
};

function normalizeSearchText(input: LayoutObjectInput) {
  return [
    input.name,
    input.keyword,
    input.positionHint,
    input.preferredAssetType,
    input.assetKey
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function pickSlot(
  object: LayoutObjectInput,
  index: number,
  usedSlotKeys: Set<LayoutSlotKey>
) {
  const text = normalizeSearchText(object);
  const matched = LAYOUT_SLOTS.find(
    (slot) =>
      !usedSlotKeys.has(slot.key) &&
      slot.matchers.some((matcher) => text.includes(matcher.toLowerCase()))
  );

  if (matched) {
    return matched;
  }

  return LAYOUT_SLOTS.find((slot) => !usedSlotKeys.has(slot.key)) ??
    LAYOUT_SLOTS[index % LAYOUT_SLOTS.length];
}

function offsetPosition(
  position: RoomObjectPosition,
  index: number
): RoomObjectPosition {
  const offsetPattern = [
    { x: 0, y: 0 },
    { x: -4, y: 3 },
    { x: 4, y: 2 },
    { x: -3, y: -2 },
    { x: 3, y: -3 }
  ];
  const offset = offsetPattern[index % offsetPattern.length];

  return {
    x: Math.max(8, Math.min(92, position.x + offset.x)),
    y: Math.max(12, Math.min(90, position.y + offset.y)),
    z: position.z,
    layer: typeof position.layer === "number" ? position.layer + index : index
  };
}

export function getStageForTheme(theme: RoomVisualTheme): RoomStage {
  return STAGE_BY_THEME[theme] ?? DEFAULT_STAGE;
}

export function getLayoutForObject(
  object: LayoutObjectInput,
  index: number,
  visualTheme: RoomVisualTheme,
  usedSlotKeys: Set<LayoutSlotKey>
) {
  const slot = pickSlot(object, index, usedSlotKeys);
  usedSlotKeys.add(slot.key);
  const themeSuffix =
    THEME_RENDER_SUFFIX[visualTheme] ?? THEME_RENDER_SUFFIX.old_paper_dollhouse;

  return {
    slotKey: slot.key,
    slotLabel: slot.label,
    position: offsetPosition(slot.position, index),
    render: {
      ...slot.render,
      style: `${slot.render.style} ${themeSuffix}`
    }
  };
}
