import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, DollarSign, Target, Award, FileText,
  Download, BarChart3, Users, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend,
} from "recharts";

// Mock data for analytics
const funnelData = [
  { name: "Saved", value: 124, fill: "hsl(var(--primary))" },
  { name: "Applied", value: 67, fill: "hsl(var(--chart-2))" },
  { name: "Submitted", value: 42, fill: "hsl(var(--chart-3))" },
  { name: "Shortlisted", value: 18, fill: "hsl(var(--chart-4))" },
  { name: "Successful", value: 11, fill: "hsl(var(--chart-5))" },
];

const categoryData = [
  { name: "SA Corporate", applications: 28, awarded: 12, winRate: 43 },
  { name: "SA Trusts", applications: 19, awarded: 6, winRate: 32 },
  { name: "UK", applications: 11, awarded: 4, winRate: 36 },
  { name: "USA", applications: 5, awarded: 2, winRate: 40 },
  { name: "Europe", applications: 8, awarded: 3, winRate: 38 },
  { name: "Other", applications: 4, awarded: 1, winRate: 25 },
];

const monthlyData = [
  { month: "Jul", submitted: 4, successful: 1 },
  { month: "Aug", submitted: 2, successful: 0 },
  { month: "Sep", submitted: 6, successful: 2 },
  { month: "Oct", submitted: 5, successful: 3 },
  { month: "Nov", submitted: 8, successful: 2 },
  { month: "Dec", submitted: 3, successful: 1 },
  { month: "Jan", submitted: 7, successful: 3 },
  { month: "Feb", submitted: 6, successful: 2 },
  { month: "Mar", submitted: 9, successful: 4 },
  { month: "Apr", submitted: 5, successful: 2 },
  { month: "May", submitted: 7, successful: 3 },
  { month: "Jun", submitted: 4, successful: 1 },
];

const proposalScoreData = [
  { name: "Proposal 1", score: 58 },
  { name: "Proposal 2", score: 62 },
  { name: "Proposal 3", score: 71 },
  { name: "Proposal 4", score: 68 },
  { name: "Proposal 5", score: 75 },
  { name: "Proposal 6", score: 82 },
  { name: "Proposal 7", score: 79 },
  { name: "Proposal 8", score: 85 },
];

const heatmapData = Array.from({ length: 12 }, (_, m) =>
  Array.from({ length: 4 }, (_, w) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m],
    week: w + 1,
    value: Math.floor(Math.random() * 5),
  }))
).flat();

const funderPerformance = [
  { name: "DG Murray Trust", category: "SA Trusts", applied: "R500,000", awarded: "R200,000", winRate: "40%", avgScore: 82, relationship: "Strong" },
  { name: "Anglo American", category: "SACorp", applied: "R1,200,000", awarded: "R800,000", winRate: "67%", avgScore: 88, relationship: "Strategic" },
  { name: "National Lotteries", category: "SA Trusts", applied: "R750,000", awarded: "R0", winRate: "0%", avgScore: 61, relationship: "Prospect" },
  { name: "Comic Relief", category: "UK", applied: "R350,000", awarded: "R350,000", winRate: "100%", avgScore: 91, relationship: "Active" },
  { name: "USAID", category: "USA", applied: "R2,000,000", awarded: "R0", winRate: "0%", avgScore: 72, relationship: "Contacted" },
];

const teamData = [
  { name: "Sarah M.", proposals: 12, applications: 8, avgScore: 81, tasks: 24 },
  { name: "James K.", proposals: 8, applications: 5, avgScore: 76, tasks: 18 },
  { name: "Thabo N.", proposals: 5, applications: 3, avgScore: 84, tasks: 12 },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

const AnalyticsPage = () => {
  const [period, setPeriod] = useState("6months");
  const [generating, setGenerating] = useState(false);

  const generateBoardReport = async () => {
    setGenerating(true);
    try {
      const report = await callAI([
        { role: "system", content: "You are a professional NGO board report writer." },
        { role: "user", content: `Generate a concise board report for an NGO's fundraising performance.
Period: Last 6 months
Data: 67 applications, 42 submitted, 11 successful, win rate 26%, R3.2M applied, R1.35M awarded, avg proposal score 76.
Top category: SA Corporate (43% win rate).
Write in professional nonprofit board report style. Include: Executive Summary (3 sentences), Key Achievements, Challenges, Looking Ahead. Max 600 words.` },
      ]);
      const blob = new Blob([report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "board-report.txt";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Board report downloaded");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Analytics & Intelligence</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your funding performance and trends</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateBoardReport} disabled={generating} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {generating ? "Generating…" : "Board Report"}
            </Button>
          </div>
        </div>

        {/* Section 1: KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Pipeline Value", value: "R3.2M", sub: "↑ 23% vs last period", icon: DollarSign, color: "text-primary" },
            { label: "Total Awarded", value: "R1.35M", sub: "from 11 funders", icon: Award, color: "text-emerald-400" },
            { label: "Win Rate", value: "26%", sub: "platform avg: 34%", icon: Target, color: "text-amber-400" },
            { label: "Applications", value: "67", sub: "42 submitted, 25 in progress", icon: FileText, color: "text-primary" },
            { label: "Avg Proposal Score", value: "76", sub: "↑ 8pts vs last period", icon: TrendingUp, color: "text-emerald-400" },
          ].map((kpi) => (
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

        {/* Section 2: Application Funnel */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Application Funnel</h2>
          <div className="flex items-end gap-2 h-48">
            {funnelData.map((stage, i) => {
              const maxVal = funnelData[0].value;
              const pct = (stage.value / maxVal) * 100;
              const dropoff = i > 0 ? Math.round((1 - stage.value / funnelData[i - 1].value) * 100) : 0;
              return (
                <Tooltip key={stage.name}>
                  <TooltipTrigger asChild>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-foreground">{stage.value}</span>
                      <div
                        className="w-full rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${pct}%`, backgroundColor: stage.fill, minHeight: 20 }}
                      />
                      <span className="text-[10px] text-muted-foreground">{stage.name}</span>
                      {i > 0 && <span className="text-[9px] text-destructive">-{dropoff}%</span>}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{stage.name}: {stage.value} applications</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </GlassCard>

        {/* Section 3: Two-column charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Funding by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="applications" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Monthly Activity</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="submitted" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Submitted" />
                <Bar dataKey="successful" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Successful" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Section 4: Funder Performance Table */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Funder Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {["Funder", "Category", "Applied", "Awarded", "Win Rate", "Avg Score", "Relationship"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funderPerformance.map((f) => (
                  <tr key={f.name} className="border-b border-border/10 hover:bg-secondary/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{f.name}</td>
                    <td className="py-2.5 px-3"><Badge variant="outline" className="text-[10px]">{f.category}</Badge></td>
                    <td className="py-2.5 px-3 text-muted-foreground">{f.applied}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{f.awarded}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{f.winRate}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8"><MatchScoreRing score={f.avgScore} size="sm" /></div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={f.relationship === "Strong" || f.relationship === "Strategic" ? "default" : "secondary"} className="text-[10px]">
                        {f.relationship}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-primary mt-3">💡 Your best-performing funder category is SA Corporate (43% win rate). Focus here first when new grants open.</p>
        </GlassCard>

        {/* Section 5: Seasonal Intelligence Heatmap */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Seasonal Intelligence
          </h2>
          <div className="grid grid-cols-12 gap-1">
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
              <div key={m} className="text-center">
                <span className="text-[9px] text-muted-foreground">{m}</span>
                <div className="space-y-1 mt-1">
                  {[0, 1, 2, 3].map((w) => {
                    const d = heatmapData.find((h) => h.month === m && h.week === w + 1);
                    const intensity = d ? d.value / 4 : 0;
                    return (
                      <div
                        key={w}
                        className="h-4 w-full rounded-sm"
                        style={{
                          backgroundColor: intensity > 0 ? `hsl(var(--primary) / ${0.15 + intensity * 0.85})` : "hsl(var(--muted) / 0.3)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-400 mt-3">💡 Your quietest periods are July–August, but 47 matched funders accept applications then. Consider building a pipeline for this period.</p>
        </GlassCard>

        {/* Section 6: Proposal Quality Trends */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Proposal Quality Trends</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={proposalScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-emerald-400 mt-2">📈 Your average proposal score has improved by 14 points over 6 months. Most improved section: Methodology (+22 pts).</p>
        </GlassCard>

        {/* Section 7: Team Productivity */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" /> Team Productivity
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {["Team Member", "Proposals Written", "Applications Managed", "Avg Score", "Tasks Completed"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamData.map((t) => (
                  <tr key={t.name} className="border-b border-border/10">
                    <td className="py-2.5 px-3 font-medium text-foreground">{t.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{t.proposals}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{t.applications}</td>
                    <td className="py-2.5 px-3"><MatchScoreRing score={t.avgScore} size="sm" /></td>
                    <td className="py-2.5 px-3 text-muted-foreground">{t.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Section 8: Partnership Analytics placeholder */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Partnership Analytics
          </h2>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No partnership activity yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Form your first consortium to see analytics here.</p>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
