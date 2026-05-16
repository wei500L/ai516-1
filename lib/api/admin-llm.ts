import type {
  AdminLlmConfigDraft,
  AdminLlmTestChatRequest,
  AdminLlmTestImageRequest,
  AdminLlmTestResult
} from "@/lib/schemas/adminLlmConfig";
import { adminLlmConfigDraftSchema } from "@/lib/schemas/adminLlmConfig";

const ADMIN_LLM_API_BASE = "/api/admin/llm";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ADMIN_LLM_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.error?.message ?? `Admin LLM API request failed: ${response.status}`
    );
  }

  return (await response.json()) as T;
}

export async function fetchAdminLlmConfig() {
  const payload = await requestJson<unknown>("/config", { method: "GET" });
  return adminLlmConfigDraftSchema.parse(payload);
}

export async function saveAdminLlmConfig(config: AdminLlmConfigDraft) {
  const payload = await requestJson<unknown>("/config", {
    method: "PUT",
    body: JSON.stringify(config)
  });
  return adminLlmConfigDraftSchema.parse(payload);
}

export async function resetAdminLlmConfig() {
  const payload = await requestJson<unknown>("/config/reset", {
    method: "POST"
  });
  return adminLlmConfigDraftSchema.parse(payload);
}

export async function testAdminLlmChat(
  request: AdminLlmTestChatRequest
): Promise<AdminLlmTestResult> {
  return requestJson<AdminLlmTestResult>("/test/chat", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export async function testAdminLlmImage(
  request: AdminLlmTestImageRequest
): Promise<AdminLlmTestResult> {
  return requestJson<AdminLlmTestResult>("/test/image", {
    method: "POST",
    body: JSON.stringify(request)
  });
}
