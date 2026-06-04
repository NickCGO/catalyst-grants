import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/landing-chat`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const INITIAL_GREETING: Msg = {
  role: "assistant",
  content:
    "Hi 👋 I'm Find The Grant's assistant. Ask me anything about funder matching, proposals, pricing, or partnerships — or tap **Talk to a human** anytime.",
};

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escEmail, setEscEmail] = useState("");
  const [escName, setEscName] = useState("");
  const [escMessage, setEscMessage] = useState("");
  const [escSubmitting, setEscSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, escalateOpen]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setIsLoading(true);

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last !== INITIAL_GREETING && prev.length > next.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
        }
        return [...prev, { role: "assistant", content: acc }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (resp.status === 429) {
        toast({ title: "Slow down", description: "Too many requests, please wait a moment." });
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "Service unavailable", description: "AI credits exhausted. Please try the human handoff." });
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // If model signalled escalation, open the form automatically
      if (acc.includes("[ESCALATE]")) {
        const cleaned = acc.replace(/\[ESCALATE\]\s*/g, "").trimEnd();
        setMessages((prev) =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: cleaned } : m)),
        );
        setEscMessage(text);
        setTimeout(() => setEscalateOpen(true), 300);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Chat error", description: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const submitEscalation = async () => {
    if (!escEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(escEmail)) {
      toast({ title: "Email needed", description: "Please enter a valid email." });
      return;
    }
    if (!escMessage.trim()) {
      toast({ title: "Message needed", description: "Please share what you'd like help with." });
      return;
    }
    setEscSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("support-escalate", {
        body: {
          email: escEmail.trim(),
          name: escName.trim() || null,
          message: escMessage.trim(),
          conversation: messages,
          page_url: typeof window !== "undefined" ? window.location.href : null,
        },
      });
      if (error) throw error;
      setEscalateOpen(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Thanks ${escName || "there"} — a human will reach out to **${escEmail}** shortly. We respond within 1 business day.`,
        },
      ]);
      setEscEmail("");
      setEscName("");
      setEscMessage("");
      toast({ title: "Sent ✓", description: "Our team will be in touch soon." });
    } catch (e) {
      console.error(e);
      toast({ title: "Couldn't send", description: "Please try again in a moment." });
    } finally {
      setEscSubmitting(false);
    }
  };

  const renderContent = (text: string) => {
    // Light markdown: bold + line breaks
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={i}>{p.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 px-4 py-3 hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:inline">Need help?</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 max-w-md flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden h-[560px] max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">Find The Grant Assistant</div>
                <div className="text-[10px] opacity-80">Usually replies instantly</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="opacity-80 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-background">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {renderContent(m.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> thinking…
                </div>
              </div>
            )}

            {/* Escalation form inline */}
            {escalateOpen && (
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <LifeBuoy className="h-4 w-4 text-primary" /> Talk to a human
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave your details and our team will follow up within 1 business day.
                </p>
                <Input
                  placeholder="Your name (optional)"
                  value={escName}
                  onChange={(e) => setEscName(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={escEmail}
                  onChange={(e) => setEscEmail(e.target.value)}
                  className="text-sm"
                />
                <Textarea
                  placeholder="What can we help with? *"
                  value={escMessage}
                  onChange={(e) => setEscMessage(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEscalateOpen(false)} disabled={escSubmitting}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={submitEscalation} disabled={escSubmitting}>
                    {escSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Send"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer / input */}
          <div className="border-t border-border bg-card p-2 space-y-2">
            {!escalateOpen && (
              <button
                onClick={() => {
                  setEscMessage(messages.filter((m) => m.role === "user").slice(-1)[0]?.content || "");
                  setEscalateOpen(true);
                }}
                className="w-full text-xs text-primary hover:underline flex items-center justify-center gap-1"
              >
                <LifeBuoy className="h-3 w-3" /> Talk to a human
              </button>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type your message…"
                disabled={isLoading}
                className="text-sm"
              />
              <Button size="icon" onClick={send} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
