import type { Json } from "@/lib/database.types";

export type SupabaseServerConfig = {
  url: string;
  serviceRoleKey: string;
};

export function getSupabaseServerConfig(): SupabaseServerConfig | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey
  };
}

export async function supabaseRest<T>(
  path: string,
  init: RequestInit,
  config: SupabaseServerConfig
): Promise<T> {
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`SUPABASE_REST_${response.status}:${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function supabaseStorage<T>(
  path: string,
  init: RequestInit,
  config: SupabaseServerConfig
): Promise<T> {
  const response = await fetch(`${config.url}/storage/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`SUPABASE_STORAGE_${response.status}:${body}`);
  }

  return (await response.json()) as T;
}

export function getRequestUserId(request: Request): string | null {
  return request.headers.get("x-user-id");
}

export function asRecord(value: Json): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value
    : {};
}

export function toAbsoluteSupabaseUrl(
  config: SupabaseServerConfig,
  value: string
) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${config.url}${value.startsWith("/") ? "" : "/"}${value}`;
}
