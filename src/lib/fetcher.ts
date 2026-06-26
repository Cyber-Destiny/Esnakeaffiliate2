// Client-side fetch helper with JSON + error normalization.

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T = unknown>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    credentials: "include",
  });
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && String((data as any).error)) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(message, res.status, (data as any)?.details);
  }
  return data as T;
}

export const apiGet = <T = unknown>(url: string) => api<T>(url, { method: "GET" });
export const apiPost = <T = unknown>(url: string, body?: unknown) =>
  api<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const apiPatch = <T = unknown>(url: string, body?: unknown) =>
  api<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T = unknown>(url: string) =>
  api<T>(url, { method: "DELETE" });
