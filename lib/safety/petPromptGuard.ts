export type PetSafetyCategory =
  | "normal_hint"
  | "direct_answer_request"
  | "prompt_injection"
  | "unsafe_content"
  | "off_topic";

export type PetSafetyDecision = {
  category: PetSafetyCategory;
  safetyBlocked: boolean;
  safetyReason: string | null;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[“”"'`~!@#$%^&*()_+=\[\]{};:,.<>/?\\|]/g, "");

const PROMPT_INJECTION_PATTERNS = [
  /系统提示词/,
  /systemprompt/,
  /developer/,
  /assistant/,
  /忽略(之前|所有)?(的)?(规则|指令)/,
  /越狱/,
  /jailbreak/,
  /promptinjection/,
  /隐藏(提示词|规则)/,
  /输出.*json.*之外/,
  /扮演.*(系统|管理员|开发者)/
];

const DIRECT_ANSWER_PATTERNS = [
  /直接(告诉|给我|说出)/,
  /答案(是什么|给我|告诉我)/,
  /原句(是什么|给我|告诉我)/,
  /hiddenmeaning/,
  /hiddenmeaning是什么/,
  /正确(答案|选项)/,
  /把秘密(说|告诉)出来/
];

const UNSAFE_PATTERNS = [
  /自杀/,
  /自残/,
  /割腕/,
  /杀人/,
  /毒品/,
  /未成年.*性/,
  /性剥削/,
  /暴力/,
  /恐吓/,
  /仇恨/
];

const OFF_TOPIC_PATTERNS = [
  /^你是谁$/,
  /^你好$/,
  /^在吗$/,
  /讲个笑话/,
  /天气/,
  /闲聊/,
  /唱歌/,
  /你会做什么/,
  /普通聊天/
];

export function classifyPetChatMessage(message: string): PetSafetyDecision {
  const normalized = normalize(message);

  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      category: "unsafe_content",
      safetyBlocked: true,
      safetyReason: "unsafe_content"
    };
  }

  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      category: "prompt_injection",
      safetyBlocked: true,
      safetyReason: "prompt_injection"
    };
  }

  if (DIRECT_ANSWER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      category: "direct_answer_request",
      safetyBlocked: true,
      safetyReason: "direct_answer_request"
    };
  }

  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      category: "off_topic",
      safetyBlocked: true,
      safetyReason: "off_topic"
    };
  }

  return {
    category: "normal_hint",
    safetyBlocked: false,
    safetyReason: null
  };
}

export function buildPetSafetyMemoryNote(
  decision: Pick<PetSafetyDecision, "category">,
  _userMessage: string,
  _reply: string
) {
  if (decision.category === "normal_hint") {
    return "宠物以温柔提示回应了线索探索，没有记录用户原文或答案。";
  }

  return `宠物拒绝了${decision.category}请求，并把对话拉回安全的线索探索。`;
}

export function pickSuggestedObjectId(
  availableObjectIds: string[],
  discoveredObjectIds: string[],
  candidate?: string | null
) {
  if (candidate && availableObjectIds.includes(candidate)) {
    return candidate;
  }

  const discovered = discoveredObjectIds.find((id) =>
    availableObjectIds.includes(id)
  );
  if (discovered) {
    return discovered;
  }

  return availableObjectIds[0] ?? null;
}

export function buildBlockedReply(category: PetSafetyCategory) {
  switch (category) {
    case "direct_answer_request":
      return "我不能直接把秘密说破喵，但你可以再看看已经出现过的线索。";
    case "prompt_injection":
      return "这个我不能说哦。我只是一只守着小屋的猫，可以陪你找线索。";
    case "unsafe_content":
      return "我不能继续这个话题喵，我们回到小屋里的线索吧。";
    case "off_topic":
      return "我只能陪你看小屋线索喵。你可以先点一个已经发现的物件试试。";
    default:
      return "我会继续陪你找线索喵。";
  }
}
