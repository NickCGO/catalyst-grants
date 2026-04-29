// Captures a support request from the landing-page chatbot and (optionally) emails the support inbox.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORT_INBOXES = ["info@nickfernandes.co.za", "hello@chantalehlen.com"];

function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { email, name, message, conversation, page_url } = body ?? {};

    if (!isEmail(email)) {
      return new Response(JSON.stringify({ error: "A valid email is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof message !== "string" || message.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Message is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.length > 5000) {
      return new Response(JSON.stringify({ error: "Message too long." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Try to identify logged-in user (optional)
    let user_id: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data } = await supabase.auth.getUser(token);
      user_id = data.user?.id ?? null;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("support_requests")
      .insert({
        email: email.trim().toLowerCase(),
        name: typeof name === "string" ? name.trim().slice(0, 200) : null,
        message: message.trim(),
        conversation: Array.isArray(conversation) ? conversation.slice(-30) : null,
        page_url: typeof page_url === "string" ? page_url.slice(0, 500) : null,
        user_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Could not save your request." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort email to each support inbox via Lovable transactional email.
    const emailedTo: string[] = [];
    const templateData = {
      fromName: typeof name === "string" ? name : null,
      fromEmail: email,
      message: message.trim(),
      pageUrl: typeof page_url === "string" ? page_url : null,
      conversation: Array.isArray(conversation) ? conversation.slice(-30) : [],
    };

    for (const recipient of SUPPORT_INBOXES) {
      try {
        const res = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "support-escalation",
            recipientEmail: recipient,
            idempotencyKey: `support-${inserted.id}-${recipient}`,
            templateData,
          },
        });
        if (res.error) {
          console.warn("Support email send failed (non-fatal):", recipient, res.error);
        } else {
          emailedTo.push(recipient);
        }
      } catch (e) {
        console.warn("Support email skipped (non-fatal):", recipient, e);
      }
    }
    const emailed = emailedTo.length > 0;

    return new Response(JSON.stringify({ id: inserted.id, emailed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("support-escalate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
