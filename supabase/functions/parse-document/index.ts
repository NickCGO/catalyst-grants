import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked conversion to avoid stack overflow on large files
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

function stripHtml(html: string): string {
  // Remove scripts/styles, then tags, decode basic entities, collapse whitespace
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
              .replace(/<style[\s\S]*?<\/style>/gi, " ")
              .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
              .replace(/<!--[\s\S]*?-->/g, " ")
              .replace(/<\/(p|div|section|article|li|h[1-6]|br|tr)>/gi, "\n")
              .replace(/<br\s*\/?\s*>/gi, "\n")
              .replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;/gi, " ")
       .replace(/&amp;/gi, "&")
       .replace(/&lt;/gi, "<")
       .replace(/&gt;/gi, ">")
       .replace(/&quot;/gi, '"')
       .replace(/&#39;/gi, "'");
  return s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let textContent = "";
    let sourceLabel = "document";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // URL mode
      const { url } = await req.json();
      if (!url || typeof url !== "string") throw new Error("No url provided");
      sourceLabel = url;
      const pageResp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FindTheGrantBot/1.0)" },
        redirect: "follow",
      });
      if (!pageResp.ok) throw new Error(`Failed to fetch URL (${pageResp.status})`);
      const ct = pageResp.headers.get("content-type") || "";
      if (ct.includes("text/html") || ct.includes("application/xhtml")) {
        textContent = stripHtml(await pageResp.text());
      } else if (ct.includes("text/")) {
        textContent = await pageResp.text();
      } else {
        throw new Error(`Unsupported URL content type: ${ct}. Please upload the file directly.`);
      }
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) throw new Error("No file provided");
      sourceLabel = file.name;

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".txt") || fileName.endsWith(".csv") || fileName.endsWith(".md") || fileName.endsWith(".html") || fileName.endsWith(".htm")) {
        const raw = new TextDecoder().decode(bytes);
        textContent = (fileName.endsWith(".html") || fileName.endsWith(".htm")) ? stripHtml(raw) : raw;
      } else {
        const base64 = bytesToBase64(bytes);
        const extractResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a document parser. Extract ALL text content from the provided document. Return the raw text content only, preserving structure with newlines. Do not add any commentary." },
              { role: "user", content: [
                { type: "text", text: `Extract all text from this ${fileName.endsWith(".pdf") ? "PDF" : "document"} file:` },
                { type: "image_url", image_url: { url: `data:${file.type || "application/octet-stream"};base64,${base64}` } },
              ]},
            ],
            stream: false,
          }),
        });

        if (!extractResp.ok) {
          const errText = await extractResp.text();
          console.error("Extract error:", extractResp.status, errText);
          throw new Error("Failed to extract text from document");
        }
        const extractData = await extractResp.json();
        textContent = extractData.choices?.[0]?.message?.content || "";
      }
    }

    if (!textContent || textContent.length < 50) {
      throw new Error("Could not extract sufficient text. Please try a different file or URL.");
    }

    const truncated = textContent.slice(0, 15000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting NGO/nonprofit organisational data from annual reports, organisational documents and websites. Extract as much relevant information as possible. Return a JSON object with these fields (use null for anything not found):

{
  "org_name": "string",
  "trading_name": "string",
  "org_type": "NPC|NPO|Trust|Section 21|CBO|Other",
  "registration_number": "string",
  "country": "string",
  "region": "string", 
  "founded_year": number,
  "tax_status": "string",
  "pbo_number": "string",
  "physical_address": "string",
  "mission_statement": "string",
  "vision_statement": "string",
  "core_values": ["string"],
  "problem_statement": "string (200 words max)",
  "focus_areas": ["children","youth","education_ecd","health_aids_sexual_reproductive","women_gender_dv_girls","community_development","poverty_livelihood","environment_conservation","arts_culture","disability","aged_elderly","human_rights_advocacy","capacity_building_governance","entrepreneur_skills_vocational"],
  "beneficiary_groups": ["children_0_12","youth_13_24","women_girls","elderly","pwd","refugees","lgbtqi","community","animals","environment"],
  "annual_beneficiary_reach": number,
  "primary_target_group": "string",
  "programmes": [{"name":"string","description":"string"}],
  "annual_budget": number,
  "ceo_name": "string",
  "fte_count": number,
  "volunteer_count": number,
  "board_count": number,
  "sdgs": [number],
  "theory_of_change": "string",
  "impact_statement": "string",
  "key_outcomes": ["string"],
  "past_funders": ["string"],
  "achievements": ["string"],
  "is_audited": boolean,
  "website": "string"
}

Only include fields you can confidently extract. Return ONLY valid JSON, no markdown code blocks.`,
          },
          { role: "user", content: `Extract NGO profile data from this content (source: ${sourceLabel}):\n\n${truncated}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const jsonStr = (jsonMatch[1]?.trim() || content.trim());

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Could not parse extracted data. Please try again.");
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
