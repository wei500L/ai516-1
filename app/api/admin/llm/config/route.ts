import { jsonResponse, parseJsonBody } from "@/lib/api/http";
import {
  adminLlmConfigDraftSchema,
  type AdminLlmConfigDraft
} from "@/lib/schemas/adminLlmConfig";
import {
  getAdminLlmConfigDraft,
  saveAdminLlmConfigDraft
} from "@/lib/server/adminLlmConfigStore";

export async function GET() {
  return jsonResponse(adminLlmConfigDraftSchema, getAdminLlmConfigDraft());
}

export async function PUT(request: Request) {
  const parsed = await parseJsonBody(request, adminLlmConfigDraftSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const saved: AdminLlmConfigDraft = saveAdminLlmConfigDraft(parsed.data);

  return jsonResponse(adminLlmConfigDraftSchema, saved);
}
