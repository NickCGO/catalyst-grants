// supabase/functions/ingest-funder-form/index.ts
// ---------------------------------------------------------------------------
// Ingest a funder's application form(s) into structured data.
//
// Handles the two real-world cases we calibrated on:
//   1. AUTO path  (e.g. German Embassy Micro-Project): one or more public PDFs
//      or text pages -> merged -> full structured form extracted.
//   2. ASSISTED path (e.g. Agency Fund): the questions live behind a JS embed
//      (Airtable, Submittable, portal). We still capture funder + form metadata
//      from the landing page / CFP, mark auto_extractable=false, and flag it for
//      a human to paste the question set. We do NOT log in or bypass any gate.
//
// Everything is written verified=false. Nothing shows to NGOs until a human ticks verified.
//
// Auth: writes funder REFERENCE data, so restrict to platform staff. Wire
//       assertPlatformAdmin() to your existing admin/role check before shipping.
// ---------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
// Keep this in step with your claude-generate model.
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-5";

const supa = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ---- helpers --------------------------------------------------------------

function stripHtml(html: string): string {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|li|h[1-6]|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&");
  return s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

// Detect JS-rendered application embeds we cannot read from HTML.
function detectEmbeddedForm(text: string, rawHtml: string): string | null {
  const patterns: [RegExp, string][] = [
    [/airtable\.com\/embed/i, "Airtable"],
    [/submittable\.com/i, "Submittable"],
    [/typeform\.com/i, "Typeform"],
    [/jotform\.com/i, "JotForm"],
    [/docs\.google\.com\/forms/i, "Google Forms"],
    [/formstack|wufoo|cognitoforms|surveymonkey/i, "third-party form host"],
  ];
  for (const [re, name] of patterns) {
    if (re.test(rawHtml) || re.test(text)) return name;
  }
  return null;
}

// Build Anthropic content blocks from a source (URL or base64 PDF).
async function buildSourceBlock(src: { type: string; value: string; filename?: string }) {
  if (src.type === "pdf_base64") {
    return {
      block: { type: "document", source: { type: "base64", media_type: "application/pdf", data: src.value } },
      embedHost: null as string | null,
      note: `PDF: ${src.filename ?? "document"}`,
    };
  }
  if (src.type === "text") {
    return { block: { type: "text", text: src.value }, embedHost: null, note: "pasted text" };
  }
  // type === "url"
  const res = await fetch(src.value);
  const ctype = res.headers.get("content-type") ?? "";
  if (ctype.includes("application/pdf")) {
    const buf = new Uint8Array(await res.arrayBuffer());
    return {
      block: { type: "document", source: { type: "base64", media_type: "application/pdf", data: bytesToBase64(buf) } },
      embedHost: null,
      note: `PDF fetched from ${src.value}`,
    };
  }
  const rawHtml = await res.text();
  const text = stripHtml(rawHtml);
  const embedHost = detectEmbeddedForm(text, rawHtml);
  return { block: { type: "text", text: `Page: ${src.value}\n\n${text}` }, embedHost, note: `web page ${src.value}` };
}

const SYSTEM_PROMPT = `You extract funder application forms into strict JSON for a grants platform.
You are given one or more source documents for a SINGLE funder (guidelines, the application form, budget templates, a web page). MERGE them into one result.

Return ONLY valid JSON, no markdown fence, with exactly this shape:
{
  "funder": { "donor_name": "", "category": "", "geographical_area": "", "grant_size_range": "", "deadlines": "", "method_of_approach": "", "priorities": "", "eligibility": "", "exclusions": "", "notes": "" },
  "funder_form": { "title": "", "submission_method": "portal|email|pdf_upload", "submission_url": "", "required_attachments": [ { "name": "", "required": true, "condition": "" } ] },
  "form_questions": [ { "order_index": 1, "section": "", "question": "", "answer_type": "short_text|long_text|number|date|boolean|select|attachment", "options": [], "word_limit": null, "char_limit": null, "required": true, "guidance": "" } ],
  "extraction_meta": { "auto_extractable": true, "confidence": "high|medium|low", "needs_review": [] }
}

Rules:
- Extract questions verbatim in document order. Do not invent questions.
- Capture real limits (word/character) and correct answer_type (yes/no => boolean).
- Pull eligibility, exclusions, deadlines, grant size, and required attachments from the guidelines even if they are in a different document than the form.
- If the actual questions are NOT present because they sit behind an online form/portal/embed, set auto_extractable=false, leave form_questions as [], still fill funder + funder_form metadata you can see, and add a needs_review note naming the host.
- Put anything ambiguous or unusual into needs_review with the order_index.
- Leave a field as "" or null rather than guessing.`;

// ---- handler --------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // TODO: wire to your existing admin/role check. Fail closed.
    // await assertPlatformAdmin(req);

    const { funder_id, sources } = await req.json();
    if (!funder_id || !Array.isArray(sources) || sources.length === 0) {
      return json({ error: "funder_id and a non-empty sources[] are required" }, 400);
    }

    // Build content blocks from every source (multi-document merge).
    const built = [];
    for (const s of sources) built.push(await buildSourceBlock(s));
    const embedHost = built.map((b) => b.embedHost).find(Boolean) ?? null;

    const content: any[] = [
      { type: "text", text: `Extract and merge the following ${built.length} source(s) for one funder.` },
      ...built.map((b) => b.block),
    ];
    if (embedHost) {
      content.push({ type: "text", text: `NOTE: an embedded ${embedHost} form was detected on a page. Its fields are not in the provided text. Set auto_extractable=false and flag it.` });
    }

    // Extraction call.
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });
    const data = await r.json();
    const raw = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return json({ error: "Model did not return valid JSON", raw }, 502);
    }

    // Persist. Everything verified=false.
    // 1) update funder reference fields (only non-empty ones).
    const f = parsed.funder ?? {};
    const funderPatch: Record<string, any> = {};
    for (const k of ["category", "geographical_area", "grant_size_range", "deadlines", "method_of_approach", "priorities", "eligibility", "exclusions", "notes"]) {
      if (f[k]) funderPatch[k] = f[k];
    }
    if (Object.keys(funderPatch).length) await supa.from("funders").update(funderPatch).eq("id", funder_id);

    // 2) upsert the funder_form (one live form per funder for now).
    const ff = parsed.funder_form ?? {};
    const { data: formRow, error: formErr } = await supa
      .from("funder_forms")
      .insert({
        funder_id,
        title: ff.title ?? null,
        submission_method: ff.submission_method ?? null,
        submission_url: ff.submission_url ?? null,
        required_attachments: ff.required_attachments ?? [],
        source: embedHost ? "assisted_pending" : "ingest",
        source_url: sources.find((s: any) => s.type === "url")?.value ?? null,
        verified: false,
      })
      .select("id")
      .single();
    if (formErr) return json({ error: "funder_forms insert failed", detail: formErr.message }, 500);

    // 3) insert questions (skipped automatically on the assisted path).
    const qs = Array.isArray(parsed.form_questions) ? parsed.form_questions : [];
    if (qs.length) {
      const rows = qs.map((q: any, i: number) => ({
        form_id: formRow.id,
        order_index: q.order_index ?? i + 1,
        question: q.question,
        guidance: q.guidance ?? null,
        answer_type: q.answer_type ?? "long_text",
        options: q.options ?? null,
        word_limit: q.word_limit ?? null,
        char_limit: q.char_limit ?? null,
        required: q.required ?? true,
      }));
      const { error: qErr } = await supa.from("form_questions").insert(rows);
      if (qErr) return json({ error: "form_questions insert failed", detail: qErr.message }, 500);
    }

    return json({
      ok: true,
      form_id: formRow.id,
      auto_extractable: parsed.extraction_meta?.auto_extractable ?? qs.length > 0,
      questions_extracted: qs.length,
      route: embedHost ? `assisted (${embedHost})` : "auto",
      extraction: parsed, // return the full object for the review screen
    });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
