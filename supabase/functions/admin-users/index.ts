import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { bodyJson, cors, emailField, failure, field, HttpError, json, required } from "../_shared/http.ts";

Deno.serve(async (req: Request) => {
  let headers: Record<string, string> = {};
  try {
    headers = cors(req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") throw new HttpError(405, "Yalnızca POST desteklenir.");
    const authorization = req.headers.get("authorization") ?? "";
    if (!/^Bearer [^\s]+$/i.test(authorization)) throw new HttpError(401, "Oturum açmanız gerekiyor.");
    const token = authorization.slice(7);
    const url = required("SUPABASE_URL");
    const clientKey = Deno.env.get("CMS_PUBLISHABLE_KEY") || required("SUPABASE_ANON_KEY");
    const caller = createClient(url, clientKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    // getUser validates the caller against Auth. Do not decode an unverified JWT.
    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || !userData.user) throw new HttpError(401, "Oturumunuz doğrulanamadı.");
    const { data: member, error: memberError } = await caller.from("cms_members")
      .select("role,active").eq("user_id", userData.user.id).single();
    if (memberError || !member?.active || member.role !== "owner") throw new HttpError(403, "Kullanıcı yönetimi için hesap sahibi yetkisi gerekiyor.");
    const body = await bodyJson(req, 4096);
    if (body.action !== "invite") throw new HttpError(400, "Geçersiz işlem.");
    const email = emailField(body);
    const role = field(body, "role", 1, 12);
    if (!["admin", "editor"].includes(role)) throw new HttpError(400, "Davette admin veya editor rolü seçin.");
    const redirectTo = required("CMS_ADMIN_REDIRECT_URL");
    const redirectUrl = new URL(redirectTo);
    const allowed = required("CMS_ALLOWED_ORIGINS").split(",").map((x) => x.trim());
    if (redirectUrl.protocol !== "https:" || !allowed.includes(redirectUrl.origin)) throw new HttpError(503, "Davet dönüş adresi yapılandırılmadı.");
    const admin = createClient(url, required("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Actual mail is sent only when the owner explicitly submits the invite action in the UI.
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (inviteError || !invited.user) throw new HttpError(409, "Davet oluşturulamadı. Hesap daha önce eklenmiş olabilir; kullanıcı listesini kontrol edin.");
    // Re-check DB membership/owner authorization in the RPC; never insert a role with the service client.
    const { error: grantError } = await caller.rpc("cms_set_member", {
      p_user_id: invited.user.id, p_role: role, p_active: true,
    });
    if (grantError) {
      // Auth invite and DB membership cannot share a transaction. An invited user without
      // membership has no CMS access. Return the recoverable user id instead of false success.
      return json({ ok: false, error: "Davet e-postası gönderildi ancak panel yetkisi atanamadı. Hesap sahibinin üyeliği tamamlaması gerekiyor.", user_id: invited.user.id }, 409, headers);
    }
    return json({ ok: true, user_id: invited.user.id }, 201, headers);
  } catch (error) { return failure(error, headers); }
});
