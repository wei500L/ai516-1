import crypto from "node:crypto";

import { supabaseRest, getSupabaseServerConfig } from "@/lib/server/supabaseRest";
import { uploadGeneratedAsset } from "@/lib/storage/uploadGeneratedAsset";

export type StoreGeneratedAssetInput = {
  roomId: string;
  creatorId: string;
  objectId: string;
  objectName: string;
  promptText: string;
  sourceType: "url" | "base64";
  buffer: Buffer;
  mimeType: string;
  providerName: string;
  imageMode: "images_api" | "chat_completions_image_model";
  responseFormat: "url" | "b64_json" | "auto";
};

export type StoredGeneratedAsset = {
  assetId: string;
  objectId: string;
  storagePath: string;
  publicUrl: string | null;
  sourceType: "url" | "base64";
  mimeType: string;
  storageMode: "supabase" | "local";
};

export async function storeGeneratedAsset(
  input: StoreGeneratedAssetInput
): Promise<StoredGeneratedAsset> {
  const assetId = crypto.randomUUID();
  const uploaded = await uploadGeneratedAsset({
    roomId: input.roomId,
    creatorId: input.creatorId,
    objectId: input.objectId,
    assetId,
    buffer: input.buffer,
    mimeType: input.mimeType
  });
  const config = getSupabaseServerConfig();

  if (config) {
    await supabaseRest(
      "room_assets",
      {
        method: "POST",
        body: JSON.stringify({
          id: assetId,
          room_id: input.roomId,
          creator_id: input.creatorId,
          storage_path: uploaded.storagePath,
          public_url: uploaded.publicUrl,
          signed_url_strategy: {
            mode: uploaded.storageMode === "supabase" ? "signed" : "local",
            ttl_seconds: uploaded.storageMode === "supabase" ? 3600 : null,
            provider_name: input.providerName,
            image_mode: input.imageMode,
            response_format: input.responseFormat,
            object_id: input.objectId
          },
          asset_type: "image",
          role: "clue_image",
          safe_description: input.objectName
        })
      },
      config
    );
  }

  return {
    assetId,
    objectId: input.objectId,
    storagePath: uploaded.storagePath,
    publicUrl: uploaded.publicUrl,
    sourceType: input.sourceType,
    mimeType: uploaded.mimeType,
    storageMode: uploaded.storageMode
  };
}
