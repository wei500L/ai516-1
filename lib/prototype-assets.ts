export const CLASSIFIED_ASSET_BASE = "/assets/prototype/classified/transparent";
export const GENERATED_ASSET_BASE = "/assets/prototype/generated";

export function classifiedAsset(path: string) {
  return `${CLASSIFIED_ASSET_BASE}/${path}`;
}

export function generatedAsset(path: string) {
  return `${GENERATED_ASSET_BASE}/${path}`;
}

export const paperSurfaces = {
  cream: classifiedAsset("ui/notes/note_wide_leaf.png"),
  parchment: classifiedAsset("ui/notes/note_medium.png"),
  sage: classifiedAsset("ui/tags/tag_sage.png"),
  rose: classifiedAsset("ui/tags/tag_red.png"),
  blue: classifiedAsset("ui/tags/tag_blue_gray.png"),
  clue: classifiedAsset("ui/clue_note/clue_note_open.png"),
  clueClosed: classifiedAsset("ui/clue_note/clue_note_closed.png"),
  clueViewed: classifiedAsset("ui/clue_note/clue_note_viewed.png"),
  clueLarge: classifiedAsset("ui/clue_note/clue_note_large_example.png"),
  popup: classifiedAsset("ui/notes/note_popup.png"),
  narrow: classifiedAsset("ui/notes/note_narrow_leaf.png"),
  narrowPlain: classifiedAsset("ui/notes/note_narrow_plain.png"),
  quoteSoft: classifiedAsset("ui/notes/note_quote_soft.png"),
  small: classifiedAsset("ui/notes/note_small.png"),
  tapedFlower: classifiedAsset("ui/notes/note_taped_flower.png"),
  verticalPlain: classifiedAsset("ui/notes/note_vertical_plain.png"),
  viewed: classifiedAsset("ui/notes/note_viewed.png"),
  widePaperclip: classifiedAsset("ui/notes/note_wide_paperclip.png"),
  messageEmpty: classifiedAsset("ui/message_note/message_note_empty.png"),
  messageSent: classifiedAsset("ui/message_note/message_note_sent.png"),
  messageWritten: classifiedAsset("ui/message_note/message_note_written.png")
} as const;

export const buttons = {
  primary: classifiedAsset("decor/paper_strip/paper_strip_sage_long.png"),
  secondary: classifiedAsset("decor/paper_strip/paper_strip_beige_long.png"),
  pressed: classifiedAsset("ui/buttons/paper_button_pressed.png"),
  guessed: classifiedAsset("ui/buttons/paper_button_guessed.png"),
  sendGuess: classifiedAsset("ui/buttons/paper_button_send_guess.png"),
  saveAgain: classifiedAsset("ui/buttons/paper_button_save_again.png"),
  hideSecret: classifiedAsset("ui/buttons/button_hide_secret.png"),
  selected: classifiedAsset("ui/buttons/button_selected.png"),
  viewOthers: classifiedAsset("ui/buttons/button_view_others.png"),
  primaryWithText: classifiedAsset("ui/buttons/paper_button_primary.png"),
  secondaryWithText: classifiedAsset("ui/buttons/paper_button_secondary.png")
} as const;

export const decor = {
  tape: classifiedAsset("decor/tape/tape_01.png"),
  tapeAlt: classifiedAsset("decor/tape/tape_02.png"),
  tapeThird: classifiedAsset("decor/tape/tape_03.png"),
  tapeFourth: classifiedAsset("decor/tape/tape_04.png"),
  tapeStrip: classifiedAsset("decor/paper_strip/paper_strip_beige_long.png"),
  tapeStripKraft: classifiedAsset("decor/paper_strip/paper_strip_kraft_long.png"),
  tapeStripOrange: classifiedAsset("decor/paper_strip/paper_strip_orange_long.png"),
  tapeStripSage: classifiedAsset("decor/paper_strip/paper_strip_sage_long.png"),
  polaroidEmpty: classifiedAsset("decor/polaroid/polaroid_frame_empty.png"),
  polaroidTaped: classifiedAsset("decor/polaroid/polaroid_frame_taped.png"),
  stampLeaf: classifiedAsset("decor/stamp/stamp_leaf.png"),
  stampFlower: classifiedAsset("decor/stamp/stamp_flower.png"),
  stampHeart: classifiedAsset("decor/stamp/stamp_heart.png"),
  postmarkSecret: classifiedAsset("decor/postmark/postmark_secret.png"),
  postmarkSent: classifiedAsset("decor/postmark/postmark_sent.png"),
  paperclip: classifiedAsset("decor/paperclip/paperclip_medium.png"),
  paperclipAngle: classifiedAsset("decor/paperclip/paperclip_angle.png"),
  paperclipSmall: classifiedAsset("decor/paperclip/paperclip_small.png"),
  waxSealBlank: classifiedAsset("decor/wax_seal/wax_seal_blank.png"),
  waxSealCreamBlank: classifiedAsset("decor/wax_seal/wax_seal_cream_blank.png"),
  waxSealKraftBlank: classifiedAsset("decor/wax_seal/wax_seal_kraft_blank.png"),
  waxSealOrangeBlank: classifiedAsset("decor/wax_seal/wax_seal_orange_blank.png"),
  waxSealSageBlank: classifiedAsset("decor/wax_seal/wax_seal_sage_blank.png"),
  waxSealRed: classifiedAsset("decor/wax_seal/wax_seal_red.png"),
  waxSealLeaf: classifiedAsset("decor/wax_seal/wax_seal_leaf.png"),
  heart: classifiedAsset("decor/doodle/doodle_heart_01.png"),
  heartAlt: classifiedAsset("decor/doodle/doodle_heart_02.png"),
  heartGlow: classifiedAsset("decor/doodle/doodle_heart_glow.png"),
  leaf: classifiedAsset("decor/doodle/doodle_leaf_01.png"),
  leafAlt: classifiedAsset("decor/doodle/doodle_leaf_02.png")
} as const;

export const objects = {
  envelopeClosed: classifiedAsset("objects/envelope/envelope_closed.png"),
  envelopeOpen: classifiedAsset("objects/envelope/envelope_open.png"),
  envelopeSealed: classifiedAsset("objects/envelope/envelope_sealed.png"),
  envelopeLetter: classifiedAsset("objects/envelope/envelope_with_letter.png"),
  envelopePhoto: classifiedAsset("objects/envelope/envelope_with_photo.png"),
  uploadEnvelopeEmpty: classifiedAsset("objects/upload_envelope/upload_envelope_empty.png"),
  uploadEnvelopePlus: classifiedAsset("objects/upload_envelope/upload_envelope_plus.png"),
  uploadEnvelopeUploaded: classifiedAsset("objects/upload_envelope/upload_envelope_uploaded.png"),
  albumClosed: classifiedAsset("objects/album/album_closed.png"),
  albumGrid: classifiedAsset("objects/album/album_grid.png"),
  albumOpen: classifiedAsset("objects/album/album_open.png"),
  albumPhotoView: classifiedAsset("objects/album/album_photo_view.png"),
  keyDefault: classifiedAsset("objects/key/key_default.png"),
  keyActive: classifiedAsset("objects/key/key_active.png"),
  keyViewed: classifiedAsset("objects/key/key_viewed.png"),
  clockDefault: classifiedAsset("objects/clock/clock_default.png"),
  clockActive: classifiedAsset("objects/clock/clock_active.png"),
  clockViewed: classifiedAsset("objects/clock/clock_viewed.png"),
  plantDefault: classifiedAsset("objects/plant/plant_default.png"),
  plantViewed: classifiedAsset("objects/plant/plant_viewed.png"),
  cupDefault: classifiedAsset("objects/cup/cup_default.png"),
  cupWarm: classifiedAsset("objects/cup/cup_warm.png"),
  cupViewed: classifiedAsset("objects/cup/cup_viewed.png"),
  bookClosed: classifiedAsset("objects/book/book_closed.png"),
  bookOpen: classifiedAsset("objects/book/book_open.png"),
  bookViewed: classifiedAsset("objects/book/book_viewed.png"),
  starDefault: classifiedAsset("objects/star/star_default.png"),
  starActive: classifiedAsset("objects/star/star_active.png"),
  starViewed: classifiedAsset("objects/star/star_viewed.png"),
  chatNoteActive: classifiedAsset("objects/chat_note/chat_note_active.png"),
  chatNoteDark: classifiedAsset("objects/chat_note/chat_note_dark.png"),
  chatNoteViewed: classifiedAsset("objects/chat_note/chat_note_viewed.png"),
  diary80PercentCard: classifiedAsset("objects/diary/diary_80_percent_card.png"),
  diary80PercentNote: classifiedAsset("objects/diary/diary_80_percent_note.png"),
  diaryConditionNearUnlock: classifiedAsset("objects/diary/diary_condition_near_unlock.png"),
  diaryConditionUnmet: classifiedAsset("objects/diary/diary_condition_unmet.png"),
  diaryLockUnmetCard: classifiedAsset("objects/diary/diary_lock_unmet_card.png"),
  diaryLocked: classifiedAsset("objects/diary/diary_locked.png"),
  diaryNearUnlockCard: classifiedAsset("objects/diary/diary_near_unlock_card.png"),
  diaryOpen: classifiedAsset("objects/diary/diary_open.png"),
  diaryRequestable: classifiedAsset("objects/diary/diary_requestable.png"),
  diaryUnlocked: classifiedAsset("objects/diary/diary_unlocked.png"),
  diaryUnlockedCard: classifiedAsset("objects/diary/diary_unlocked_card.png"),
  diaryUnlockedNote: classifiedAsset("objects/diary/diary_unlocked_note.png"),
  guessCardEmpty: classifiedAsset("objects/guess/guess_card_empty.png"),
  guessCardSelected: classifiedAsset("objects/guess/guess_card_selected.png"),
  guessCardSubmitted: classifiedAsset("objects/guess/guess_card_submitted.png"),
  guessCardSuccess: classifiedAsset("objects/guess/guess_card_success.png"),
  guessCardWaiting: classifiedAsset("objects/guess/guess_card_waiting.png"),
  guessResultForgot: classifiedAsset("objects/guess/guess_result_forgot.png"),
  guessResultLove: classifiedAsset("objects/guess/guess_result_love.png"),
  guessResultPressure: classifiedAsset("objects/guess/guess_result_pressure.png"),
  guessSubmittedSmall: classifiedAsset("objects/guess/guess_submitted_small.png"),
  guessWaitingSmall: classifiedAsset("objects/guess/guess_waiting_small.png")
} as const;

export const tags = {
  labelSage: classifiedAsset("ui/tags/label_sage_small.png"),
  labelBeige: classifiedAsset("ui/tags/label_beige_small.png"),
  labelKraft: classifiedAsset("ui/tags/label_kraft_small.png"),
  labelOrange: classifiedAsset("ui/tags/label_orange_small.png"),
  tagSage: classifiedAsset("ui/tags/tag_sage.png"),
  tagOrange: classifiedAsset("ui/tags/tag_orange.png"),
  tagRed: classifiedAsset("ui/tags/tag_red.png"),
  tagBlueGray: classifiedAsset("ui/tags/tag_blue_gray.png"),
  tagSelected: classifiedAsset("ui/tags/tag_selected.png"),
  ticketBeige: classifiedAsset("ui/tags/ticket_tag_beige.png"),
  ticketSage: classifiedAsset("ui/tags/ticket_tag_sage.png"),
  ticketOrange: classifiedAsset("ui/tags/ticket_tag_orange.png"),
  ticketKraft: classifiedAsset("ui/tags/ticket_tag_kraft.png"),
  clipBeige: classifiedAsset("ui/tags/clip_tag_beige.png"),
  clipKraft: classifiedAsset("ui/tags/clip_tag_kraft.png"),
  clipOrange: classifiedAsset("ui/tags/clip_tag_orange.png"),
  clipSage: classifiedAsset("ui/tags/clip_tag_sage.png"),
  lockBeige: classifiedAsset("ui/tags/lock_tag_beige.png"),
  lockKraft: classifiedAsset("ui/tags/lock_tag_kraft.png"),
  lockOrange: classifiedAsset("ui/tags/lock_tag_orange.png"),
  lockSage: classifiedAsset("ui/tags/lock_tag_sage.png"),
  tagHoleBeige: classifiedAsset("ui/tags/tag_hole_beige.png"),
  tagHoleOrange: classifiedAsset("ui/tags/tag_hole_orange.png"),
  tagHoleSage: classifiedAsset("ui/tags/tag_hole_sage.png"),
  tapedNoteBlank: classifiedAsset("ui/tags/taped_note_blank.png"),
  statusBlank: classifiedAsset("ui/tags/status_blank.png"),
  statusBlankSmall: classifiedAsset("ui/tags/status_blank_small.png"),
  statusLineExample: classifiedAsset("ui/tags/status_line_example.png"),
  statusSelected: classifiedAsset("ui/tags/status_selected.png"),
  statusSent: classifiedAsset("ui/tags/status_sent.png"),
  statusSubmitted: classifiedAsset("ui/tags/status_submitted.png"),
  statusWaiting: classifiedAsset("ui/tags/status_waiting.png"),
  statusSuccess: classifiedAsset("ui/tags/status_success.png"),
  statusWritten: classifiedAsset("ui/tags/status_written.png")
} as const;

export function numberToken(number: number, state: "active" | "default" | "disabled") {
  return classifiedAsset(`ui/tags/number_token_${number}_${state}.png`);
}

export function clueObjectAsset(assetKey: string, state: "active" | "default" | "viewed") {
  switch (assetKey) {
    case "envelope":
      return state === "viewed" ? objects.envelopeOpen : state === "active" ? objects.envelopePhoto : objects.envelopeClosed;
    case "clock":
      return state === "viewed" ? objects.clockViewed : state === "active" ? objects.clockActive : objects.clockDefault;
    case "plant":
      return state === "viewed" ? objects.plantViewed : objects.plantDefault;
    case "window":
      return state === "viewed" ? objects.starViewed : state === "active" ? objects.starActive : objects.starDefault;
    case "chair-note":
      return state === "viewed" ? objects.chatNoteViewed : objects.chatNoteActive;
    case "key":
      return state === "viewed" ? objects.keyViewed : state === "active" ? objects.keyActive : objects.keyDefault;
    case "cup":
      return state === "viewed" ? objects.cupViewed : state === "active" ? objects.cupWarm : objects.cupDefault;
    case "book":
      return state === "viewed" ? objects.bookViewed : objects.bookClosed;
    default:
      return objects.starDefault;
  }
}

export function affinityCardAsset(score: number, size: "regular" | "large" = "regular") {
  const regularCandidates = [5, 18, 27, 35, 49, 57, 64, 71, 80, 86, 94, 100];
  const largeCandidates = [0, 12, 26, 43, 58, 72, 80, 86, 93, 100];
  const candidates = size === "large" ? largeCandidates : regularCandidates;
  const closest = candidates.reduce((best, item) =>
    Math.abs(item - score) < Math.abs(best - score) ? item : best
  );
  const padded = closest === 0 || closest === 5 ? String(closest).padStart(2, "0") : String(closest);
  return classifiedAsset(`ui/progress/affinity_card_${size === "large" ? "large_" : ""}${padded}.png`);
}

export const progressAssets = {
  badge80Plus: classifiedAsset("ui/progress/affinity_badge_80_plus.png"),
  badgeTacitMatch: classifiedAsset("ui/progress/affinity_badge_tacit_match.png"),
  badgeUnlocked: classifiedAsset("ui/progress/affinity_badge_unlocked.png"),
  cardHigh: classifiedAsset("ui/progress/affinity_card_high.png"),
  cardLow: classifiedAsset("ui/progress/affinity_card_low.png"),
  cardPass: classifiedAsset("ui/progress/affinity_card_pass.png"),
  stamp80Plus: classifiedAsset("ui/progress/affinity_stamp_80_plus.png"),
  tagKeepClose: classifiedAsset("ui/progress/affinity_tag_keep_close.png"),
  tagTacitMatch: classifiedAsset("ui/progress/affinity_tag_tacit_match.png"),
  tagUnlocked: classifiedAsset("ui/progress/affinity_tag_unlocked.png")
} as const;

export const generated = {
  notebookBg: generatedAsset("notebook-page-bg.png"),
  cabin: generatedAsset("cabin-cutout.png"),
  room: generatedAsset("room-cutaway-clean.png")
} as const;
