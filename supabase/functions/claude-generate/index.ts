// Claude 3.5 Sonnet generation with rich NGO + funder context.
// Accepts { org_id, funder_id, mode, section_key?, section_label?, section_target?,
//           format?, current_content?, extra_instructions?, stream? }
// Returns OpenAI-compatible response shape (so existing callers keep working).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-3-5-sonnet-20241022";

function buildFormatInstruction(format: string, mode: string) {
  if (mode === "form_prep") {
    return "You are preparing short, copy-paste-ready answers for an NGO to paste into the funder's online application form. Each answer is self-contained and concise.";
  }
  if (mode === "score") {
    return "You are a senior grants reviewer scoring a proposal against the funder's stated priorities. Be specific and honest, never generic.";
  }
  if (format === "loe") {
    return "You are drafting a Letter of Enquiry (LOE): a brief professional letter, ~700-900 words total. Warm, concise, evidence-led. Not a full proposal.";
  }
  if (format === "concept_note") {
    return "You are drafting a Concept Note (~1,000-1,500 words total). More detailed than an LOE, less than a full proposal.";
  }
  return "You are a senior grant proposal writer for African NGOs. Write in a professional, compelling, evidence-based style with specific numbers, dates, and concrete outcomes wherever possible.";
}

function buildOrgBlock(org: any, programmes: any[], applications: any[]) {
  if (!org) return "Organisation profile: (not provided).";
  const parts: string[] = [];
  parts.push(`Organisation: ${org.name}`);
  if (org.legal_name && org.legal_name !== org.name) parts.push(`Legal name: ${org.legal_name}`);
  if (org.org_type) parts.push(`Type: ${org.org_type}`);
  if (org.year_founded) parts.push(`Founded: ${org.year_founded}`);
  if (org.country) parts.push(`Country: ${org.country}`);
  if (org.region) parts.push(`Region: ${org.region}`);
  if (org.staff_count) parts.push(`Staff: ${org.staff_count}`);
  if (org.annual_budget_usd) parts.push(`Annual budget: USD ${org.annual_budget_usd.toLocaleString?.() || org.annual_budget_usd}`);
  if (org.mission_statement) parts.push(`Mission: ${org.mission_statement}`);
  if (org.vision_statement) parts.push(`Vision: ${org.vision_statement}`);
  if (Array.isArray(org.focus_areas) && org.focus_areas.length) parts.push(`Focus areas: ${org.focus_areas.join(", ")}`);
  if (Array.isArray(org.beneficiary_groups) && org.beneficiary_groups.length) parts.push(`Beneficiaries: ${org.beneficiary_groups.join(", ")}`);
  if (Array.isArray(org.sdgs) && org.sdgs.length) parts.push(`SDGs: ${org.sdgs.join(", ")}`);
  if (org.geographic_scope) parts.push(`Geographic scope: ${org.geographic_scope}`);
  if (org.key_achievements) parts.push(`Key achievements: ${org.key_achievements}`);
  if (org.beneficiaries_reached) parts.push(`Beneficiaries reached to date: ${org.beneficiaries_reached}`);
  if (org.theory_of_change) parts.push(`Theory of change: ${org.theory_of_change}`);

  if (programmes?.length) {
    const p = programmes.slice(0, 6).map((x) => `- ${x.name}${x.description ? `: ${x.description}` : ""}`).join("\n");
    parts.push(`Active programmes:\n${p}`);
  }
  if (applications?.length) {
    const a = applications.slice(0, 5).map((x) => `- ${x.funder_name || "Funder"} · ${x.status || "submitted"}${x.amount_requested_usd ? ` · USD ${x.amount_requested_usd}` : ""}`).join("\n");
    parts.push(`Recent grant history:\n${a}`);
  }
  return parts.join("\n");
}

function buildFunderBlock(funder: any) {
  if (!funder) return "Funder: (not provided — write a generic high-quality draft and flag where funder specifics are needed).";
  const p: string[] = [];
  p.push(`Funder: ${funder.donor_name}`);
  if (funder.category) p.push(`Category: ${funder.category}`);
  if (funder.funder_focus) p.push(`What they fund: ${funder.funder_focus}`);
  if (funder.geographical_area) p.push(`Geography: ${funder.geographical_area}`);
  if (funder.grant_size_range) p.push(`Typical grant size: ${funder.grant_size_range}`);
  if (funder.average_grant_size) p.push(`Avg grant: ${funder.average_grant_size}`);
  if (funder.method_of_approach) p.push(`How to apply: ${funder.method_of_approach}`);
  if (funder.deadlines) p.push(`Deadlines: ${funder.deadlines}`);
  if (funder.eligibility) p.push(`Eligibility: ${funder.eligibility}`);
  if (funder.priorities) p.push(`Priorities: ${funder.priorities}`);
  if (funder.exclusions) p.push(`Exclusions: ${funder.exclusions}`);
  if (funder.notes) p.push(`Notes: ${funder.notes}`);
  return p.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      org_id,
      funder_id,
      mode = "section", // section | all | form_prep | score | freeform
      section_key,
      section_label,
      section_target,
      format = "full_proposal",
      current_content,
      extra_instructions,
      messages: clientMessages, // optional pass-through for freeform
      stream: shouldStream = false,
    } = body;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supaUrl, supaKey);

    // Fetch context server-side
    let org: any = null;
    let programmes: any[] = [];
    let applications: any[] = [];
    let funder: any = null;
    if (org_id) {
      const [{ data: o }, { data: progs }, { data: apps }] = await Promise.all([
        supa.from("organisations").select("*").eq("id", org_id).maybeSingle(),
        supa.from("programmes").select("name,description").eq("org_id", org_id).limit(10).then((r) => r).catch(() => ({ data: [] })),
        supa.from("applications").select("status,amount_requested_usd,funders(donor_name)").eq("org_id", org_id).order("created_at", { ascending: false }).limit(8),
      ]);
      org = o;
      programmes = progs || [];
      applications = (apps || []).map((a: any) => ({ ...a, funder_name: a.funders?.donor_name }));
    }
    if (funder_id) {
      const { data: f } = await supa.from("funders").select("*").eq("id", funder_id).maybeSingle();
      funder = f;
    }

    const orgBlock = buildOrgBlock(org, programmes, applications);
    const funderBlock = buildFunderBlock(funder);
    const system = `${buildFormatInstruction(format, mode)}

Write in first person plural ("we", "our organisation"). Never use placeholders like [INSERT X] or [TBD]. If a specific number isn't provided, use a realistic, conservative estimate grounded in the organisation's profile and call it out clearly. Tailor every sentence to this specific funder's stated priorities and the NGO's actual programmes — do not produce generic copy.

=== NGO PROFILE ===
${orgBlock}

=== FUNDER PROFILE ===
${funderBlock}`;

    let userPrompt = "";
    if (mode === "section") {
      userPrompt = `Write the "${section_label}" section of a ${format.replace("_", " ")} (~${section_target || 300} words). Return ONLY the section prose, no headings, no preamble.${current_content ? `\n\nThe current draft is below — improve or replace it as needed:\n${current_content}` : ""}${extra_instructions ? `\n\nAdditional guidance: ${extra_instructions}` : ""}`;
    } else if (mode === "all") {
      const keys: string[] = body.section_keys || [];
      userPrompt = `Generate a complete ${format.replace("_", " ")} as a single JSON object with these keys: ${keys.join(", ")}. Each value is the prose for that section. Return ONLY valid JSON, no markdown fence.`;
    } else if (mode === "form_prep") {
      userPrompt = `Generate short, copy-paste answers as a single JSON object with these keys: org_overview, mission, problem, project_description, objectives, beneficiaries, outcomes, methodology, mne, budget_narrative, sustainability, capacity. Use real numbers grounded in the NGO profile. Return ONLY valid JSON.`;
    } else if (mode === "score") {
      userPrompt = `Score this proposal against the funder's priorities and return ONLY valid JSON with this exact shape: { "overall_score": <0-100>, "executive_summary_score": <0-100>, "problem_statement_score": <0-100>, "objectives_score": <0-100>, "methodology_score": <0-100>, "impact_score": <0-100>, "budget_score": <0-100>, "organisation_score": <0-100>, "strengths": ["..."], "improvements": [{"section":"...","issue":"...","suggestion":"..."}], "funder_alignment_note": "..." }\n\nProposal:\n${current_content || ""}`;
    } else if (clientMessages?.length) {
      userPrompt = clientMessages.map((m: any) => `[${m.role}] ${m.content}`).join("\n\n");
    }

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: userPrompt }],
        stream: shouldStream,
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      console.error("Anthropic error", anthropicResp.status, errText);
      const status = anthropicResp.status === 429 ? 429 : anthropicResp.status === 401 ? 401 : 500;
      return new Response(JSON.stringify({ error: `Claude error (${anthropicResp.status}): ${errText.slice(0, 300)}` }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shouldStream) {
      const data = await anthropicResp.json();
      const text = data?.content?.[0]?.text || "";
      return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-stream as OpenAI-compatible SSE
    const reader = anthropicResp.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const out = new ReadableStream({
      async start(controller) {
        let buf = "";
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let nl;
            while ((nl = buf.indexOf("\n")) !== -1) {
              const line = buf.slice(0, nl).trimEnd();
              buf = buf.slice(nl + 1);
              if (!line.startsWith("data:")) continue;
              const json = line.slice(5).trim();
              if (!json) continue;
              try {
                const evt = JSON.parse(json);
                if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                  const payload = { choices: [{ delta: { content: evt.delta.text } }] };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
                } else if (evt.type === "message_stop") {
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                }
              } catch { /* ignore */ }
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(out, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("claude-generate error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
