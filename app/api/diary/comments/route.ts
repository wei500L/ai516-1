import { jsonResponse, parseJsonBody } from "@/lib/api/http";
import { createDiaryCommentService } from "@/lib/api/mock-services";
import {
  createDiaryCommentRequestSchema,
  createDiaryCommentResponseSchema
} from "@/lib/schemas/api";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createDiaryCommentRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const response = await createDiaryCommentService(parsed.data);

  return jsonResponse(createDiaryCommentResponseSchema, response, 201);
}
