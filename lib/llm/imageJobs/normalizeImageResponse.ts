import type {
  NormalizedImageItem,
  NormalizedImageResponse
} from "@/lib/llm/provider/types";

function normalizeBase64Payload(value: string) {
  const dataUrl = value.match(/^data:([^;]+);base64,(.+)$/);

  if (dataUrl) {
    return {
      mimeType: dataUrl[1],
      base64: dataUrl[2]
    };
  }

  return {
    mimeType: "image/png",
    base64: value
  };
}

function extractJsonLikeText(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (fenced?.[1]) {
      return JSON.parse(fenced[1]);
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    return trimmed;
  }
}

function imageItemFromCandidate(candidate: unknown): NormalizedImageItem | null {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return {
        type: "url",
        url: trimmed
      };
    }

    if (trimmed.startsWith("data:image/") || /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      const normalized = normalizeBase64Payload(trimmed);

      return {
        type: "base64",
        mimeType: normalized.mimeType,
        base64: normalized.base64
      };
    }

    const parsed = extractJsonLikeText(trimmed);

    if (parsed && parsed !== trimmed) {
      return imageItemFromCandidate(parsed);
    }

    return null;
  }

  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const normalized = imageItemFromCandidate(item);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  if (typeof candidate === "object") {
    const record = candidate as Record<string, unknown>;

    const directUrl =
      typeof record.url === "string"
        ? record.url
        : typeof record.image_url === "string"
          ? record.image_url
          : typeof record.imageUrl === "string"
            ? record.imageUrl
            : null;

    if (directUrl) {
      return {
        type: "url",
        url: directUrl
      };
    }

    const nestedUrl = (() => {
      const imageUrl = record.image_url;
      if (imageUrl && typeof imageUrl === "object") {
        const nested = imageUrl as Record<string, unknown>;
        return typeof nested.url === "string" ? nested.url : null;
      }
      return null;
    })();

    if (nestedUrl) {
      return {
        type: "url",
        url: nestedUrl
      };
    }

    const rawBase64 =
      typeof record.b64_json === "string"
        ? record.b64_json
        : typeof record.base64 === "string"
          ? record.base64
          : typeof record.image === "string"
            ? record.image
            : typeof record.data === "string"
              ? record.data
              : null;

    if (rawBase64) {
      const normalized = normalizeBase64Payload(rawBase64);

      return {
        type: "base64",
        mimeType: normalized.mimeType,
        base64: normalized.base64
      };
    }

    if (typeof record.text === "string" || typeof record.content === "string") {
      return imageItemFromCandidate(record.text ?? record.content);
    }
  }

  return null;
}

function pushImageCandidate(
  list: NormalizedImageItem[],
  seen: Set<string>,
  candidate: NormalizedImageItem | null
) {
  if (!candidate) {
    return;
  }

  const fingerprint =
    candidate.type === "url"
      ? `url:${candidate.url}`
      : `base64:${candidate.mimeType ?? "image/png"}:${candidate.base64}`;

  if (seen.has(fingerprint)) {
    return;
  }

  seen.add(fingerprint);
  list.push(candidate);
}

export function normalizeImageResponse(raw: unknown): NormalizedImageResponse {
  const images: NormalizedImageItem[] = [];
  const seen = new Set<string>();
  const record = raw as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    for (const item of record.data) {
      const object = item as Record<string, unknown>;
      pushImageCandidate(images, seen, imageItemFromCandidate(object));
    }
  }

  if (Array.isArray(record.choices)) {
    for (const choice of record.choices as Array<Record<string, unknown>>) {
      pushImageCandidate(images, seen, imageItemFromCandidate(choice));
      const message = choice.message;
      if (message && typeof message === "object") {
        const messageRecord = message as Record<string, unknown>;
        pushImageCandidate(
          images,
          seen,
          imageItemFromCandidate(messageRecord.content ?? messageRecord.image)
        );
      }
    }
  }

  if (record.output && Array.isArray(record.output)) {
    for (const entry of record.output as Array<Record<string, unknown>>) {
      const content = entry.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          pushImageCandidate(images, seen, imageItemFromCandidate(part));
        }
      } else {
        pushImageCandidate(images, seen, imageItemFromCandidate(content));
      }
    }
  }

  pushImageCandidate(images, seen, imageItemFromCandidate(record.url));
  pushImageCandidate(images, seen, imageItemFromCandidate(record.b64_json));
  pushImageCandidate(images, seen, imageItemFromCandidate(record.base64));
  pushImageCandidate(images, seen, imageItemFromCandidate(record.image));

  return {
    images,
    raw
  };
}
