import { apiError, jsonResponse, parseJsonBody } from "@/lib/api/http";
import {
  getRequestUserId,
  getSupabaseServerConfig,
  supabaseRest,
  supabaseStorage,
  toAbsoluteSupabaseUrl
} from "@/lib/server/supabaseRest";
import {
  createAssetUploadUrlRequestSchema,
  createAssetUploadUrlResponseSchema
} from "@/lib/schemas/api";

const BUCKET = "room-assets";
const SIGNED_URL_TTL_SECONDS = 10 * 60;

function extensionForContentType(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

function safeFileStem(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createAssetUploadUrlRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const currentUserId = getRequestUserId(request);

  if (!currentUserId) {
    return apiError("unauthorized", "Missing user context", 401);
  }

  const config = getSupabaseServerConfig();

  if (!config) {
    return apiError(
      "server_not_configured",
      "Supabase service role is not configured",
      500
    );
  }

  const extension = extensionForContentType(parsed.data.contentType);

  if (!extension) {
    return apiError(
      "unsupported_media_type",
      "Only jpg, png, and webp are allowed",
      415
    );
  }

  const rooms = await supabaseRest<Array<{ id: string; creator_id: string }>>(
    `rooms?id=eq.${encodeURIComponent(
      parsed.data.roomId
    )}&select=id,creator_id&limit=1`,
    { method: "GET" },
    config
  );
  const room = rooms[0];

  if (!room) {
    return apiError("not_found", "Room not found", 404);
  }

  if (room.creator_id !== currentUserId) {
    return apiError(
      "forbidden",
      "Only the room owner can upload clue images",
      403
    );
  }

  const assetId = crypto.randomUUID();
  const storagePath = `${currentUserId}/${parsed.data.roomId}/${assetId}-${safeFileStem(
    parsed.data.fileName
  )}.${extension}`;

  await supabaseRest(
    "room_assets",
    {
      method: "POST",
      body: JSON.stringify({
        id: assetId,
        room_id: parsed.data.roomId,
        creator_id: currentUserId,
        storage_path: storagePath,
        public_url: null,
        signed_url_strategy: {
          mode: "signed",
          ttl_seconds: SIGNED_URL_TTL_SECONDS,
          audit_status: "pending_review"
        },
        asset_type: "image",
        role: parsed.data.role,
        safe_description: null
      })
    },
    config
  );

  const upload = await supabaseStorage<{ url: string }>(
    `object/upload/sign/${BUCKET}/${encodeURIComponent(storagePath)}`,
    {
      method: "POST",
      body: JSON.stringify({
        expiresIn: SIGNED_URL_TTL_SECONDS
      })
    },
    config
  );
  const preview = await supabaseStorage<{ signedURL: string }>(
    `object/sign/${BUCKET}/${encodeURIComponent(storagePath)}`,
    {
      method: "POST",
      body: JSON.stringify({
        expiresIn: SIGNED_URL_TTL_SECONDS
      })
    },
    config
  );
  const expiresAt = new Date(
    Date.now() + SIGNED_URL_TTL_SECONDS * 1000
  ).toISOString();

  return jsonResponse(
    createAssetUploadUrlResponseSchema,
    {
      assetId,
      uploadUrl: toAbsoluteSupabaseUrl(config, upload.url),
      storagePath,
      previewUrl: toAbsoluteSupabaseUrl(config, preview.signedURL),
      publicUrl: null,
      expiresAt
    },
    201
  );
}
