import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, CheckCircle, Circle, Loader2, BarChart3,
  ChevronRight, X, MessageSquare, History, Send, Users, Lock,
  Eye, ThumbsUp, ThumbsDown,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { streamAI, callAIJSON } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";

const sections = [
  { key: "executive_summary", label: "Executive Summary", placeholder: "Provide a compelling overview of your project, organisation, and funding request." },
  { key: "problem_statement", label: "Problem Statement", placeholder: "Describe the problem or need your project addresses. Include statistics, context, and why your organisation is positioned to address it." },
  { key: "project_objectives", label: "Project Objectives", placeholder: "List 3-5 SMART objectives that your project aims to achieve." },
  { key: "methodology", label: "Methodology & Activities", placeholder: "Describe your approach, activities, timeline, and how they connect to your objectives." },
  { key: "monitoring_evaluation", label: "Monitoring & Evaluation", placeholder: "Explain how you will measure progress, collect data, and evaluate outcomes." },
  { key: "budget_narrative", label: "Budget Narrative", placeholder: "Explain your budget rationale, key line items, and cost-effectiveness." },
  { key: "organisational_capacity", label: "Organisational Capacity", placeholder: "Describe your organisation's track record, team, and capacity to deliver." },
  { key: "conclusion", label: "Conclusion", placeholder: "Summarise your commitment, expected impact, and call to action for the funder." },
];

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

interface Comment {
  id: string;
  section_key: string;
  content: string;
  created_by: string;
  avatar: string;
  created_at: string;
  resolved: boolean;
}

interface Version {
  id: string;
  version_number: number;
  word_count: number;
  change_summary: string;
  created_by: string;
  created_at: string;
}

const mockComments: Comment[] = [
  { id: "c1", section_key: "executive_summary", content: "This needs a stronger opening hook. Consider leading with impact data.", created_by: "Fatima Abdi", avatar: "FA", created_at: "2 hours ago", resolved: false },
  { id: "c2", section_key: "methodology", content: "Add more detail about the M&E framework here.", created_by: "Sarah Moyo", avatar: "SM", created_at: "1 day ago", resolved: false },
  { id: "c3", section_key: "budget_narrative", content: "Budget figures look good. Approved.", created_by: "Fatima Abdi", avatar: "FA", created_at: "3 days ago", resolved: true },
];

const mockVersions: Version[] = [
  { id: "v3", version_number: 3, word_count: 1847, change_summary: "AI-generated methodology section, manual edits to executive summary", created_by: "James Ndlovu", created_at: "2 hours ago" },
  { id: "v2", version_number: 2, word_count: 1200, change_summary: "Added problem statement and objectives sections", created_by: "Sarah Moyo", created_at: "1 day ago" },
  { id: "v1", version_number: 1, word_count: 450, change_summary: "Initial AI-generated executive summary", created_by: "AI", created_at: "2 days ago" },
];

const mockPresence = [
  { name: "Sarah Moyo", avatar: "SM", section: "Executive Summary", color: "bg-primary" },
  { name: "James Ndlovu", avatar: "JN", section: null, color: "bg-success" },
];

const ProposalEditorPage = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<number | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [aiGenerated, setAiGenerated] = useState<Set<string>>(new Set());
  const [proposalStatus, setProposalStatus] = useState<"draft" | "human_review" | "approved">("draft");

  // Collaboration state
  const [rightPanel, setRightPanel] = useState<"none" | "comments" | "history" | "score">("none");
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [lockedSections, setLockedSections] = useState<Record<string, string>>({ methodology: "Sarah Moyo" });

  const funder = { name: "DG Murray Trust", focus: "Education innovation and leadership development", category: "SA Trusts/ Foundations", method: "Concept Note" };
  const org = { name: "Elizayo Foundation", mission: "Empowering youth through education and community development in Western Cape", programmes: ["AfterSchool", "ECD", "Youth Development"], focusAreas: ["Education", "Youth", "Community Development"], country: "South Africa", region: "Western Cape" };

  const wordCount = (text: string) => text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const totalWords = Object.values(sectionContent).reduce((sum, t) => sum + wordCount(t), 0);
  const completedSections = sections.filter(s => wordCount(sectionContent[s.key] || "") > 20).length;

  const currentSectionComments = comments.filter(c => c.section_key === sections[activeSection].key);
  const unresolvedCount = comments.filter(c => !c.resolved).length;

  const generateSection = useCallback(async (idx: number) => {
    const section = sections[idx];
    setGenerating(true);
    setGeneratingSection(idx);
    setActiveSection(idx);
    let content = "";
    try {
      await streamAI(
        [
          { role: "system", content: `You are an expert grant proposal writer for African NGOs. Write in professional, compelling, evidence-based style. Write in first person plural ("we", "our organisation"). Do not use placeholder text or brackets.` },
          { role: "user", content: `Write the "${section.label}" section (~250 words) for a proposal from ${org.name} (mission: ${org.mission}) to ${funder.name} (focus: ${funder.focus}). Programmes: ${org.programmes.join(", ")}. Country: ${org.country}, Region: ${org.region}. Method: ${funder.method}. Return only the section content.` },
        ],
        (delta) => { content += delta; setSectionContent(prev => ({ ...prev, [section.key]: content })); },
        () => { setGenerating(false); setGeneratingSection(null); setAiGenerated(prev => new Set(prev).add(section.key)); toast({ title: `${section.label} generated` }); },
      );
    } catch {
      setGenerating(false); setGeneratingSection(null);
      toast({ title: "AI unavailable", description: "Try again or write manually.", variant: "destructive" });
    }
  }, []);

  const generateAll = useCallback(async () => {
    setGeneratingAll(true);
    try {
      const result = await callAIJSON<Record<string, string>>([
        { role: "system", content: `You are an expert grant proposal writer for African NGOs. Generate a complete proposal in JSON format. Write in first person plural. Each section 200-350 words, professional, specific, tailored.` },
        { role: "user", content: `Generate a complete grant proposal as JSON with keys: executive_summary, problem_statement, project_objectives, methodology, monitoring_evaluation, budget_narrative, organisational_capacity, conclusion. Organisation: ${org.name}, Mission: ${org.mission}, Programmes: ${org.programmes.join(", ")}, Focus: ${org.focusAreas.join(", ")}, Country: ${org.country}, Region: ${org.region}. Funder: ${funder.name}, Focus: ${funder.focus}, Category: ${funder.category}, Method: ${funder.method}. Return ONLY valid JSON.` },
      ]);
      setSectionContent(result);
      setAiGenerated(new Set(Object.keys(result)));
      toast({ title: "Full proposal generated!", description: "All 8 sections ready for review." });
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    }
    setGeneratingAll(false);
  }, []);

  const scoreProposal = useCallback(async () => {
    setScoring(true);
    try {
      const proposalText = sections.map(s => `## ${s.label}\n${sectionContent[s.key] || "(empty)"}`).join("\n\n");
      const result = await callAIJSON<ScoreResult>([
        { role: "system", content: `You are a grant proposal expert evaluating proposals for African funders. Return ONLY valid JSON.` },
        { role: "user", content: `Evaluate this proposal for ${funder.name} (focus: ${funder.focus}):\n\n${proposalText}\n\nReturn JSON: { "overall_score": <0-100>, "executive_summary_score": <0-100>, "problem_statement_score": <0-100>, "objectives_score": <0-100>, "methodology_score": <0-100>, "impact_score": <0-100>, "budget_score": <0-100>, "organisation_score": <0-100>, "strengths": ["...","...","..."], "improvements": [{"section":"...","issue":"...","suggestion":"..."}], "funder_alignment_note": "..." }` },
      ]);
      setScoreResult(result);
      setRightPanel("score");
    } catch {
      toast({ title: "Scoring failed", variant: "destructive" });
    }
    setScoring(false);
  }, [sectionContent]);

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`, section_key: sections[activeSection].key,
      content: newComment, created_by: "You", avatar: "YO",
      created_at: "Just now", resolved: false,
    };
    setComments(prev => [comment, ...prev]);
    setNewComment("");
    toast({ title: "Comment added" });
  };

  const resolveComment = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c));
  };

  const submitForReview = () => {
    setProposalStatus("human_review");
    toast({ title: "Submitted for review", description: "Reviewers will be notified." });
  };

  const approveProposal = () => {
    setProposalStatus("approved");
    toast({ title: "Proposal approved ✓", description: "Ready for submission to funder." });
  };

  const requestChanges = () => {
    setProposalStatus("draft");
    toast({ title: "Changes requested", description: "Writer has been notified." });
  };

  const currentSection = sections[activeSection];
  const isLocked = lockedSections[currentSection.key] && lockedSections[currentSection.key] !== "You";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto flex gap-4 h-[calc(100vh-8rem)]">
        {/* Section Navigator */}
        <div className="w-60 shrink-0 hidden lg:block">
          <GlassCard hoverable={false} className="h-full flex flex-col p-4">
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-1">{completedSections}/8 sections</div>
              <Progress value={(completedSections / 8) * 100} className="h-1.5" />
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {sections.map((s, i) => {
                const wc = wordCount(sectionContent[s.key] || "");
                const status = wc > 20 ? "complete" : wc > 0 ? "draft" : "empty";
                const locked = lockedSections[s.key];
                const sectionCommentCount = comments.filter(c => c.section_key === s.key && !c.resolved).length;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                      i === activeSection ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                    }`}
                  >
                    {status === "complete" ? (
                      <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    ) : status === "draft" ? (
                      <Circle className="h-3 w-3 text-accent-amber shrink-0" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {locked && <Lock className="h-2.5 w-2.5 text-accent-amber" />}
                      {sectionCommentCount > 0 && (
                        <span className="text-[8px] h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center">{sectionCommentCount}</span>
                      )}
                      {wc > 0 && <span className="text-[9px] text-muted-foreground">{wc}w</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="pt-3 border-t border-border/30 mt-3">
              <div className="text-xs text-muted-foreground">
                Total: <span className="font-medium text-foreground">{totalWords.toLocaleString()}</span> / 2,000 words
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Status Banner */}
          {proposalStatus === "human_review" && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-between">
              <span className="text-xs font-medium text-accent-amber">⏳ Under Review — awaiting reviewer approval</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-success" onClick={approveProposal}>
                  <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive" onClick={requestChanges}>
                  <ThumbsDown className="h-3 w-3 mr-1" /> Request Changes
                </Button>
              </div>
            </div>
          )}
          {proposalStatus === "approved" && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
              <span className="text-xs font-medium text-success">✓ Approved — ready for submission to funder</span>
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
            <Button size="sm" variant="outline" className="border-border/50" disabled={scoring || totalWords < 100} onClick={scoreProposal}>
              {scoring ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 mr-1" />}
              Score
            </Button>

            <div className="flex items-center gap-1 ml-2 border-l border-border/30 pl-2">
              <Button size="sm" variant={rightPanel === "comments" ? "default" : "ghost"} className="h-7 px-2 relative" onClick={() => setRightPanel(rightPanel === "comments" ? "none" : "comments")}>
                <MessageSquare className="h-3.5 w-3.5" />
                {unresolvedCount > 0 && <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center">{unresolvedCount}</span>}
              </Button>
              <Button size="sm" variant={rightPanel === "history" ? "default" : "ghost"} className="h-7 px-2" onClick={() => setRightPanel(rightPanel === "history" ? "none" : "history")}>
                <History className="h-3.5 w-3.5" />
              </Button>
            </div>

            {proposalStatus === "draft" && totalWords > 100 && (
              <Button size="sm" variant="outline" className="ml-2 border-accent-amber/30 text-accent-amber hover:bg-accent-amber/10" onClick={submitForReview}>
                <Send className="h-3.5 w-3.5 mr-1" /> Submit for Review
              </Button>
            )}

            {/* Presence indicators */}
            <div className="ml-auto flex items-center gap-1">
              {mockPresence.map(p => (
                <div key={p.name} className="relative group">
                  <div className={`h-6 w-6 rounded-full ${p.color}/20 flex items-center justify-center text-[9px] font-semibold border-2 border-background`}>
                    {p.avatar}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-popover border border-border text-[9px] text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {p.name}{p.section ? ` · editing ${p.section}` : " · viewing"}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-success border border-background" />
                </div>
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">{funder.name}</span>
            </div>
          </div>

          {/* Editor Area */}
          <GlassCard hoverable={false} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{currentSection.label}</h2>
                {isLocked && (
                  <Badge variant="outline" className="text-[9px] h-5 text-accent-amber border-accent-amber/30">
                    <Lock className="h-2.5 w-2.5 mr-1" /> {lockedSections[currentSection.key]} is editing
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {aiGenerated.has(currentSection.key) && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-primary/15 text-primary font-medium">AI generated</span>
                )}
                <span className="text-xs text-muted-foreground">{wordCount(sectionContent[currentSection.key] || "")} words</span>
              </div>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={sectionContent[currentSection.key] || ""}
                onChange={(e) => {
                  if (isLocked) return;
                  setSectionContent(prev => ({ ...prev, [currentSection.key]: e.target.value }));
                  if (aiGenerated.has(currentSection.key)) {
                    setAiGenerated(prev => { const s = new Set(prev); s.delete(currentSection.key); return s; });
                  }
                }}
                placeholder={isLocked ? `${lockedSections[currentSection.key]} is currently editing this section...` : currentSection.placeholder}
                disabled={isLocked}
                className={`h-full min-h-[400px] resize-none bg-transparent border-0 focus-visible:ring-0 text-sm text-foreground leading-relaxed ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
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
                {/* Comments Panel */}
                {rightPanel === "comments" && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Comments</h3>
                      <button onClick={() => setRightPanel("none")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="mb-4">
                      <Textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder={`Comment on ${currentSection.label}...`}
                        className="bg-secondary/30 border-border/30 min-h-[60px] text-xs" />
                      <Button size="sm" className="w-full mt-2 h-7 text-xs" onClick={addComment} disabled={!newComment.trim()}>Add Comment</Button>
                    </div>
                    <div className="space-y-3">
                      {currentSectionComments.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No comments on this section</p>
                      )}
                      {currentSectionComments.map(c => (
                        <div key={c.id} className={`p-2 rounded-lg border ${c.resolved ? "border-border/10 opacity-60" : "border-border/30"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-semibold text-primary">{c.avatar}</div>
                            <span className="text-[10px] font-medium text-foreground">{c.created_by}</span>
                            <span className="text-[9px] text-muted-foreground ml-auto">{c.created_at}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.content}</p>
                          {!c.resolved && (
                            <Button size="sm" variant="ghost" className="h-5 text-[9px] text-success mt-1 px-1" onClick={() => resolveComment(c.id)}>
                              <CheckCircle className="h-2.5 w-2.5 mr-1" /> Resolve
                            </Button>
                          )}
                          {c.resolved && <span className="text-[9px] text-success">✓ Resolved</span>}
                        </div>
                      ))}
                    </div>
                    {/* All comments */}
                    {comments.filter(c => c.section_key !== sections[activeSection].key && !c.resolved).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Other Sections</h4>
                        {comments.filter(c => c.section_key !== sections[activeSection].key && !c.resolved).map(c => (
                          <div key={c.id} className="p-2 rounded-lg border border-border/20 mb-2">
                            <Badge variant="outline" className="text-[8px] h-4 mb-1">{sections.find(s => s.key === c.section_key)?.label}</Badge>
                            <p className="text-[10px] text-muted-foreground">{c.content}</p>
                            <span className="text-[9px] text-muted-foreground/60">{c.created_by} · {c.created_at}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Version History Panel */}
                {rightPanel === "history" && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Version History</h3>
                      <button onClick={() => setRightPanel("none")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="space-y-3">
                      {mockVersions.map((v, i) => (
                        <div key={v.id} className={`p-3 rounded-lg border ${i === 0 ? "border-primary/30 bg-primary/5" : "border-border/20"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground">v{v.version_number}</span>
                            <span className="text-[9px] text-muted-foreground">{v.created_at}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{v.change_summary}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[9px] text-muted-foreground">{v.word_count} words · by {v.created_by}</span>
                            {i > 0 && (
                              <Button size="sm" variant="ghost" className="h-5 text-[9px] px-2">Restore</Button>
                            )}
                          </div>
                          {i === 0 && <Badge className="mt-1 text-[8px] h-4 bg-primary/15 text-primary">Current</Badge>}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Score Panel */}
                {rightPanel === "score" && scoreResult && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Proposal Health</h3>
                      <button onClick={() => setRightPanel("none")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex justify-center mb-4">
                      <MatchScoreRing score={scoreResult.overall_score} size="lg" />
                    </div>
                    <div className="space-y-2 mb-4">
                      {[
                        { label: "Executive Summary", score: scoreResult.executive_summary_score },
                        { label: "Problem Statement", score: scoreResult.problem_statement_score },
                        { label: "Objectives", score: scoreResult.objectives_score },
                        { label: "Methodology", score: scoreResult.methodology_score },
                        { label: "Impact / M&E", score: scoreResult.impact_score },
                        { label: "Budget", score: scoreResult.budget_score },
                        { label: "Org Capacity", score: scoreResult.organisation_score },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="text-foreground font-medium">{item.score}%</span>
                          </div>
                          <Progress value={item.score} className="h-1" />
                        </div>
                      ))}
                    </div>
                    {scoreResult.funder_alignment_note && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                        <p className="text-[10px] text-foreground">{scoreResult.funder_alignment_note}</p>
                      </div>
                    )}
                    {scoreResult.strengths?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[10px] font-semibold text-success uppercase mb-2">Strengths</h4>
                        {scoreResult.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-1.5 mb-1">
                            <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />
                            <span className="text-[10px] text-muted-foreground">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {scoreResult.improvements?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-accent-amber uppercase mb-2">Improve</h4>
                        {scoreResult.improvements.map((imp, i) => (
                          <div key={i} className="p-2 rounded-lg bg-accent-amber/5 border border-accent-amber/20 mb-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-amber/15 text-accent-amber font-medium">{imp.section}</span>
                            <p className="text-[10px] text-muted-foreground mt-1">{imp.issue}</p>
                            <p className="text-[10px] text-foreground mt-1">{imp.suggestion}</p>
                          </div>
                        ))}
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
