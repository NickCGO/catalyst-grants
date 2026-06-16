import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Download, Sparkles, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { callAI } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useOrganisation } from "@/hooks/useAuth";
import { hints } from "@/lib/formHints";
import AfricaSpinner from "../components/AfricaSpinner";

type Step = "select" | "format" | "input" | "preview";

const formats = [
  { id: "narrative", label: "Narrative Report", desc: "Prose-based, suitable for community funders", icon: "📝" },
  { id: "logframe", label: "Logframe Report", desc: "Table-based, objectives vs achievements", icon: "📊" },
  { id: "results_framework", label: "Results Framework", desc: "Outcomes-focused, theory of change mapping", icon: "🎯" },
];

const ReportsPage = () => {
  const { user } = useAuth();
  const { org } = useOrganisation();
  const [step, setStep] = useState<Step>("select");
  const [showNew, setShowNew] = useState(false);
  const [selectedApp, setSelectedApp] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [projectUpdates, setProjectUpdates] = useState("");
  const [generatedReport, setGeneratedReport] = useState("");
  const [generating, setGenerating] = useState(false);

  // Real data
  const [reports, setReports] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    const load = async () => {
      const [reportsRes, appsRes] = await Promise.all([
        supabase.from("impact_reports").select("*, funders(donor_name)").eq("org_id", org.id).order("created_at", { ascending: false }),
        supabase.from("applications").select("*, funders(donor_name)").eq("org_id", org.id).in("status", ["successful", "report_due", "submitted"]),
      ]);
      setReports(reportsRes.data || []);
      setApplications(appsRes.data || []);
      setLoading(false);
    };
    load();
  }, [org]);

  const generateReport = async () => {
    if (!org) return;
    setGenerating(true);
    try {
      const app = applications.find(a => a.id === selectedApp);
      const funderName = app?.funders?.donor_name || "the funder";
      const result = await callAI([
        { role: "system", content: `You are an expert NGO impact report writer. Generate a professional ${selectedFormat} impact report. Professional tone, specific, evidence-referenced. Return clean HTML.` },
        { role: "user", content: `Generate a ${selectedFormat} impact report for ${org.name} reporting to ${funderName}. Project: ${app?.project_name || "Grant Project"}. Updates: ${projectUpdates}. Maximum 1000 words for narrative. Return as clean HTML.` },
      ]);
      setGeneratedReport(result);

      // Save to database
      await supabase.from("impact_reports").insert({
        org_id: org.id,
        application_id: selectedApp || null,
        funder_id: app?.funder_id || null,
        report_format: selectedFormat,
        project_updates: projectUpdates,
        generated_report: result,
        status: "draft",
      });

      setStep("preview");
      toast({ title: "Report generated!" });
    } catch {
      toast({ title: "Generation failed", description: "Try again.", variant: "destructive" });
    }
    setGenerating(false);
  };

  const markSubmitted = async (reportId: string) => {
    await supabase.from("impact_reports").update({ status: "submitted" }).eq("id", reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: "submitted" } : r));
    toast({ title: "Report marked as submitted" });
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
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No successful or report-due applications found. Apply to funders first.</p>
              ) : (
                <div className="space-y-2">
                  {applications.map(app => (
                    <button key={app.id} onClick={() => { setSelectedApp(app.id); setStep("format"); }}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedApp === app.id ? "border-primary bg-primary/5" : "border-border/30 hover:bg-secondary/30"
                      }`}>
                      <div className="text-sm font-medium text-foreground">{app.funders?.donor_name || "Unknown Funder"}</div>
                      <div className="text-xs text-muted-foreground">{app.project_name || "Grant application"} · {app.status}</div>
                    </button>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {step === "format" && (
            <GlassCard hoverable={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Step 2: Choose Report Format</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {formats.map(f => (
                  <button key={f.id} onClick={() => { setSelectedFormat(f.id); setStep("input"); }}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selectedFormat === f.id ? "border-primary bg-primary/5" : "border-border/30 hover:bg-secondary/30"
                    }`}>
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
              <Textarea value={projectUpdates} onChange={e => setProjectUpdates(e.target.value)}
                placeholder="We reached 250 young people through our AfterSchool programme. Key highlights include..."
                className="min-h-[200px] bg-secondary/30 border-border/50" />
              <p className="text-[10px] text-muted-foreground mt-1">{hints.report.projectUpdates}</p>
              <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={generateReport} disabled={generating || !projectUpdates.trim()}>
                {generating ? <AfricaSpinner className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
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
                  <Button size="sm" className="text-xs bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => { setShowNew(false); toast({ title: "Report saved!" }); }}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Done
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm prose-invert max-w-none p-6 rounded-lg bg-secondary/20 border border-border/30"
                dangerouslySetInnerHTML={{ __html: generatedReport }} />
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

        {loading ? (
          <div className="flex justify-center py-12"><AfricaSpinner className="h-6 w-6 animate-spin text-primary" /></div>
        ) : reports.length === 0 ? (
          <GlassCard hoverable={false}>
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-1">No reports yet</h3>
              <p className="text-xs text-muted-foreground mb-4">Generate your first impact report for a successful grant.</p>
              <Button size="sm" onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground">
                <Plus className="h-3 w-3 mr-1" /> New Report
              </Button>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {reports.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{r.funders?.donor_name || "Impact Report"}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{r.report_format} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  {r.status === "draft" && (
                    <Button variant="ghost" size="sm" className="text-xs text-success" onClick={() => markSubmitted(r.id)}>
                      Mark Submitted
                    </Button>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
