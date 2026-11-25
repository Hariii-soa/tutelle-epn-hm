export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
export const AUTH_EXPIRED = "auth:expired";

type Opts = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown };

export async function api<T>(path: string, { method = "GET", body }: Opts = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Serveur injoignable. Vérifiez votre connexion.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    if (e?.code === "UNAUTHENTICATED") window.dispatchEvent(new Event(AUTH_EXPIRED));
    throw new ApiError(res.status, e?.code ?? "ERROR", e?.message ?? "Une erreur est survenue", e?.fields);
  }
  return data as T;
}
