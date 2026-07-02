import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callAI(messages: Message[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-generate", {
    body: { messages, stream: false },
  });
  if (error) throw new Error(error.message || "AI request failed");
  if (data?.error) throw new Error(data.error);
  return data?.choices?.[0]?.message?.content || "";
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
  const { data, error } = await supabase.functions.invoke("ai-generate", {
    body: { messages, stream: true },
  });
  if (error) throw new Error(error.message || "Failed to start AI stream");

  // invoke may return a ReadableStream, a Blob, or a string depending on runtime.
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  if (data instanceof ReadableStream) {
    reader = data.getReader();
  } else if (data instanceof Blob) {
    reader = data.stream().getReader();
  } else if (typeof data === "string") {
    processChunk(data, onDelta, onDone);
    return;
  } else if (data?.choices?.[0]?.message?.content) {
    onDelta(data.choices[0].message.content);
    onDone();
    return;
  } else {
    throw new Error("Unexpected AI stream response");
  }

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

function processChunk(text: string, onDelta: (t: string) => void, onDone: () => void) {
  for (const rawLine of text.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line.startsWith("data: ")) continue;
    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") { onDone(); return; }
    try {
      const parsed = JSON.parse(jsonStr);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) onDelta(content);
    } catch { /* skip */ }
  }
  onDone();
}
