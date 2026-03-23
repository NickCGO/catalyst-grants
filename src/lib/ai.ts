import { supabase } from "@/integrations/supabase/client";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`;

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callAI(messages: Message[]): Promise<string> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, stream: false }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "AI request failed" }));
    throw new Error(err.error || `AI error: ${resp.status}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function callAIJSON<T>(messages: Message[]): Promise<T> {
  const content = await callAI(messages);
  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
  const jsonStr = jsonMatch[1]?.trim() || content.trim();
  return JSON.parse(jsonStr);
}

export async function streamAI(
  messages: Message[],
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, stream: true }),
  });

  if (!resp.ok || !resp.body) throw new Error("Failed to start AI stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* partial JSON, skip */ }
    }
  }
  onDone();
}
