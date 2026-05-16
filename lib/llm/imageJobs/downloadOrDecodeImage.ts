import type { NormalizedImageItem } from "@/lib/llm/provider/types";

export type DownloadedImageBuffer = {
  buffer: Buffer;
  mimeType: string;
  sourceType: "url" | "base64";
  sourceUrl?: string;
};

function mimeFromMagicBytes(buffer: Buffer) {
  if (buffer.length >= 8) {
    const png = buffer.subarray(0, 8);
    if (
      png[0] === 0x89 &&
      png[1] === 0x50 &&
      png[2] === 0x4e &&
      png[3] === 0x47
    ) {
      return "image/png";
    }
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (buffer.length >= 12) {
    const header = buffer.subarray(0, 4).toString("ascii");
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webpTag = buffer.subarray(8, 12).toString("ascii");

    if (riff === "RIFF" && webpTag === "WEBP") {
      return "image/webp";
    }

    if (header === "GIF8") {
      return "image/gif";
    }
  }

  return null;
}

function decodeBase64Image(item: NormalizedImageItem): DownloadedImageBuffer {
  if (item.type !== "base64" || !item.base64) {
    throw new Error("IMAGE_BASE64_PAYLOAD_MISSING");
  }

  return {
    buffer: Buffer.from(item.base64, "base64"),
    mimeType: item.mimeType ?? "image/png",
    sourceType: "base64"
  };
}

async function downloadUrlImage(
  item: NormalizedImageItem,
  timeoutMs: number
): Promise<DownloadedImageBuffer> {
  if (item.type !== "url" || !item.url) {
    throw new Error("IMAGE_URL_PAYLOAD_MISSING");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(item.url, {
      method: "GET",
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`IMAGE_DOWNLOAD_FAILED_${response.status}:${body}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const headerMime = response.headers.get("content-type")?.split(";")[0];
    const mimeType = headerMime ?? mimeFromMagicBytes(buffer) ?? "image/png";

    return {
      buffer,
      mimeType,
      sourceType: "url",
      sourceUrl: item.url
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function downloadOrDecodeImage(
  images: NormalizedImageItem[],
  timeoutMs: number
): Promise<DownloadedImageBuffer> {
  const errors: string[] = [];

  for (const image of images) {
    try {
      if (image.type === "base64") {
        return decodeBase64Image(image);
      }

      if (image.type === "url") {
        return await downloadUrlImage(image, timeoutMs);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(
    errors.length > 0
      ? `IMAGE_DOWNLOAD_OR_DECODE_FAILED:${errors.join(" | ")}`
      : "IMAGE_DOWNLOAD_OR_DECODE_FAILED"
  );
}
