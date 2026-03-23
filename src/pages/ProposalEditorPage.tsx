import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, CheckCircle, Circle, Loader2, BarChart3, ChevronRight, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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

  const funder = { name: "DG Murray Trust", focus: "Education innovation and leadership development", category: "SA Trusts/ Foundations", method: "Concept Note" };
  const org = { name: "Elizayo Foundation", mission: "Empowering youth through education and community development in Western Cape", programmes: ["AfterSchool", "ECD", "Youth Development"], focusAreas: ["Education", "Youth", "Community Development"], country: "South Africa", region: "Western Cape" };

  const wordCount = (text: string) => text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const totalWords = Object.values(sectionContent).reduce((sum, t) => sum + wordCount(t), 0);
  const completedSections = sections.filter(s => wordCount(sectionContent[s.key] || "") > 20).length;

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
        (delta) => {
          content += delta;
          setSectionContent(prev => ({ ...prev, [section.key]: content }));
        },
        () => {
          setGenerating(false);
          setGeneratingSection(null);
          setAiGenerated(prev => new Set(prev).add(section.key));
          toast({ title: `${section.label} generated`, description: "Review and edit as needed." });
        },
      );
    } catch (err) {
      setGenerating(false);
      setGeneratingSection(null);
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
    } catch (err) {
      toast({ title: "Generation failed", description: "Try again.", variant: "destructive" });
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
      setShowScore(true);
    } catch (err) {
      toast({ title: "Scoring failed", description: "Try again.", variant: "destructive" });
    }
    setScoring(false);
  }, [sectionContent]);

  const currentSection = sections[activeSection];

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
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                      i === activeSection
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
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
                    {wc > 0 && <span className="text-[9px] text-muted-foreground">{wc}w</span>}
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
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={generating || generatingAll}
              onClick={() => generateSection(activeSection)}
            >
              {generatingSection === activeSection ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1" />
              )}
              Generate Section
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border/50"
              disabled={generating || generatingAll}
              onClick={generateAll}
            >
              {generatingAll ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1" />
              )}
              Generate Full Proposal
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border/50"
              disabled={scoring || totalWords < 100}
              onClick={scoreProposal}
            >
              {scoring ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
              )}
              Score Proposal
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">
              {funder.name} · {funder.method}
            </div>
          </div>

          {/* Editor Area */}
          <GlassCard hoverable={false} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h2 className="text-sm font-semibold text-foreground">{currentSection.label}</h2>
              <div className="flex items-center gap-2">
                {aiGenerated.has(currentSection.key) && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-primary/15 text-primary font-medium">
                    AI generated
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {wordCount(sectionContent[currentSection.key] || "")} words
                </span>
              </div>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={sectionContent[currentSection.key] || ""}
                onChange={(e) => {
                  setSectionContent(prev => ({ ...prev, [currentSection.key]: e.target.value }));
                  if (aiGenerated.has(currentSection.key)) {
                    setAiGenerated(prev => { const s = new Set(prev); s.delete(currentSection.key); return s; });
                  }
                }}
                placeholder={currentSection.placeholder}
                className="h-full min-h-[400px] resize-none bg-transparent border-0 focus-visible:ring-0 text-sm text-foreground leading-relaxed"
              />
            </div>
          </GlassCard>

          {/* Section nav (mobile) */}
          <div className="flex gap-1 mt-3 overflow-x-auto lg:hidden">
            {sections.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(i)}
                className={`px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap ${
                  i === activeSection ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Score Panel */}
        <AnimatePresence>
          {showScore && scoreResult && (
            <motion.div
              className="w-72 shrink-0 hidden xl:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard hoverable={false} className="h-full overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Proposal Health</h3>
                  <button onClick={() => setShowScore(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
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
                  ].map((item) => (
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
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-amber/15 text-accent-amber font-medium">
                          {imp.section}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">{imp.issue}</p>
                        <p className="text-[10px] text-foreground mt-1">{imp.suggestion}</p>
                      </div>
                    ))}
                  </div>
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
