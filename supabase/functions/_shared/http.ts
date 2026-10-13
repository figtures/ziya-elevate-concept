export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function required(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(503, "Hizmet henüz yapılandırılmadı.");
  return value;
}

export function cors(req: Request): Record<string, string> {
  const allowed = required("CMS_ALLOWED_ORIGINS").split(",").map((x) => x.trim()).filter(Boolean);
  const origin = req.headers.get("origin");
  if (!origin || !allowed.includes(origin)) throw new HttpError(403, "Bu kaynaktan erişime izin verilmiyor.");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function bodyJson(req: Request, limit = 16384): Promise<Record<string, unknown>> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "JSON gövdesi gerekli.");
  }
  if (!req.body) throw new HttpError(400, "İstek gövdesi eksik.");
  const reader = req.body.getReader();
  let count = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > limit) { await reader.cancel(); throw new HttpError(413, "İstek çok büyük."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const merged = new Uint8Array(count);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(merged)); }
  catch { throw new HttpError(400, "Geçersiz JSON."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new HttpError(400, "Geçersiz istek.");
  return parsed as Record<string, unknown>;
}

export function field(body: Record<string, unknown>, key: string, min: number, max: number): string {
  const raw = body[key];
  if (raw === undefined && min === 0) return "";
  if (typeof raw !== "string") throw new HttpError(400, `${key} alanı geçersiz.`);
  const value = raw.trim();
  if (value.length < min || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(value)) {
    throw new HttpError(400, `${key} alanı geçersiz.`);
  }
  return value;
}

export function emailField(body: Record<string, unknown>): string {
  const email = field(body, "email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "E-posta adresi geçersiz.");
  return email;
}

export function failure(error: unknown, headers: Record<string, string>): Response {
  if (error instanceof HttpError) return json({ ok: false, error: error.message }, error.status, headers);
  // Do not log request bodies, tokens, email addresses or provider responses.
  console.error("cms_function_failed", error instanceof Error ? error.name : "unknown");
  return json({ ok: false, error: "İşlem tamamlanamadı. Lütfen tekrar deneyin." }, 500, headers);
}
