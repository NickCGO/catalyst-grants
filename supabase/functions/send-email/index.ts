import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function b64url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMime(from: string, to: string, subject: string, body: string, cc?: string, bcc?: string) {
  const lines = [`From: ${from}`, `To: ${to}`];
  if (cc) lines.push(`Cc: ${cc}`);
  if (bcc) lines.push(`Bcc: ${bcc}`);
  lines.push(`Subject: ${subject}`, `MIME-Version: 1.0`, `Content-Type: text/plain; charset="UTF-8"`, ``, body);
  return lines.join("\r\n");
}

async function refreshGmail(admin: ReturnType<typeof createClient>, cred: Record<string, any>) {
  const expiresAt = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() : 0;
  if (expiresAt - 60_000 > Date.now()) return cred.access_token;
  if (!cred.refresh_token) throw new Error("No refresh token — please reconnect Gmail");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!,
      refresh_token: cred.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const tk = await res.json();
  if (!res.ok) throw new Error(`Refresh failed: ${tk.error_description || tk.error}`);
  const newExpiry = new Date(Date.now() + (tk.expires_in || 3600) * 1000).toISOString();
  await admin.from("email_credentials").update({ access_token: tk.access_token, token_expires_at: newExpiry }).eq("id", cred.id);
  return tk.access_token;
}

async function refreshOutlook(admin: ReturnType<typeof createClient>, cred: Record<string, any>) {
  const expiresAt = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() : 0;
  if (expiresAt - 60_000 > Date.now()) return cred.access_token;
  if (!cred.refresh_token) throw new Error("No refresh token — please reconnect Outlook");

  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("MICROSOFT_OAUTH_CLIENT_ID")!,
      client_secret: Deno.env.get("MICROSOFT_OAUTH_CLIENT_SECRET")!,
      refresh_token: cred.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const tk = await res.json();
  if (!res.ok) throw new Error(`Refresh failed: ${tk.error_description || tk.error}`);
  const newExpiry = new Date(Date.now() + (tk.expires_in || 3600) * 1000).toISOString();
  await admin.from("email_credentials").update({
    access_token: tk.access_token,
    refresh_token: tk.refresh_token ?? cred.refresh_token,
    token_expires_at: newExpiry,
  }).eq("id", cred.id);
  return tk.access_token;
}

async function sendViaGmail(admin: ReturnType<typeof createClient>, cred: Record<string, any>, to: string, subject: string, body: string, cc?: string, bcc?: string) {
  const accessToken = await refreshGmail(admin, cred);
  const mime = buildMime(cred.email_address, to, subject, body, cc, bcc);
  const raw = b64url(mime);
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`gmail_send_failed: ${JSON.stringify(data)}`);
  return data;
}

async function sendViaOutlook(admin: ReturnType<typeof createClient>, cred: Record<string, any>, to: string, subject: string, body: string, cc?: string, bcc?: string) {
  const accessToken = await refreshOutlook(admin, cred);
  const toRecipients = to.split(",").map((addr) => ({ emailAddress: { address: addr.trim() } }));
  const ccRecipients = cc ? cc.split(",").map((addr) => ({ emailAddress: { address: addr.trim() } })) : undefined;
  const bccRecipients = bcc ? bcc.split(",").map((addr) => ({ emailAddress: { address: addr.trim() } })) : undefined;

  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: { subject, body: { contentType: "Text", content: body }, toRecipients, ccRecipients, bccRecipients },
      saveToSentItems: true,
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(`outlook_send_failed: ${JSON.stringify(detail)}`);
  }
  return {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { to, subject, body: messageBody, cc, bcc, funder_id, relationship_id } = body;
    if (!to || !subject || !messageBody) {
      return new Response(JSON.stringify({ error: "to, subject, body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
    if (!org) return new Response(JSON.stringify({ error: "no_org" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cred } = await admin.from("email_credentials").select("*").eq("org_id", org.id).maybeSingle();
    if (!cred || !cred.access_token) {
      return new Response(JSON.stringify({ error: "inbox_not_connected" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sendResult: Record<string, any>;
    if (cred.provider === "gmail") {
      sendResult = await sendViaGmail(admin, cred, to, subject, messageBody, cc, bcc);
    } else if (cred.provider === "outlook") {
      sendResult = await sendViaOutlook(admin, cred, to, subject, messageBody, cc, bcc);
    } else {
      return new Response(JSON.stringify({ error: `unsupported_provider: ${cred.provider}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (funder_id) {
      await admin.from("crm_emails").insert({
        org_id: org.id, funder_id, relationship_id: relationship_id || null,
        recipient_email: to, subject, body: messageBody, status: "sent",
      });
      await admin.from("funder_interactions").insert({
        org_id: org.id, funder_id, relationship_id: relationship_id || null,
        interaction_type: "email_sent", summary: `Email sent: ${subject}`, sentiment: "neutral",
      });
    }

    await admin.from("email_credentials").update({ last_synced_at: new Date().toISOString() }).eq("id", cred.id);

    return new Response(JSON.stringify({ ok: true, ...sendResult }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
