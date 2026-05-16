import {
  createDefaultAdminLlmConfigDraft,
  type AdminLlmConfigDraft
} from "@/lib/schemas/adminLlmConfig";

let inMemoryAdminLlmConfig: AdminLlmConfigDraft =
  createDefaultAdminLlmConfigDraft();

export function getAdminLlmConfigDraft() {
  return inMemoryAdminLlmConfig;
}

export function saveAdminLlmConfigDraft(config: AdminLlmConfigDraft) {
  inMemoryAdminLlmConfig = config;
  return inMemoryAdminLlmConfig;
}

export function resetAdminLlmConfigDraft() {
  inMemoryAdminLlmConfig = createDefaultAdminLlmConfigDraft();
  return inMemoryAdminLlmConfig;
}

