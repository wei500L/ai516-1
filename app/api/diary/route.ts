import { jsonResponse } from "@/lib/api/http";
import { getDiaryService } from "@/lib/api/mock-services";
import { getDiaryResponseSchema } from "@/lib/schemas/api";

export async function GET() {
  const response = await getDiaryService();

  return jsonResponse(getDiaryResponseSchema, response);
}
