import { createClient } from "npm:@supabase/supabase-js@2";
import { signState, safeOrigin, safeReturnPath } from "../_shared/oauthState.ts";
import { serviceClient } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
    if (!org) return new Response(JSON.stringify({ error: "no_org" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { returnTo, origin: bodyOrigin } = await req.json().catch(() => ({ returnTo: "", origin: "" }));
    const appOrigin = safeOrigin(bodyOrigin || req.headers.get("origin"));

    const clientId = Deno.env.get("MICROSOFT_OAUTH_CLIENT_ID")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/outlook-oauth-callback`;
    const nonce = crypto.randomUUID();
    const exp = Date.now() + 600000;
    const { error: stateError } = await serviceClient().from("oauth_connection_states").insert({ nonce, org_id: org.id, user_id: user.id, provider: "outlook", expires_at: new Date(exp).toISOString() });
    if (stateError) throw new Error("Could not start secure connection");
    const state = await signState({ provider: "outlook", org_id: org.id, user_id: user.id, return_to: safeReturnPath(returnTo), origin: appOrigin, nonce, exp }, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

    const scope = [
      "offline_access",
      "https://graph.microsoft.com/Mail.Send",
      "https://graph.microsoft.com/Mail.Read",
      "https://graph.microsoft.com/User.Read",
    ].join(" ");

    const url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("response_mode", "query");
    url.searchParams.set("scope", scope);
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);

    return new Response(JSON.stringify({ url: url.toString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
