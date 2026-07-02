import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Save, Download, ArrowLeft, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  buildPacketText,
  copyPacketToClipboard,
  downloadPacketDocx,
  type PacketQuestion,
} from "@/lib/exportPacket";

type Question = {
  id: string;
  order_index: number;
  section?: string | null;
  question: string;
  guidance: string | null;
  answer_type: string;
  word_limit: number | null;
  char_limit: number | null;
  required: boolean;
};

const ApplicationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [orgName, setOrgName] = useState("");
  const [funderName, setFunderName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [projectName, setProjectName] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: app } = await supabase
      .from("applications")
      .select("id, org_id, funder_id, project_name")
      .eq("id", id)
      .maybeSingle();
    if (!app) {
      setLoading(false);
      return;
    }
    setProjectName(app.project_name || "");

    const [{ data: org }, { data: funder }, { data: form }] = await Promise.all([
      supabase.from("organisations").select("name").eq("id", app.org_id).maybeSingle(),
      app.funder_id
        ? supabase.from("funders").select("donor_name").eq("id", app.funder_id).maybeSingle()
        : Promise.resolve({ data: null }),
      app.funder_id
        ? supabase
            .from("funder_forms")
            .select("id, title, required_attachments")
            .eq("funder_id", app.funder_id)
            .order("verified", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    setOrgName(org?.name || "");
    setFunderName((funder as any)?.donor_name || "");
    setFormTitle((form as any)?.title || "");
    setAttachments(((form as any)?.required_attachments as any[]) || []);

    if (form?.id) {
      const { data: qs } = await supabase
        .from("form_questions")
        .select("id, order_index, question, guidance, answer_type, word_limit, char_limit, required, options")
        .eq("form_id", form.id)
        .order("order_index");
      setQuestions((qs as any) || []);

      const { data: ans } = await supabase
        .from("application_answers")
        .select("question_id, answer")
        .eq("application_id", id);
      const map: Record<string, string> = {};
      for (const a of ans || []) map[a.question_id] = a.answer || "";
      setAnswers(map);
    } else {
      setQuestions([]);
      setAnswers({});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Question[]>();
    for (const q of questions) {
      const sec = q.section || "Application";
      if (!groups.has(sec)) groups.set(sec, []);
      groups.get(sec)!.push(q);
    }
    return Array.from(groups.entries());
  }, [questions]);

  const packetQuestions: PacketQuestion[] = questions.map((q) => ({
    id: q.id,
    order_index: q.order_index,
    section: q.section ?? null,
    question: q.question,
    word_limit: q.word_limit,
    char_limit: q.char_limit,
  }));
  const packetAnswers = questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || "" }));
  const packetMeta = {
    orgName: orgName || "Our organisation",
    funderName: funderName || "Funder",
    formTitle: formTitle || projectName || "Application",
    attachments,
  };

  const draftAll = async () => {
    if (!id) return;
    setDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke("draft-application", {
        body: { application_id: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Draft ready", description: `Drafted ${(data as any)?.drafted ?? 0} answers.` });
      await load();
    } catch (e: any) {
      toast({ title: "Draft failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setDrafting(false);
    }
  };

  const saveAll = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const rows = questions.map((q) => ({
        application_id: id,
        question_id: q.id,
        answer: answers[q.id] || "",
        status: "human_edited",
        word_count: (answers[q.id] || "").trim().split(/\s+/).filter(Boolean).length,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("application_answers")
        .upsert(rows, { onConflict: "application_id,question_id" });
      if (error) throw error;
      toast({ title: "Saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onCopy = async () => {
    await copyPacketToClipboard(packetQuestions, packetAnswers, packetMeta);
    toast({ title: "Copied for portal" });
  };
  const onDownload = async () => {
    await downloadPacketDocx(packetQuestions, packetAnswers, packetMeta);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/applications")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{projectName || formTitle || "Application"}</h1>
              <p className="text-sm text-muted-foreground">
                {funderName ? `${funderName} • ` : ""}
                {questions.length} question{questions.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={draftAll} disabled={drafting || questions.length === 0}>
              <Sparkles className="h-4 w-4 mr-1" /> {drafting ? "Drafting…" : "Draft all answers"}
            </Button>
            <Button variant="outline" onClick={saveAll} disabled={saving || questions.length === 0}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={questions.length === 0}>
                  <Download className="h-4 w-4 mr-1" /> Export <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCopy}>Copy for portal</DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload}>Download Word</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {questions.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No application form is available for this funder yet. Once a form is ingested and verified,
              questions will appear here and you can draft answers with AI.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {grouped.map(([section, qs]) => (
              <div key={section} className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {section}
                </h2>
                {qs.map((q) => {
                  const limitLabel = q.word_limit
                    ? `${q.word_limit} words max`
                    : q.char_limit
                    ? `${q.char_limit} characters max`
                    : "";
                  const current = answers[q.id] || "";
                  const wc = current.trim().split(/\s+/).filter(Boolean).length;
                  return (
                    <GlassCard key={q.id} className="p-4 space-y-2">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-medium text-foreground">
                            {q.order_index}. {q.question}
                            {q.required && <span className="text-destructive ml-1">*</span>}
                          </p>
                          {limitLabel && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {limitLabel}
                            </span>
                          )}
                        </div>
                        {q.guidance && (
                          <p className="text-xs text-muted-foreground mt-1">{q.guidance}</p>
                        )}
                      </div>
                      <Textarea
                        value={current}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        rows={Math.max(4, Math.min(14, Math.ceil(current.length / 90)))}
                        placeholder="Draft or write your answer…"
                      />
                      <div className="flex justify-end text-[10px] text-muted-foreground">
                        {wc} word{wc === 1 ? "" : "s"}
                        {q.word_limit && ` / ${q.word_limit}`}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            ))}

            {attachments.length > 0 && (
              <GlassCard className="p-4">
                <h2 className="text-sm font-semibold text-foreground mb-2">Required attachments</h2>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {attachments.map((a, i) => (
                    <li key={i}>☐ {a.name}{a.required === false ? " (if applicable)" : ""}</li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetailPage;
