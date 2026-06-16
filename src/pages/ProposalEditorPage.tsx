import { useState, useCallback, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, CheckCircle, Circle, Loader2, BarChart3,
  ChevronRight, X, MessageSquare, History, Send, Users, Lock,
  Eye, ThumbsUp, ThumbsDown, Copy, ExternalLink, ArrowLeft, Info,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { streamClaude, callClaudeJSON } from "@/lib/claudeAI";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { routeLabels, type ApplicationRoute } from "@/components/StartApplicationModal";

// Section definitions per format
const fullProposalSections = [
  { key: "executive_summary", label: "Executive Summary", placeholder: "Provide a compelling overview of your project, organisation, and funding request.", target: 300 },
  { key: "problem_statement", label: "Problem Statement", placeholder: "Describe the problem or need your project addresses.", target: 500 },
  { key: "project_objectives", label: "Project Objectives", placeholder: "List 3-5 SMART objectives.", target: 300 },
  { key: "methodology", label: "Methodology & Activities", placeholder: "Describe your approach, activities, and timeline.", target: 600 },
  { key: "monitoring_evaluation", label: "Monitoring & Evaluation", placeholder: "Explain how you will measure progress.", target: 400 },
  { key: "budget_narrative", label: "Budget Narrative", placeholder: "Explain your budget rationale and cost-effectiveness.", target: 300 },
  { key: "organisational_capacity", label: "Organisational Capacity", placeholder: "Describe your track record and capacity.", target: 300 },
  { key: "conclusion", label: "Conclusion", placeholder: "Summarise your commitment and expected impact.", target: 150 },
];

const loeSections = [
  { key: "opening", label: "Opening Paragraph", placeholder: "What you're asking for and why you're writing to this funder.", target: 100 },
  { key: "who_we_are", label: "Who We Are", placeholder: "Organisation description and credibility.", target: 150 },
  { key: "the_problem", label: "The Problem", placeholder: "Brief problem statement with evidence.", target: 150 },
  { key: "proposed_project", label: "Our Proposed Project", placeholder: "What you want to do, for whom, for how long.", target: 200 },
  { key: "why_us", label: "Why Us", placeholder: "Organisational credibility and track record.", target: 100 },
  { key: "requesting", label: "What We're Requesting", placeholder: "Amount, timeline, and how funds will be used.", target: 80 },
  { key: "closing", label: "Closing & Next Steps", placeholder: "Invite to receive full proposal or meet.", target: 50 },
];

const conceptNoteSections = [
  { key: "project_summary", label: "Project Title & Summary", placeholder: "A crisp one-paragraph overview.", target: 100 },
  { key: "org_background", label: "Organisation Background", placeholder: "Who you are and your track record.", target: 150 },
  { key: "problem_statement", label: "Problem Statement", placeholder: "The problem with evidence.", target: 200 },
  { key: "objectives", label: "Project Objectives", placeholder: "3-5 SMART objectives as bullet list.", target: 150 },
  { key: "methodology", label: "Methodology Overview", placeholder: "What you'll do — not full detail.", target: 200 },
  { key: "beneficiaries", label: "Target Beneficiaries", placeholder: "Who, how many, where.", target: 100 },
  { key: "outcomes", label: "Expected Outcomes", placeholder: "Outcome bullet list with indicators.", target: 100 },
  { key: "budget_summary", label: "Budget Summary", placeholder: "Main line items and totals.", target: 100 },
  { key: "timeline", label: "Project Timeline", placeholder: "Simple milestone list.", target: 80 },
  { key: "sustainability", label: "Sustainability", placeholder: "How impact continues after the grant.", target: 100 },
];

const formPrepFields = [
  { key: "org_overview", label: "Organisation Overview", placeholder: "100-word description of your organisation." },
  { key: "mission", label: "Mission Statement", placeholder: "2-sentence mission statement." },
  { key: "problem", label: "Problem Statement", placeholder: "200-word problem statement with evidence." },
  { key: "project_description", label: "Project Description", placeholder: "300-word project description." },
  { key: "objectives", label: "Objectives", placeholder: "3-5 SMART objectives." },
  { key: "beneficiaries", label: "Target Beneficiaries", placeholder: "100-word beneficiary description." },
  { key: "outcomes", label: "Expected Outcomes", placeholder: "3-5 expected outcomes." },
  { key: "methodology", label: "Methodology", placeholder: "200-word methodology." },
  { key: "mne", label: "M&E Approach", placeholder: "150-word monitoring & evaluation approach." },
  { key: "budget_narrative", label: "Budget Narrative", placeholder: "150-word budget explanation." },
  { key: "sustainability", label: "Sustainability Plan", placeholder: "150-word sustainability plan." },
  { key: "capacity", label: "Organisational Capacity", placeholder: "150-word capacity statement." },
];

function getSectionsForFormat(format: string) {
  switch (format) {
    case "loe": return loeSections;
    case "concept_note": return conceptNoteSections;
    default: return fullProposalSections;
  }
}

function getFormatBadge(format: string) {
  const key = format as ApplicationRoute;
  return routeLabels[key] || routeLabels.full_proposal;
}

interface ScoreResult {
  overall_score: number;
  executive_summary_score: number;
  problem_statement_score: number;
  objectives_score: number;
  methodology_score: number;
  impact_score: number;
  budget_score: number;
  organisation_score: number;
  strengths: string[];
  improvements: Array<{ section: string; issue: string; suggestion: string }>;
  funder_alignment_note: string;
}

const ProposalEditorPage = () => {
  const { id: proposalId } = useParams();
  const [searchParams] = useSearchParams();
  const format = searchParams.get("format") || "full_proposal";
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<any>(null);
  const [funder, setFunder] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);

  const [activeSection, setActiveSection] = useState(0);
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<number | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [aiGenerated, setAiGenerated] = useState<Set<string>>(new Set());
  const [proposalStatus, setProposalStatus] = useState<string>("draft");
  const [rightPanel, setRightPanel] = useState<"none" | "comments" | "history" | "score" | "funder">("funder");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const isFormPrep = format === "online_form" || format === "form_prep";
  const isGuided = format === "guided";
  const sections = isFormPrep ? [] : getSectionsForFormat(format);
  const formatInfo = getFormatBadge(format);

  // Load proposal + funder + org from Supabase
  useEffect(() => {
    if (!user) return;
    if (!proposalId || proposalId === "new") {
      // No proposal id — show empty-state instead of infinite spinner.
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data: p } = await supabase.from("proposals").select("*").eq("id", proposalId).maybeSingle();
      if (!p) { setLoading(false); return; }
      setProposal(p);
      setProposalStatus(p.status || "draft");
      if (p.sections && typeof p.sections === "object") {
        setSectionContent(p.sections as Record<string, string>);
      }
      if (p.form_prep_content && typeof p.form_prep_content === "object") {
        setSectionContent(p.form_prep_content as Record<string, string>);
      }

      const [{ data: f }, { data: o }] = await Promise.all([
        p.funder_id ? supabase.from("funders").select("*").eq("id", p.funder_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("organisations").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setFunder(f);
      setOrg(o);
      setLoading(false);
    };
    load();
  }, [proposalId, user]);

  // Load comments
  useEffect(() => {
    if (!proposalId) return;
    supabase.from("proposal_comments").select("*").eq("proposal_id", proposalId).order("created_at", { ascending: false })
      .then(({ data }) => setComments(data || []));
  }, [proposalId]);

  // Auto-save
  useEffect(() => {
    if (!proposalId || !Object.keys(sectionContent).length) return;
    const t = setTimeout(async () => {
      setSaving(true);
      const totalWords = Object.values(sectionContent).reduce((sum, t) => sum + wordCount(t), 0);
      const updateData: any = { word_count: totalWords };
      if (isFormPrep) {
        updateData.form_prep_content = sectionContent;
      } else {
        updateData.sections = sectionContent;
      }
      await supabase.from("proposals").update(updateData).eq("id", proposalId);
      setSaving(false);
    }, 3000);
    return () => clearTimeout(t);
  }, [sectionContent, proposalId, isFormPrep]);

  const wordCount = (text: string) => text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const totalWords = Object.values(sectionContent).reduce((sum, t) => sum + wordCount(t), 0);
  const completedSections = sections.filter(s => wordCount(sectionContent[s.key] || "") > 20).length;

  const requireFunder = () => {
    if (!proposal?.funder_id) {
      toast({
        title: "Attach a grant first",
        description: "Claude needs a funder attached to this proposal to tailor the writing. Open it from a grant or your applications.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const generateSection = useCallback(async (idx: number) => {
    const section = sections[idx];
    if (!section) return;
    if (!requireFunder()) return;
    setGenerating(true);
    setGeneratingSection(idx);
    setActiveSection(idx);
    let content = "";
    try {
      await streamClaude(
        {
          mode: "section",
          org_id: org?.id,
          funder_id: proposal?.funder_id,
          format,
          section_key: section.key,
          section_label: section.label,
          section_target: section.target,
          current_content: sectionContent[section.key],
        },
        (delta) => { content += delta; setSectionContent(prev => ({ ...prev, [section.key]: content })); },
        () => { setGenerating(false); setGeneratingSection(null); setAiGenerated(prev => new Set(prev).add(section.key)); toast({ title: `${section.label} generated` }); },
      );
    } catch (e: any) {
      setGenerating(false); setGeneratingSection(null);
      toast({ title: "Claude unavailable", description: e?.message || "Try again or write manually.", variant: "destructive" });
    }
  }, [sections, org, proposal, format, sectionContent]);

  const generateAll = useCallback(async () => {
    if (!requireFunder()) return;
    setGeneratingAll(true);
    try {
      const result = await callClaudeJSON<Record<string, string>>({
        mode: "all",
        org_id: org?.id,
        funder_id: proposal?.funder_id,
        format,
        section_keys: sections.map(s => s.key),
      });
      setSectionContent(result);
      setAiGenerated(new Set(Object.keys(result)));
      toast({ title: "All sections generated", description: "Ready for review." });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message, variant: "destructive" });
    }
    setGeneratingAll(false);
  }, [sections, org, proposal, format]);

  const generateFormPrep = useCallback(async () => {
    if (!requireFunder()) return;
    setGeneratingAll(true);
    try {
      const result = await callClaudeJSON<Record<string, any>>({
        mode: "form_prep",
        org_id: org?.id,
        funder_id: proposal?.funder_id,
        format,
      });
      const processed: Record<string, string> = {};
      for (const [k, v] of Object.entries(result)) {
        processed[k] = Array.isArray(v) ? (v as string[]).map((item, i) => `${i + 1}. ${item}`).join("\n") : String(v);
      }
      setSectionContent(processed);
      toast({ title: "Form prep answers generated" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message, variant: "destructive" });
    }
    setGeneratingAll(false);
  }, [org, proposal, format]);

  const scoreProposal = useCallback(async () => {
    setScoring(true);
    try {
      const proposalText = sections.map(s => `## ${s.label}\n${sectionContent[s.key] || "(empty)"}`).join("\n\n");
      const result = await callClaudeJSON<ScoreResult>({
        mode: "score",
        org_id: org?.id,
        funder_id: proposal?.funder_id,
        format,
        current_content: proposalText,
      });
      setScoreResult(result);
      setRightPanel("score");
      if (proposalId) {
        await supabase.from("proposal_scores").insert({
          proposal_id: proposalId,
          overall_score: result.overall_score,
          executive_summary_score: result.executive_summary_score,
          problem_statement_score: result.problem_statement_score,
          objectives_score: result.objectives_score,
          methodology_score: result.methodology_score,
          impact_score: result.impact_score,
          budget_score: result.budget_score,
          organisation_score: result.organisation_score,
          feedback_json: result as any,
          recommendations: result.improvements?.map(i => i.suggestion) || [],
        });
        await supabase.from("proposals").update({ ai_score: result.overall_score }).eq("id", proposalId);
      }
    } catch (e: any) {
      toast({ title: "Scoring failed", description: e?.message, variant: "destructive" });
    }
    setScoring(false);
  }, [sectionContent, sections, org, proposal, format, proposalId]);

  const addComment = async () => {
    if (!newComment.trim() || !proposalId || !user) return;
    const { data } = await supabase.from("proposal_comments").insert({
      proposal_id: proposalId,
      section_key: sections[activeSection]?.key || null,
      content: newComment,
      created_by: user.id,
    }).select().single();
    if (data) setComments(prev => [data, ...prev]);
    setNewComment("");
    toast({ title: "Comment added" });
  };

  const submitForReview = async () => {
    if (!proposalId) return;
    await supabase.from("proposals").update({ status: "human_review" }).eq("id", proposalId);
    setProposalStatus("human_review");
    toast({ title: "Submitted for review" });
  };

  const approveProposal = async () => {
    if (!proposalId) return;
    // Gate: every section must have meaningful content (>20 words) before approving.
    const incomplete = sections.filter(s => wordCount(sectionContent[s.key] || "") <= 20);
    if (incomplete.length) {
      toast({
        title: "Cannot approve yet",
        description: `${incomplete.length} section${incomplete.length === 1 ? "" : "s"} still incomplete: ${incomplete.map(s => s.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    await supabase.from("proposals").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", proposalId);
    setProposalStatus("approved");
    toast({ title: "Proposal approved" });
  };

  const requestChanges = async () => {
    if (!proposalId) return;
    await supabase.from("proposals").update({ status: "draft" }).eq("id", proposalId);
    setProposalStatus("draft");
    toast({ title: "Changes requested" });
  };

  const markAsSubmitted = async () => {
    if (!proposalId) return;
    if (!confirm("Mark this proposal as submitted to the funder? This will also update the linked application.")) return;
    const submittedAt = new Date().toISOString();
    await supabase.from("proposals").update({ status: "submitted", submitted_at: submittedAt }).eq("id", proposalId);
    if (proposal?.application_id) {
      await supabase.from("applications").update({ status: "submitted", submitted_at: submittedAt }).eq("id", proposal.application_id);
    }
    setProposalStatus("submitted");
    toast({ title: "Marked as submitted", description: "Tracked in your application pipeline." });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
    </DashboardLayout>
  );

  if (!proposal) return (
    <DashboardLayout>
      <div className="max-w-md mx-auto text-center py-16">
        <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Start a new proposal</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Proposals are created from a grant or application so we can tailor them to the funder.
          Pick a grant or open an application to get started.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/grants"><Button size="sm" className="bg-primary text-primary-foreground">Browse Grants</Button></Link>
          <Link to="/applications"><Button size="sm" variant="outline">My Applications</Button></Link>
        </div>
      </div>
    </DashboardLayout>
  );

  // ── GUIDED MODE ──
  if (isGuided) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Link to="/writer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to Proposals
          </Link>
          <GlassCard hoverable={false}>
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">How to approach {funder?.donor_name || "this funder"}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2"><strong>Method:</strong> {funder?.method_of_approach || "Not specified"}</p>
            <p className="text-sm text-muted-foreground mb-6">This funder's application process may be by invitation or require nomination. Here's what we recommend:</p>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/20 border border-border/20">
                <p className="text-sm text-foreground font-medium mb-1">1. Visit their website</p>
                <p className="text-xs text-muted-foreground mb-2">Check for current open calls or application guidelines.</p>
                {funder?.website && (
                  <a href={funder.website.startsWith("http") ? funder.website : `https://${funder.website}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs"><ExternalLink className="h-3 w-3 mr-1" /> Open website</Button>
                  </a>
                )}
              </div>
              <div className="p-4 rounded-lg bg-secondary/20 border border-border/20">
                <p className="text-sm text-foreground font-medium mb-1">2. Send an introduction email</p>
                <p className="text-xs text-muted-foreground">
                  {funder?.contact_person && <>Contact: {funder.contact_person}</>}
                  {funder?.email && <> · {funder.email}</>}
                </p>
                <Link to="/email"><Button variant="outline" size="sm" className="text-xs mt-2"><Send className="h-3 w-3 mr-1" /> Draft introduction email</Button></Link>
              </div>
              <div className="p-4 rounded-lg bg-secondary/20 border border-border/20">
                <p className="text-sm text-foreground font-medium mb-1">3. Track in your Funder CRM</p>
                <Link to="/crm"><Button variant="outline" size="sm" className="text-xs mt-1">Add to CRM</Button></Link>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-3">Would you still like to prepare a draft proposal? (useful if they invite you to apply)</p>
              <Link to={`/writer/${proposalId}`}>
                <Button variant="outline" size="sm">Prepare draft proposal anyway</Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  // ── FORM PREP MODE ──
  if (isFormPrep) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/writer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to Proposals
            </Link>
            <div className="flex items-center gap-2">
              <Badge className={`text-[9px] h-5 border-0 ${formatInfo.color}`}>{formatInfo.label}</Badge>
              {saving && <span className="text-[10px] text-muted-foreground">Saving...</span>}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-accent-amber/10 border border-accent-amber/30">
            <p className="text-sm text-accent-amber font-medium">⚠️ This funder uses their own online application form.</p>
            <p className="text-xs text-muted-foreground mt-1">We can't submit for you — but we'll prepare everything you need to copy-paste into their form.</p>
            <div className="flex gap-2 mt-3">
              {funder?.website && (
                <a href={funder.website.startsWith("http") ? funder.website : `https://${funder.website}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-xs"><ExternalLink className="h-3 w-3 mr-1" /> Open funder's website</Button>
                </a>
              )}
              <Button size="sm" className="bg-primary text-primary-foreground text-xs" onClick={generateFormPrep} disabled={generatingAll}>
                {generatingAll ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Generate all answers
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formPrepFields.map(field => (
              <GlassCard key={field.key} hoverable={false} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-foreground">{field.label}</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => copyToClipboard(sectionContent[field.key] || "")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={sectionContent[field.key] || ""}
                  onChange={e => setSectionContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="bg-transparent border-border/30 min-h-[100px] text-xs leading-relaxed resize-none"
                />
                <div className="text-right mt-1">
                  <span className="text-[9px] text-muted-foreground">{(sectionContent[field.key] || "").length} chars</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── STANDARD WRITER (Full Proposal, LOE, Concept Note) ──
  const currentSection = sections[activeSection];
  const currentSectionComments = comments.filter(c => c.section_key === currentSection?.key);
  const unresolvedCount = comments.filter(c => !c.resolved).length;

  const totalTarget = sections.reduce((sum, s) => sum + (s.target || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto flex gap-4 h-[calc(100vh-8rem)]">
        {/* Section Navigator */}
        <div className="w-60 shrink-0 hidden lg:block">
          <GlassCard hoverable={false} className="h-full flex flex-col p-4">
            <div className="mb-4">
              <Badge className={`text-[9px] h-5 border-0 mb-2 ${formatInfo.color}`}>{formatInfo.label}</Badge>
              <div className="text-xs text-muted-foreground mb-1">{completedSections}/{sections.length} sections</div>
              <Progress value={(completedSections / sections.length) * 100} className="h-1.5" />
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {sections.map((s, i) => {
                const wc = wordCount(sectionContent[s.key] || "");
                const pct = s.target ? (wc / s.target) * 100 : 0;
                const status = wc > 20 ? "complete" : wc > 0 ? "draft" : "empty";
                return (
                  <button key={s.key} onClick={() => setActiveSection(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                      i === activeSection ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                    }`}>
                    {status === "complete" ? <CheckCircle className="h-3 w-3 text-success shrink-0" /> : status === "draft" ? <Circle className="h-3 w-3 text-accent-amber shrink-0" /> : <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />}
                    <span className="flex-1 truncate">{s.label}</span>
                    <span className={`text-[9px] ${pct > 120 ? "text-destructive" : pct >= 80 ? "text-primary" : "text-muted-foreground"}`}>{wc}w</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-3 border-t border-border/30 mt-3">
              <div className="text-xs text-muted-foreground">
                Total: <span className="font-medium text-foreground">{totalWords.toLocaleString()}</span> / {totalTarget.toLocaleString()} words
              </div>
              {saving && <span className="text-[9px] text-primary mt-1 block">Saving...</span>}
            </div>
          </GlassCard>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {proposalStatus === "human_review" && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-between">
              <span className="text-xs font-medium text-accent-amber">⏳ Under Review</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-success" onClick={approveProposal}><ThumbsUp className="h-3 w-3 mr-1" /> Approve</Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive" onClick={requestChanges}><ThumbsDown className="h-3 w-3 mr-1" /> Request Changes</Button>
              </div>
            </div>
          )}
          {proposalStatus === "approved" && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
              <span className="text-xs font-medium text-success">✓ Approved — ready for submission</span>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={generating || generatingAll} onClick={() => generateSection(activeSection)}>
              {generatingSection === activeSection ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Generate Section
            </Button>
            <Button size="sm" variant="outline" className="border-border/50" disabled={generating || generatingAll} onClick={generateAll}>
              {generatingAll ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Generate All
            </Button>
            <Button size="sm" variant="outline" className="border-border/50" disabled={scoring || totalWords < 50} onClick={scoreProposal}>
              {scoring ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 mr-1" />}
              Score
            </Button>

            <div className="flex items-center gap-1 ml-2 border-l border-border/30 pl-2">
              <Button size="sm" variant={rightPanel === "comments" ? "default" : "ghost"} className="h-7 px-2 relative" onClick={() => setRightPanel(rightPanel === "comments" ? "none" : "comments")}>
                <MessageSquare className="h-3.5 w-3.5" />
                {unresolvedCount > 0 && <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center">{unresolvedCount}</span>}
              </Button>
              <Button size="sm" variant={rightPanel === "funder" ? "default" : "ghost"} className="h-7 px-2" onClick={() => setRightPanel(rightPanel === "funder" ? "none" : "funder")}>
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </div>

            {proposalStatus === "draft" && totalWords > 50 && (
              <Button size="sm" variant="outline" className="ml-2 border-accent-amber/30 text-accent-amber hover:bg-accent-amber/10" onClick={submitForReview}>
                <Send className="h-3.5 w-3.5 mr-1" /> Submit for Review
              </Button>
            )}

            <span className="ml-auto text-[10px] text-muted-foreground">{funder?.donor_name}</span>
          </div>

          {/* Editor */}
          <GlassCard hoverable={false} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h2 className="text-sm font-semibold text-foreground">{currentSection?.label}</h2>
              <div className="flex items-center gap-2">
                {aiGenerated.has(currentSection?.key) && <span className="text-[9px] px-2 py-0.5 rounded bg-primary/15 text-primary font-medium">AI generated</span>}
                <span className="text-xs text-muted-foreground">{wordCount(sectionContent[currentSection?.key] || "")} / {currentSection?.target}w</span>
              </div>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={sectionContent[currentSection?.key] || ""}
                onChange={e => {
                  setSectionContent(prev => ({ ...prev, [currentSection.key]: e.target.value }));
                  if (aiGenerated.has(currentSection.key)) setAiGenerated(prev => { const s = new Set(prev); s.delete(currentSection.key); return s; });
                }}
                placeholder={currentSection?.placeholder}
                className="h-full min-h-[400px] resize-none bg-transparent border-0 focus-visible:ring-0 text-sm text-foreground leading-relaxed"
              />
            </div>
          </GlassCard>

          {/* Mobile section nav */}
          <div className="flex gap-1 mt-3 overflow-x-auto lg:hidden">
            {sections.map((s, i) => (
              <button key={s.key} onClick={() => setActiveSection(i)}
                className={`px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap ${i === activeSection ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <AnimatePresence>
          {rightPanel !== "none" && (
            <motion.div className="w-72 shrink-0 hidden xl:block" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <GlassCard hoverable={false} className="h-full overflow-y-auto p-4">
                {/* Funder Brief */}
                {rightPanel === "funder" && funder && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">📄 Funder Brief</h3>
                      <button onClick={() => setRightPanel("none")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-3">{funder.donor_name}</p>
                    {funder.funder_focus && (
                      <div className="mb-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">They fund</p>
                        <p className="text-xs text-foreground">{funder.funder_focus}</p>
                      </div>
                    )}
                    {funder.geographical_area && (
                      <div className="mb-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Geography</p>
                        <p className="text-xs text-foreground">{funder.geographical_area}</p>
                      </div>
                    )}
                    {funder.method_of_approach && (
                      <div className="mb-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">How to apply</p>
                        <p className="text-xs text-foreground">{funder.method_of_approach}</p>
                      </div>
                    )}
                    {funder.contact_person && (
                      <div className="mb-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
                        <p className="text-xs text-foreground">{funder.contact_person}{funder.email ? ` · ${funder.email}` : ""}</p>
                      </div>
                    )}
                    {funder.website && (
                      <a href={funder.website.startsWith("http") ? funder.website : `https://${funder.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Website ↗
                      </a>
                    )}
                  </>
                )}

                {/* Comments */}
                {rightPanel === "comments" && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Comments</h3>
                      <button onClick={() => setRightPanel("none")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="mb-4">
                      <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={`Comment on ${currentSection?.label}...`} className="bg-secondary/30 border-border/30 min-h-[60px] text-xs" />
                      <Button size="sm" className="w-full mt-2 h-7 text-xs" onClick={addComment} disabled={!newComment.trim()}>Add Comment</Button>
                    </div>
                    <div className="space-y-3">
                      {currentSectionComments.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No comments on this section</p>}
                      {currentSectionComments.map(c => (
                        <div key={c.id} className={`p-2 rounded-lg border ${c.resolved ? "border-border/10 opacity-60" : "border-border/30"}`}>
                          <p className="text-xs text-muted-foreground">{c.content}</p>
                          <span className="text-[9px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Score */}
                {rightPanel === "score" && scoreResult && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Proposal Score</h3>
                      <button onClick={() => setRightPanel("none")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex justify-center mb-4">
                      <MatchScoreRing score={scoreResult.overall_score} size="lg" />
                    </div>
                    {scoreResult.strengths?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Strengths</p>
                        {scoreResult.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1">
                            <CheckCircle className="h-3 w-3 text-success shrink-0 mt-0.5" />
                            <span className="text-xs text-foreground">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {scoreResult.improvements?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Improvements</p>
                        {scoreResult.improvements.map((imp, i) => (
                          <div key={i} className="p-2 rounded-lg bg-accent-amber/5 border border-accent-amber/20 mb-2">
                            <Badge variant="outline" className="text-[8px] mb-1">{imp.section}</Badge>
                            <p className="text-[10px] text-foreground">{imp.issue}</p>
                            <p className="text-[10px] text-primary mt-1">{imp.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {scoreResult.funder_alignment_note && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Funder Alignment</p>
                        <p className="text-xs text-foreground">{scoreResult.funder_alignment_note}</p>
                      </div>
                    )}
                  </>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default ProposalEditorPage;
