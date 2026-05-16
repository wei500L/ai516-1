export const DEFAULT_DIARY_ACCESS_THRESHOLD = 80;

export type DiaryAccessGuess = {
  id: string;
  roomId: string;
  playerId: string | null;
  affinityScore: number | null;
};

export type DiaryAccessDecision = {
  allowed: boolean;
  threshold: number;
  reason:
    | "allowed"
    | "login_required"
    | "not_guess_owner"
    | "wrong_room"
    | "score_missing"
    | "score_too_low";
};

export function canRequestDiaryAccess(args: {
  requesterId: string | null;
  roomId: string;
  guess: DiaryAccessGuess;
  threshold?: number;
}): DiaryAccessDecision {
  const threshold = args.threshold ?? DEFAULT_DIARY_ACCESS_THRESHOLD;

  if (!args.requesterId) {
    return { allowed: false, threshold, reason: "login_required" };
  }

  if (args.guess.roomId !== args.roomId) {
    return { allowed: false, threshold, reason: "wrong_room" };
  }

  if (args.guess.playerId !== args.requesterId) {
    return { allowed: false, threshold, reason: "not_guess_owner" };
  }

  if (args.guess.affinityScore === null) {
    return { allowed: false, threshold, reason: "score_missing" };
  }

  if (args.guess.affinityScore < threshold) {
    return { allowed: false, threshold, reason: "score_too_low" };
  }

  return { allowed: true, threshold, reason: "allowed" };
}
