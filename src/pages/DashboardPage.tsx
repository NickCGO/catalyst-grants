import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Clock, CheckCircle, AlertTriangle, Plus, Heart, Calendar } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import StatusBadge from "@/components/StatusBadge";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SubmissionTracker from "@/components/SubmissionTracker";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation } from "@/hooks/useAuth";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

const DashboardPage = () => {
  const { org, loading: orgLoading } = useOrganisation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matchedCount, setMatchedCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [deadlinesCount, setDeadlinesCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [kanbanData, setKanbanData] = useState<{ title: string; column: string; items: any[] }[]>([
    { title: "Backlog", column: "backlog", items: [] },
    { title: "In Progress", column: "in_progress", items: [] },
    { title: "Submitted", column: "submitted", items: [] },
    { title: "Closed", column: "closed", items: [] },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [deadlineIntel, setDeadlineIntel] = useState<any[]>([]);

  useEffect(() => {
    if (orgLoading || !org?.id) { if (!orgLoading) setLoading(false); return; }
    loadDashboard(org.id);
  }, [org?.id, orgLoading]);

  async function loadDashboard(orgId: string) {
    setLoading(true);
    try {
      const [matchRes, appsRes, proposalRes, deadlineRes] = await Promise.all([
        supabase.from("grant_matches").select("funder_id, match_score").eq("org_id", orgId),
        supabase.from("applications").select("id, funder_id, status, kanban_column, project_name, deadline, amount_requested, updated_at").eq("org_id", orgId).order("updated_at", { ascending: false }),
        supabase.from("proposals").select("ai_score").eq("org_id", orgId).not("ai_score", "is", null),
        supabase.from("deadline_intelligence").select("funder_id, deadline_date, estimated_writing_days, recommended_start_date, priority_score, workload_conflict, conflict_detail, ai_recommendation").eq("org_id", orgId).order("priority_score", { ascending: false }).limit(5),
      ]);

      const matches = matchRes.data || [];
      const apps = appsRes.data || [];
      const proposals = proposalRes.data || [];
      const deadlines = deadlineRes.data || [];

      setMatchedCount(matches.filter(m => (m.match_score || 0) >= 60).length);
      setInProgressCount(apps.filter(a => ["in_progress", "submitted", "follow_up"].includes(a.status || "")).length);
      setCompletedCount(apps.filter(a => ["successful", "denied"].includes(a.status || "")).length);

      if (proposals.length > 0) {
        setAvgScore(Math.round(proposals.reduce((s, p) => s + (p.ai_score || 0), 0) / proposals.length));
      }

      const currentMonth = MONTH_KEYS[new Date().getMonth()];
      const matchedFunderIds = matches.filter(m => (m.match_score || 0) >= 60).map(m => m.funder_id).filter(Boolean);
      if (matchedFunderIds.length > 0) {
        const { data: windows } = await supabase.from("funder_windows").select("funder_id").in("funder_id", matchedFunderIds.slice(0, 100)).eq(currentMonth, true);
        setDeadlinesCount((windows || []).length);
      }

      const appFunderIds = [...new Set(apps.map(a => a.funder_id).filter(Boolean))];
      let funderNames: Record<string, string> = {};
      if (appFunderIds.length > 0) {
        const { data: funders } = await supabase.from("funders").select("id, donor_name").in("id", appFunderIds);
        (funders || []).forEach(f => { funderNames[f.id] = f.donor_name; });
      }

      const matchMap: Record<string, number> = {};
      matches.forEach(m => { if (m.funder_id) matchMap[m.funder_id] = m.match_score || 0; });

      const columns = [
        { title: "Backlog", column: "backlog", items: [] as any[] },
        { title: "In Progress", column: "in_progress", items: [] as any[] },
        { title: "Submitted", column: "submitted", items: [] as any[] },
        { title: "Closed", column: "closed", items: [] as any[] },
      ];

      apps.forEach(app => {
        const col = app.kanban_column || "backlog";
        const isClosedStatus = ["successful", "denied"].includes(app.status || "");
        const targetCol = isClosedStatus ? "closed" : col;
        const colObj = columns.find(c => c.column === targetCol) || columns[0];
        colObj.items.push({
          id: app.id,
          funder: funderNames[app.funder_id || ""] || app.project_name || "Unknown",
          area: app.project_name || "",
          score: matchMap[app.funder_id || ""] || 0,
          deadline: app.deadline,
          status: app.status || "pending",
        });
      });

      setKanbanData(columns);

      if (deadlines.length > 0) {
        const dlFunderIds = deadlines.map(d => d.funder_id).filter(Boolean);
        let dlFunderNames: Record<string, string> = {};
        if (dlFunderIds.length > 0) {
          const { data: fdata } = await supabase.from("funders").select("id, donor_name").in("id", dlFunderIds);
          (fdata || []).forEach(f => { dlFunderNames[f.id] = f.donor_name; });
        }
        setDeadlineIntel(deadlines.map(d => ({
          funder: dlFunderNames[d.funder_id || ""] || "Unknown",
          window: d.deadline_date ? new Date(d.deadline_date).toLocaleDateString("en-ZA", { month: "short" }) : "—",
          days: d.estimated_writing_days || 5,
          startBy: d.recommended_start_date ? new Date(d.recommended_start_date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }) : "—",
          priority: d.priority_score || 3,
          conflict: d.workload_conflict || false,
          recommendation: d.ai_recommendation || "",
        })));
      }

      setRecentActivity(apps.slice(0, 5).map(a => ({
        funder: funderNames[a.funder_id || ""] || a.project_name || "Unknown",
        action: `Status: ${a.status || "pending"}`,
        time: a.updated_at ? formatTimeAgo(new Date(a.updated_at)) : "",
        type: a.status === "successful" ? "status" : a.status === "denied" ? "status" : "ai",
      })));

    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    { label: "Matched Grants", value: matchedCount, icon: Target, glow: "blue" as const, desc: "Score ≥60%", suffix: "", link: "/grants" },
    { label: "In Progress", value: inProgressCount, icon: Clock, glow: "amber" as const, desc: "Active applications", suffix: "", link: "/applications" },
    { label: "Completed", value: completedCount, icon: CheckCircle, glow: "teal" as const, desc: "All time", suffix: "", link: "/applications" },
    { label: "Deadlines This Month", value: deadlinesCount, icon: AlertTriangle, glow: "red" as const, desc: "Open windows", suffix: "", link: "/grants" },
    { label: "Proposal Health", value: avgScore, icon: Heart, glow: "green" as const, desc: "Avg AI score", suffix: "%", link: "/writer" },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-64" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {org?.name || "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="h-0.5 mt-4 rounded-full bg-gradient-to-r from-primary/60 via-accent-teal/40 to-transparent" />
        </motion.div>

        {/* KPI Cards — now clickable */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link to={kpi.link}>
                <GlassCard glowColor={kpi.glow} className="flex items-start gap-3 p-4 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
                  <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                    <kpi.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{kpi.value}{kpi.suffix}</div>
                    <div className="text-xs font-medium text-foreground">{kpi.label}</div>
                    <div className="text-[10px] text-muted-foreground">{kpi.desc}</div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Application Pipeline */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Application Pipeline</h2>
              <Link to="/applications">
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">View all</Button>
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {kanbanData.map((col) => (
                <div key={col.column} className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-muted-foreground">{col.title}</span>
                    <span className="text-[10px] bg-secondary/50 rounded-full px-1.5 py-0.5">{col.items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.items.slice(0, 3).map((item: any) => (
                      <GlassCard key={item.id} className="p-3 cursor-pointer" onClick={() => navigate("/applications")}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground truncate flex-1 mr-2">{item.funder}</span>
                          <MatchScoreRing score={item.score} size="sm" />
                        </div>
                        <StatusBadge status={item.status} />
                      </GlassCard>
                    ))}
                    {col.items.length > 3 && (
                      <p className="text-[10px] text-muted-foreground text-center">+{col.items.length - 3} more</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <GlassCard className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate("/grants")}>
                  <Target className="h-3 w-3 mr-2" /> Find matching grants
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate("/writer/new")}>
                  <Plus className="h-3 w-3 mr-2" /> Start new proposal
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate("/reports")}>
                  <Calendar className="h-3 w-3 mr-2" /> Generate report
                </Button>
              </div>
            </GlassCard>

            {/* Deadline Intelligence */}
            {deadlineIntel.length > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Deadline Intelligence</h3>
                <div className="space-y-2">
                  {deadlineIntel.map((d, i) => (
                    <div key={i} className={`p-2 rounded-lg border ${d.conflict ? "border-destructive/30 bg-destructive/5" : "border-border/20 bg-secondary/10"}`}>
                      <p className="text-xs font-medium text-foreground">{d.funder}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Window: {d.window} · ~{d.days} days · Start by {d.startBy}</p>
                      {d.recommendation && <p className="text-[10px] text-primary mt-1">{d.recommendation}</p>}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Submission Tracker */}
            <SubmissionTracker />


            {recentActivity.length > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/10 last:border-0">
                      <span className="text-sm">{a.type === "status" ? "📊" : "🤖"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{a.funder}</p>
                        <p className="text-[10px] text-muted-foreground">{a.action} · {a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default DashboardPage;
