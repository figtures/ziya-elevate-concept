import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { bodyJson, cors, emailField, failure, field, HttpError, json, required } from "../_shared/http.ts";

async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(`${required("CMS_RATE_LIMIT_SECRET")}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  let headers: Record<string, string> = {};
  try {
    headers = cors(req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") throw new HttpError(405, "Yalnızca POST desteklenir.");
    const body = await bodyJson(req, 65536);
    const honeypot = field(body, "website", 0, 500);
    if (honeypot) throw new HttpError(400, "Başvuru doğrulanamadı.");
    // Runtime supplies the trusted header at the gateway. Configure it explicitly;
    // never accept a client-submitted body.ip or the first spoofable X-Forwarded-For value.
    const headerName = required("CMS_CLIENT_IP_HEADER").toLowerCase();
    if (!["x-forwarded-for", "x-real-ip", "cf-connecting-ip"].includes(headerName)) throw new HttpError(503, "Hız sınırı yapılandırılmadı.");
    const ipHeader = req.headers.get(headerName) ?? "";
    const ip = headerName === "x-forwarded-for" ? ipHeader.split(",").at(-1)?.trim() ?? "" : ipHeader.trim();
    if (!ip || ip.length > 128 || !/^[0-9a-fA-F:.]+$/.test(ip)) throw new HttpError(503, "Başvuru güvenlik kontrolü tamamlanamadı.");
    const email = emailField(body);
    const topic = field(body, "topic", 1, 20);
    if (!["konusmaci", "kurumsal", "bireysel", "mentorluk", "basin", "soru"].includes(topic)) throw new HttpError(400, "Talep türü geçersiz.");
    const payload = {
      name: field(body, "name", 2, 120), email,
      company: field(body, "company", 0, 200), team_size: field(body, "team_size", 0, 80),
      topic, message: field(body, "message", 10, 10000),
    };
    const secret = Deno.env.get("CMS_TURNSTILE_SECRET");
    if (secret) {
      const challenge = field(body, "captcha_token", 1, 2048);
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", body: new URLSearchParams({ secret, response: challenge, remoteip: ip }),
        signal: AbortSignal.timeout(8000),
      });
      const verified = await response.json();
      if (!response.ok || verified.success !== true) throw new HttpError(400, "Güvenlik doğrulamasını tamamlayın.");
    }
    const admin = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [ipHash, emailHash] = await Promise.all([hash(`ip:${ip}`), hash(`email:${email}`)]);
    const { data: id, error } = await admin.rpc("cms_submit_lead", {
      p_ip_hash: ipHash, p_email_hash: emailHash, p_payload: payload,
    });
    if (error?.message?.includes("RATE_LIMITED")) return json({ ok: false, error: "Çok fazla başvuru gönderildi. Lütfen daha sonra tekrar deneyin." }, 429, { ...headers, "Retry-After": "3600" });
    if (error || typeof id !== "string") throw new HttpError(503, "Başvurunuz kaydedilemedi. Lütfen tekrar deneyin.");
    return json({ ok: true, id }, 201, headers);
  } catch (error) { return failure(error, headers); }
});
