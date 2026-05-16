import { apiError } from "@/lib/api/http";

function parseAllowList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

export function assertAdminAccess(request: Request) {
  const allowList = parseAllowList(process.env.HEART_CABIN_ADMIN_USER_IDS);
  const adminToken = process.env.HEART_CABIN_ADMIN_API_TOKEN?.trim();
  const userId = request.headers.get("x-user-id");
  const token = request.headers.get("x-admin-token");

  if (allowList.size === 0 && !adminToken) {
    return null;
  }

  if (adminToken && token === adminToken) {
    return null;
  }

  if (userId && allowList.has(userId)) {
    return null;
  }

  return apiError("forbidden", "Admin access is required", 403);
}

