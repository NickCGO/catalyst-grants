// Public webhook receiver for inbound emails.
// Wire your inbound-email provider (Postmark, SendGrid Inbound Parse,
// CloudMailin, AWS SES → Lambda, etc.) at this URL:
//   https://<project>.supabase.co/functions/v1/inbound-email
//
// We accept any JSON body and extract the recipient, sender, subject and bodies
// using common field names from Postmark, SendGrid, and CloudMailin.

import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "@supabase/supabase-js/cors";

interface NormalizedEmail {
  to: string;
  from: string;
  fromName?: string;
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  messageId?: string;
  inReplyTo?: string;
}

function pickEmail(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    const m = value.match(/<([^>]+)>/);
    return (m ? m[1] : value).trim().toLowerCase();
  }
  if (Array.isArray(value) && value.length > 0) return pickEmail(value[0]);
  if (typeof value === "object") {
    // Postmark style { Email: "x@y" } or SendGrid style { email: "x@y" }
    const obj = value as Record<string, unknown>;
    return pickEmail(obj.Email ?? obj.email ?? obj.address);
  }
  return undefined;
}

function normalizePayload(body: any): NormalizedEmail | null {
  // Postmark
  if (body.From && body.To) {
    return {
      to: pickEmail(body.To) ?? "",
      from: pickEmail(body.From) ?? "",
      fromName: body.FromName,
      subject: body.Subject,
      bodyText: body.TextBody,
      bodyHtml: body.HtmlBody,
      messageId: body.MessageID,
      inReplyTo: body.Headers?.find((h: any) => h?.Name === "In-Reply-To")?.Value,
    };
  }
  // SendGrid Inbound Parse
  if (body.envelope || (body.from && body.to && body.text)) {
    return {
      to: pickEmail(body.to) ?? "",
      from: pickEmail(body.from) ?? "",
      subject: body.subject,
      bodyText: body.text,
      bodyHtml: body.html,
      messageId: body["message-id"],
      inReplyTo: body["in-reply-to"],
    };
  }
  // CloudMailin
  if (body.headers && body.envelope) {
    return {
      to: pickEmail(body.envelope.to) ?? "",
      from: pickEmail(body.envelope.from) ?? "",
      subject: body.headers.Subject,
      bodyText: body.plain,
      bodyHtml: body.html,
      messageId: body.headers["Message-ID"],
      inReplyTo: body.headers["In-Reply-To"],
    };
  }
  // Generic
  if (body.to && body.from) {
    return {
      to: pickEmail(body.to) ?? "",
      from: pickEmail(body.from) ?? "",
      subject: body.subject,
      bodyText: body.text ?? body.body,
      bodyHtml: body.html,
      messageId: body.message_id,
      inReplyTo: body.in_reply_to,
    };
  }
  return null;
}

function extractToken(toAddress: string): string | null {
  // Match acme-x7k2@inbox.<anything>
  const local = toAddress.split("@")[0];
  if (!local) return null;
  return local.toLowerCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const normalized = normalizePayload(body);
  if (!normalized || !normalized.to || !normalized.from) {
    return new Response(JSON.stringify({ error: "Could not parse inbound email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = extractToken(normalized.to);
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing mailbox token" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Find org by mailbox token
  const { data: org, error: orgErr } = await supabase
    .from("organisations")
    .select("id")
    .eq("inbound_mailbox_token", token)
    .maybeSingle();

  if (orgErr) {
    console.error("Org lookup error:", orgErr);
    return new Response(JSON.stringify({ error: "Org lookup failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!org) {
    // Drop silently with 200 so the provider doesn't retry forever for unknown mailboxes
    return new Response(JSON.stringify({ ok: true, status: "unknown_mailbox" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Try to associate with a funder by sender email
  let funderId: string | null = null;
  let relationshipId: string | null = null;
  const { data: matchingFunder } = await supabase
    .from("funders")
    .select("id")
    .ilike("email", normalized.from)
    .maybeSingle();
  if (matchingFunder) {
    funderId = matchingFunder.id;
    const { data: rel } = await supabase
      .from("funder_relationships")
      .select("id")
      .eq("org_id", org.id)
      .eq("funder_id", funderId)
      .maybeSingle();
    if (rel) {
      relationshipId = rel.id;
      // Bump health and stamp last_interaction
      await supabase
        .from("funder_relationships")
        .update({
          last_interaction_date: new Date().toISOString().slice(0, 10),
          relationship_status: "engaged",
        })
        .eq("id", rel.id);
    }
  }

  const { error: insertErr } = await supabase.from("inbound_emails").insert({
    org_id: org.id,
    funder_id: funderId,
    relationship_id: relationshipId,
    from_email: normalized.from,
    from_name: normalized.fromName ?? null,
    to_email: normalized.to,
    subject: normalized.subject ?? null,
    body_text: normalized.bodyText ?? null,
    body_html: normalized.bodyHtml ?? null,
    message_id: normalized.messageId ?? null,
    in_reply_to: normalized.inReplyTo ?? null,
    raw_payload: body,
  });
  if (insertErr) {
    console.error("Insert error:", insertErr);
    return new Response(JSON.stringify({ error: "Insert failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, org_id: org.id, funder_id: funderId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
