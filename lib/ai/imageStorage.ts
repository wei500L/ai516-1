import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import type { GeneratedImageSource } from "@/lib/ai/openAiCompatible";

export type PersistedGeneratedImage = {
  sourceType: "url" | "base64";
  url: string;
  storagePath: string | null;
  mimeType: string | null;
};

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

export async function persistGeneratedImage(
  image: GeneratedImageSource,
  key: string
): Promise<PersistedGeneratedImage> {
  if (image.kind === "url") {
    return {
      sourceType: "url",
      url: image.url,
      storagePath: null,
      mimeType: null
    };
  }

  const extension = extensionFromMimeType(image.mimeType);
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${safeKey}-${crypto.randomUUID()}.${extension}`;
  const relativePath = path.posix.join("generated", "room-assets", fileName);
  const outputDir = path.join(process.cwd(), "public", "generated", "room-assets");
  const outputPath = path.join(outputDir, fileName);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, Buffer.from(image.b64, "base64"));

  return {
    sourceType: "base64",
    url: `/${relativePath}`,
    storagePath: relativePath,
    mimeType: image.mimeType
  };
}

