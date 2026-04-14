import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp, DollarSign, Target, Award, FileText, Download, BarChart3, Users, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend,
} from "recharts";

const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))",
];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({ pipeline: 0, awarded: 0, winRate: 0, totalApps: 0, avgScore: 0, submitted: 0, inProgress: 0, successfulCount: 0, deniedCount: 0 });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [funderPerf, setFunderPerf] = useState<any[]>([]);
  const [proposalScores, setProposalScores] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) { setLoading(false); return; }

      const [{ data: apps }, { data: proposals }] = await Promise.all([
        supabase.from("applications").select("*").eq("org_id", org.id),
        supabase.from("proposals").select("id, ai_score, funder_id, created_at").eq("org_id", org.id),
      ]);

      const allApps = apps || [];
      const successful = allApps.filter(a => a.status === "successful");
      const denied = allApps.filter(a => a.status === "denied");
      const submitted = allApps.filter(a => ["submitted", "successful", "denied"].includes(a.status || ""));
      const inProg = allApps.filter(a => ["in_progress", "submitted", "follow_up"].includes(a.status || ""));
      const pipeline = inProg.reduce((s, a) => s + Number(a.amount_requested || 0), 0);
      const awardedTotal = successful.reduce((s, a) => s + Number(a.amount_awarded || 0), 0);
      const decided = successful.length + denied.length;
      const winRate = decided > 0 ? Math.round((successful.length / decided) * 100) : 0;
      const scores = (proposals || []).filter(p => p.ai_score).map(p => p.ai_score!);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      setStats({ pipeline, awarded: awardedTotal, winRate, totalApps: allApps.length, avgScore, submitted: submitted.length, inProgress: inProg.length, successfulCount: successful.length, deniedCount: denied.length });

      // Category breakdown
      const funderIds = [...new Set(allApps.map(a => a.funder_id).filter(Boolean))];
      if (funderIds.length > 0) {
        const { data: funders } = await supabase.from("funders").select("id, donor_name, category").in("id", funderIds as string[]);
        const fMap = Object.fromEntries((funders || []).map(f => [f.id, f]));
        const catMap: Record<string, { applications: number; awarded: number; successful: number }> = {};
        allApps.forEach(a => {
          const cat = a.funder_id ? fMap[a.funder_id]?.category || "Other" : "Other";
          if (!catMap[cat]) catMap[cat] = { applications: 0, awarded: 0, successful: 0 };
          catMap[cat].applications++;
          if (a.status === "successful") { catMap[cat].awarded += Number(a.amount_awarded || 0); catMap[cat].successful++; }
        });
        setCategoryData(Object.entries(catMap).map(([name, v]) => ({ name: name.replace("/ ", "/"), ...v, winRate: v.applications > 0 ? Math.round((v.successful / v.applications) * 100) : 0 })));

        // Funder performance
        const perfMap: Record<string, { name: string; category: string; applied: number; awarded: number; count: number; successful: number }> = {};
        allApps.forEach(a => {
          if (!a.funder_id) return;
          const f = fMap[a.funder_id];
          if (!f) return;
          if (!perfMap[a.funder_id]) perfMap[a.funder_id] = { name: f.donor_name, category: f.category || "", applied: 0, awarded: 0, count: 0, successful: 0 };
          perfMap[a.funder_id].applied += Number(a.amount_requested || 0);
          perfMap[a.funder_id].awarded += Number(a.amount_awarded || 0);
          perfMap[a.funder_id].count++;
          if (a.status === "successful") perfMap[a.funder_id].successful++;
        });
        setFunderPerf(Object.values(perfMap).sort((a, b) => b.applied - a.applied).slice(0, 10));
      }

      // Proposal scores
      const scored = (proposals || []).filter(p => p.ai_score).sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
      setProposalScores(scored.map((p, i) => ({ name: `#${i + 1}`, score: p.ai_score })));

      setLoading(false);
    };
    load();
  }, [user]);

  const formatCurrency = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

  const generateBoardReport = async () => {
    setGenerating(true);
    try {
      const report = await callAI([
        { role: "system", content: "You are a professional NGO board report writer." },
        { role: "user", content: `Generate a concise board report. Data: ${stats.totalApps} applications, ${stats.submitted} submitted, ${stats.successfulCount} successful, win rate ${stats.winRate}%, $${stats.pipeline} pipeline, $${stats.awarded} awarded, avg score ${stats.avgScore}. Max 600 words.` },
      ]);
      const blob = new Blob([report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "board-report.txt"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Board report downloaded");
    } catch { toast.error("Failed to generate report"); } finally { setGenerating(false); }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Analytics & Intelligence</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your funding performance</p>
          </div>
          <Button onClick={generateBoardReport} disabled={generating} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {generating ? "Generating…" : "Board Report"}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Pipeline Value", value: formatCurrency(stats.pipeline), sub: `${stats.inProgress} in progress`, icon: DollarSign, color: "text-primary" },
            { label: "Win Rate", value: `${stats.winRate}%`, sub: `${stats.successfulCount}W / ${stats.deniedCount}L`, icon: Target, color: "text-amber-400" },
            { label: "Applications", value: String(stats.totalApps), sub: `${stats.submitted} submitted`, icon: FileText, color: "text-primary" },
            { label: "Successful Grants", value: String(stats.successfulCount), sub: `from ${stats.totalApps} total`, icon: Award, color: "text-emerald-400" },
            { label: "Avg Proposal Score", value: String(stats.avgScore || "—"), sub: proposalScores.length > 0 ? `from ${proposalScores.length} scored` : "No scores yet", icon: TrendingUp, color: "text-emerald-400" },
          ].map(kpi => (
            <GlassCard key={kpi.label} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</div>
            </GlassCard>
          ))}
        </div>

        {stats.totalApps === 0 ? (
          <GlassCard className="p-8 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No application data yet. Start applying to grants to see analytics here.</p>
          </GlassCard>
        ) : (
          <>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categoryData.length > 0 && (
                <GlassCard className="p-6">
                  <h2 className="text-sm font-semibold text-foreground mb-4">Funding by Category</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="applications" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>
              )}

              {proposalScores.length > 0 && (
                <GlassCard className="p-6">
                  <h2 className="text-sm font-semibold text-foreground mb-4">Proposal Quality Trends</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={proposalScores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </GlassCard>
              )}
            </div>

            {/* Funder Performance */}
            {funderPerf.length > 0 && (
              <GlassCard className="p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Funder Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        {["Funder", "Category", "Applied", "Awarded", "Win Rate"].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {funderPerf.map(f => (
                        <tr key={f.name} className="border-b border-border/10 hover:bg-secondary/20">
                          <td className="py-2.5 px-3 font-medium text-foreground">{f.name}</td>
                          <td className="py-2.5 px-3"><Badge variant="outline" className="text-[10px]">{f.category}</Badge></td>
                          <td className="py-2.5 px-3 text-muted-foreground">{formatCurrency(f.applied)}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{formatCurrency(f.awarded)}</td>
                          <td className="py-2.5 px-3 font-medium text-foreground">{f.count > 0 ? Math.round((f.successful / f.count) * 100) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
