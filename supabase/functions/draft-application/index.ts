// supabase/functions/draft-application/index.ts
// ---------------------------------------------------------------------------
// Draft every answer for one application in a single batched call.
//   input:  { application_id }
//   does:   loads funder form + questions, org profile, org answer_library,
//           asks Claude to draft each answer grounded ONLY in the org's real
//           content and tailored to this funder, within each question's limit.
//   writes: application_answers (status 'ai_drafted'), one per question.
//   returns the drafted answers for the UI.
//
// Grounding rule: never invent specific figures/dates. Where a required fact is
// missing, it drafts around it and marks needs_input so a human fills the gap.
// ---------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-5";

const supa = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function orgBlock(o: any) {
  const p: string[] = [];
  if (o?.name) p.push(`Organisation: ${o.name}`);
  if (o?.country || o?.region) p.push(`Based in: ${[o.region, o.country].filter(Boolean).join(", ")}`);
  if (o?.mission_statement) p.push(`Mission: ${o.mission_statement}`);
  if (o?.focus_areas?.length) p.push(`Focus areas: ${o.focus_areas.join(", ")}`);
  if (o?.programmes?.length) p.push(`Programmes: ${o.programmes.join(", ")}`);
  if (o?.founded_year) p.push(`Founded: ${o.founded_year}`);
  if (o?.org_size) p.push(`Size: ${o.org_size}`);
  return p.join("\n") || "Organisation profile not provided.";
}

function funderBlock(f: any) {
  if (!f) return "Funder details not provided.";
  const p: string[] = [`Funder: ${f.donor_name}`];
  if (f.funder_focus) p.push(`What they fund: ${f.funder_focus}`);
  if (f.priorities) p.push(`Priorities: ${f.priorities}`);
  if (f.eligibility) p.push(`Eligibility: ${f.eligibility}`);
  if (f.exclusions) p.push(`Exclusions: ${f.exclusions}`);
  if (f.grant_size_range) p.push(`Grant size: ${f.grant_size_range}`);
  if (f.geographical_area) p.push(`Geography: ${f.geographical_area}`);
  return p.join("\n");
}

function libraryBlock(entries: any[]) {
  if (!entries?.length) return "The organisation has no saved answer-library entries yet. Draft from the profile above and mark gaps.";
  return entries.slice(0, 40).map((e) =>
    `[${e.id}] ${e.label}${e.tags?.length ? ` (tags: ${e.tags.join(", ")})` : ""}:\n${(e.content || "").slice(0, 1500)}`
  ).join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { application_id } = await req.json();
    if (!application_id) return json({ error: "application_id is required" }, 400);

    const { data: app } = await supa.from("applications")
      .select("id, org_id, funder_id").eq("id", application_id).maybeSingle();
    if (!app) return json({ error: "application not found" }, 404);

    const [{ data: org }, { data: funder }, { data: form }, { data: library }] = await Promise.all([
      supa.from("organisations").select("*").eq("id", app.org_id).maybeSingle(),
      supa.from("funders").select("*").eq("id", app.funder_id).maybeSingle(),
      supa.from("funder_forms").select("id").eq("funder_id", app.funder_id)
        .order("verified", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supa.from("answer_library").select("id, label, content, tags").eq("org_id", app.org_id),
    ]);

    if (!form) return json({ error: "no funder_form for this funder yet — ingest/verify one first" }, 400);

    const { data: questions } = await supa.from("form_questions")
      .select("id, order_index, section, question, answer_type, word_limit, char_limit, guidance")
      .eq("form_id", form.id).order("order_index");
    if (!questions?.length) return json({ error: "form has no questions" }, 400);

    const system = `You help an NGO complete a funder's application form.
Write each answer in first person plural ("we", "our organisation"), grounded ONLY in the organisation's real profile and answer-library below. Tailor every answer to THIS funder's priorities and eligibility.
Never invent specific figures, dates, or names. If a required specific is missing, draft around it and put a short marker like «add: exact figure» at that spot, and set needs_input true for that question.
Respect each question's word_limit or char_limit. For boolean questions answer "Yes" or "No" with a one-line justification only if useful.

ORGANISATION
${orgBlock(org)}

FUNDER
${funderBlock(funder)}

ANSWER LIBRARY (reusable content; cite the [id] you draw from in sourced_from)
${libraryBlock(library || [])}`;

    const compactQs = questions.map((q) => ({
      question_id: q.id, order_index: q.order_index, section: q.section,
      question: q.question, answer_type: q.answer_type,
      word_limit: q.word_limit, char_limit: q.char_limit, guidance: q.guidance,
    }));

    const userPrompt = `Draft an answer for every question below. Return ONLY valid JSON, no fence:
{ "answers": [ { "question_id": "", "answer": "", "sourced_from": null, "needs_input": false } ] }

Questions:
${JSON.stringify(compactQs, null, 2)}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 8000, system, messages: [{ role: "user", content: userPrompt }] }),
    });
    const data = await r.json();
    const raw = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
    let parsed: any;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch { return json({ error: "model did not return valid JSON", raw }, 502); }

    const answers = Array.isArray(parsed.answers) ? parsed.answers : [];
    const rows = answers.map((a: any) => ({
      application_id,
      question_id: a.question_id,
      answer: a.answer ?? "",
      status: "ai_drafted",
      word_count: (a.answer ?? "").trim().split(/\s+/).filter(Boolean).length,
      sourced_from: a.sourced_from || null,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length) {
      const { error } = await supa.from("application_answers")
        .upsert(rows, { onConflict: "application_id,question_id" });
      if (error) return json({ error: "saving answers failed", detail: error.message }, 500);
    }

    return json({ ok: true, drafted: rows.length, answers });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}
