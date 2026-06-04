// Client helper for the Claude 3.5 Sonnet edge function (claude-generate).
// The edge function pulls org + funder context server-side from IDs and returns
// OpenAI-compatible response shapes (so streaming + JSON callers work identically).
import { supabase } from "@/integrations/supabase/client";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-generate`;

export interface ClaudePayload {
  org_id?: string | null;
  funder_id?: string | null;
  mode: "section" | "all" | "form_prep" | "score" | "freeform";
  section_key?: string;
  section_label?: string;
  section_target?: number;
  section_keys?: string[];
  format?: string;
  current_content?: string;
  extra_instructions?: string;
  messages?: Array<{ role: string; content: string }>;
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function callClaude(payload: ClaudePayload): Promise<string> {
  const resp = await fetch(URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ ...payload, stream: false }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Claude request failed" }));
    throw new Error(err.error || `Claude error: ${resp.status}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function callClaudeJSON<T>(payload: ClaudePayload): Promise<T> {
  const content = await callClaude(payload);
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (match ? match[1] : content).trim();
  return JSON.parse(raw);
}

export async function streamClaude(
  payload: ClaudePayload,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const resp = await fetch(URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ ...payload, stream: true }),
  });
  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({ error: "Claude stream failed" }));
    throw new Error(err.error || `Claude error: ${resp.status}`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* partial */ }
    }
  }
  onDone();
}
