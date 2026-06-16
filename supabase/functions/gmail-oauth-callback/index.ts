import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlResponse(message: string, returnTo: string, ok: boolean) {
  const safeMessage = message.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] ?? char));
  const safeReturnTo = returnTo.startsWith("http") ? returnTo : "https://catalyst-grants.lovable.app/settings";
  const html = `<!doctype html><html><head><title>Gmail ${ok ? "Connected" : "Error"}</title>
<style>body{font-family:system-ui;background:#fff;color:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{max-width:420px;padding:32px;border:1px solid #e2e8f0;border-radius:12px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.05)}
h1{font-size:18px;margin:0 0 8px} p{color:#64748b;font-size:14px;margin:0 0 16px}
a{display:inline-block;padding:8px 16px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-size:14px}</style></head>
<body><div class="card"><h1>${ok ? "✓ Gmail connected" : "Connection failed"}</h1><p>${safeMessage}</p>
<a href="${safeReturnTo}" target="_top">Return to app</a></div>
<script>
  try { if (window.opener) window.opener.location.href = ${JSON.stringify(safeReturnTo)}; } catch (_) {}
  setTimeout(()=>{window.location.href=${JSON.stringify(safeReturnTo)}},2000)
</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const fallbackOrigin = req.headers.get("origin") || "https://catalyst-grants.lovable.app";
  let returnTo = `${fallbackOrigin}/settings`;

  if (errorParam) return htmlResponse(`Google returned: ${errorParam}`, returnTo, false);
  if (!code || !stateRaw) return htmlResponse("Missing code or state parameter.", returnTo, false);

  let state: any;
  try { state = JSON.parse(atob(stateRaw)); } catch { return htmlResponse("Invalid state.", returnTo, false); }
  const { org_id, user_id, return_to, origin: stateOrigin } = state;
  const appOrigin = stateOrigin || fallbackOrigin;
  if (return_to) returnTo = return_to.startsWith("http") ? return_to : `${appOrigin}${return_to}`;

  try {
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-oauth-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) return htmlResponse(`Token exchange failed: ${tokens.error_description || tokens.error}`, returnTo, false);

    // Fetch user email
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    const email = profile.email;
    if (!email) return htmlResponse("Could not read Google profile email.", returnTo, false);

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await admin.from("email_credentials").upsert({
      org_id,
      provider: "gmail",
      email_address: email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      scope: tokens.scope ?? null,
      provider_user_id: profile.id ?? null,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "org_id" });

    if (error) return htmlResponse(`Database error: ${error.message}`, returnTo, false);
    return htmlResponse(`Connected ${email}. Returning you to the app...`, returnTo, true);
  } catch (e) {
    return htmlResponse(`Unexpected error: ${String(e)}`, returnTo, false);
  }
});
