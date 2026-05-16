import { jsonResponse, parseJsonBody } from "@/lib/api/http";
import { petChatService } from "@/lib/api/mock-services";
import { petChatRequestSchema, petChatResponseSchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, petChatRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const response = await petChatService(parsed.data);

  return jsonResponse(petChatResponseSchema, response);
}
