import { jsonResponse, parseJsonBody } from "@/lib/api/http";
import { createDiaryAccessRequestService } from "@/lib/api/mock-services";
import {
  createDiaryAccessRequestRequestSchema,
  createDiaryAccessRequestResponseSchema
} from "@/lib/schemas/api";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(
    request,
    createDiaryAccessRequestRequestSchema
  );

  if ("response" in parsed) {
    return parsed.response;
  }

  const response = await createDiaryAccessRequestService(parsed.data);

  return jsonResponse(createDiaryAccessRequestResponseSchema, response, 201);
}
