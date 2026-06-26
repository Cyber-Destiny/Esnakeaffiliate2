import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { z, ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Wrap an API handler with consistent error handling. */
export function withErrors<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.status === 401) return unauthorized(err.message);
        if (err.status === 403) return forbidden(err.message);
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return badRequest("Validation failed", err.issues);
      }
      console.error("[api] unhandled error:", err);
      const message = err instanceof Error ? err.message : "Server error";
      return serverError(message);
    }
  };
}

export function parseZod<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/** Extract client IP from request headers. */
export function getClientIp(req: Request): string | null {
  const headers = req.headers;
  return (
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}
