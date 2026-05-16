import { NextResponse } from "next/server";
import { z } from "zod";

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details })
      }
    },
    { status }
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { response: NextResponse }> {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return {
      response: apiError("invalid_json", "Request body must be valid JSON", 400)
    };
  }

  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return {
      response: apiError(
        "validation_error",
        "Request body does not match API contract",
        422,
        parsed.error.flatten()
      )
    };
  }

  return { data: parsed.data };
}

export function jsonResponse<T>(schema: z.ZodType<T>, payload: T, status = 200) {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return apiError(
      "contract_response_invalid",
      "Handler response does not match API contract",
      500,
      parsed.error.flatten()
    );
  }

  return NextResponse.json(parsed.data, { status });
}
