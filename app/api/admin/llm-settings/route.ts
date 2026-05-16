import { jsonResponse, parseJsonBody } from "@/lib/api/http";
import { assertAdminAccess } from "@/lib/server/adminAccess";
import {
  createDefaultLlmProviderSettingsDraft,
  getActiveLlmProviderSettings,
  listLlmProviderSettings,
  saveLlmProviderSettings
} from "@/lib/server/llmSettingsRepository";
import { adminLlmConfigDraftSchema } from "@/lib/schemas/adminLlmConfig";

export async function GET(request: Request) {
  const denied = assertAdminAccess(request);
  if (denied) return denied;

  const active = await getActiveLlmProviderSettings();

  if (active) {
    return jsonResponse(adminLlmConfigDraftSchema, active);
  }

  const rows = await listLlmProviderSettings();

  return jsonResponse(
    adminLlmConfigDraftSchema,
    rows[0] ?? createDefaultLlmProviderSettingsDraft()
  );
}

export async function POST(request: Request) {
  const denied = assertAdminAccess(request);
  if (denied) return denied;

  const parsed = await parseJsonBody(request, adminLlmConfigDraftSchema);
  if ("response" in parsed) return parsed.response;

  const saved = await saveLlmProviderSettings(parsed.data);
  return jsonResponse(adminLlmConfigDraftSchema, saved, 201);
}
