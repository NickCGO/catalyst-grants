import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Download, Loader2, Sparkles, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { callAI } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";

type Step = "select" | "format" | "input" | "preview";

const formats = [
  { id: "narrative", label: "Narrative Report", desc: "Prose-based, suitable for community funders", icon: "📝" },
  { id: "logframe", label: "Logframe Report", desc: "Table-based, objectives vs achievements", icon: "📊" },
  { id: "results_framework", label: "Results Framework", desc: "Outcomes-focused, theory of change mapping", icon: "🎯" },
];

const sampleReports = [
  { id: "1", project: "Youth Education Initiative", funder: "DG Murray Trust", period: "Q1 2026: Jan–Mar", status: "draft" },
  { id: "2", project: "Community Health Programme", funder: "Anglo American", period: "Q4 2025: Oct–Dec", status: "submitted" },
];

const sampleGrants = [
  { id: "1", funder: "ABSA Foundation", project: "Education Outreach", period: "Q1 2026" },
  { id: "2", funder: "National Lotteries Commission", project: "Sports for Change", period: "Q1 2026" },
];

const ReportsPage = () => {
  const [step, setStep] = useState<Step>("select");
  const [showNew, setShowNew] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [projectUpdates, setProjectUpdates] = useState("");
  const [generatedReport, setGeneratedReport] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const grant = sampleGrants.find(g => g.id === selectedGrant);
      const result = await callAI([
        { role: "system", content: `You are an expert NGO impact report writer. Generate a professional ${selectedFormat} impact report. Professional tone, specific, evidence-referenced. Return clean HTML.` },
        { role: "user", content: `Generate a ${selectedFormat} impact report for Elizayo Foundation reporting to ${grant?.funder}. Project: ${grant?.project}. Period: ${grant?.period}. Updates: ${projectUpdates}. Maximum 1000 words for narrative. Return as clean HTML.` },
      ]);
      setGeneratedReport(result);
      setStep("preview");
    } catch {
      toast({ title: "Generation failed", description: "Try again.", variant: "destructive" });
    }
    setGenerating(false);
  };

  if (showNew) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => { setShowNew(false); setStep("select"); }} className="mb-4 text-muted-foreground">
            ← Back to reports
          </Button>

          {step === "select" && (
            <GlassCard hoverable={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Step 1: Select Grant</h2>
              <div className="space-y-2">
                {sampleGrants.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGrant(g.id); setStep("format"); }}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedGrant === g.id ? "border-primary bg-primary/5" : "border-border/30 hover:bg-secondary/30"
                    }`}
                  >
                    <div className="text-sm font-medium text-foreground">{g.funder}</div>
                    <div className="text-xs text-muted-foreground">{g.project} · {g.period}</div>
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {step === "format" && (
            <GlassCard hoverable={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Step 2: Choose Report Format</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {formats.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedFormat(f.id); setStep("input"); }}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selectedFormat === f.id ? "border-primary bg-primary/5" : "border-border/30 hover:bg-secondary/30"
                    }`}
                  >
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-sm font-medium text-foreground">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{f.desc}</div>
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {step === "input" && (
            <GlassCard hoverable={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Step 3: Project Updates</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Tell us what happened this quarter. Include: activities completed, people reached, challenges faced, stories of impact.
              </p>
              <Textarea
                value={projectUpdates}
                onChange={(e) => setProjectUpdates(e.target.value)}
                placeholder="We reached 250 young people through our AfterSchool programme. Key highlights include..."
                className="min-h-[200px] bg-secondary/30 border-border/50"
              />
              <Button
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={generateReport}
                disabled={generating || !projectUpdates.trim()}
              >
                {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Generate Report
              </Button>
            </GlassCard>
          )}

          {step === "preview" && (
            <GlassCard hoverable={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Generated Report</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs border-border/50" onClick={() => window.print()}>
                    <Download className="h-3 w-3 mr-1" /> Download PDF
                  </Button>
                  <Button size="sm" className="text-xs bg-success text-success-foreground hover:bg-success/90">
                    <CheckCircle className="h-3 w-3 mr-1" /> Mark Submitted
                  </Button>
                </div>
              </div>
              <div
                className="prose prose-sm prose-invert max-w-none p-6 rounded-lg bg-secondary/20 border border-border/30"
                dangerouslySetInnerHTML={{ __html: generatedReport }}
              />
            </GlassCard>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Impact Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI-generated donor reports in multiple formats</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Report
          </Button>
        </div>

        <div className="space-y-3">
          {sampleReports.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{r.project}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.funder} · {r.period}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary">Open →</Button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
