import { jsonResponse, parseJsonBody } from "@/lib/api/http";
import { generateRoomService } from "@/lib/api/mock-services";
import {
  generateRoomRequestSchema,
  generateRoomResponseSchema
} from "@/lib/schemas/api";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, generateRoomRequestSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const response = await generateRoomService(parsed.data);

  return jsonResponse(generateRoomResponseSchema, response, 201);
}
