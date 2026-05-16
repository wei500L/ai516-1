import { jsonResponse, parseJsonBody } from "@/lib/api/http";
import { createAssetUploadUrlService } from "@/lib/api/mock-services";
import {
  createAssetUploadUrlRequestSchema,
  createAssetUploadUrlResponseSchema
} from "@/lib/schemas/api";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createAssetUploadUrlRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const response = await createAssetUploadUrlService(parsed.data);

  return jsonResponse(createAssetUploadUrlResponseSchema, response, 201);
}
