import { jsonResponse } from "@/lib/api/http";
import {
  adminLlmConfigDraftSchema,
} from "@/lib/schemas/adminLlmConfig";
import { resetAdminLlmConfigDraft } from "@/lib/server/adminLlmConfigStore";

export async function POST() {
  return jsonResponse(adminLlmConfigDraftSchema, resetAdminLlmConfigDraft());
}
