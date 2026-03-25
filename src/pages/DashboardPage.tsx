import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Clock, CheckCircle, AlertTriangle, Plus, Heart, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import StatusBadge from "@/components/StatusBadge";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
      // Parallel fetches
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

      // KPI: matched grants >= 60
      setMatchedCount(matches.filter(m => (m.match_score || 0) >= 60).length);

      // KPI: in progress
      setInProgressCount(apps.filter(a => ["in_progress", "submitted", "follow_up"].includes(a.status || "")).length);

      // KPI: completed
      setCompletedCount(apps.filter(a => ["successful", "denied"].includes(a.status || "")).length);

      // KPI: avg proposal score
      if (proposals.length > 0) {
        setAvgScore(Math.round(proposals.reduce((s, p) => s + (p.ai_score || 0), 0) / proposals.length));
      }

      // KPI: deadlines this month - check funder_windows for current month
      const currentMonth = MONTH_KEYS[new Date().getMonth()];
      const matchedFunderIds = matches.filter(m => (m.match_score || 0) >= 60).map(m => m.funder_id).filter(Boolean);
      if (matchedFunderIds.length > 0) {
        const { data: windows } = await supabase.from("funder_windows").select("funder_id").in("funder_id", matchedFunderIds.slice(0, 100)).eq(currentMonth, true);
        setDeadlinesCount((windows || []).length);
      }

      // Kanban - get funder names
      const appFunderIds = [...new Set(apps.map(a => a.funder_id).filter(Boolean))];
      let funderNames: Record<string, string> = {};
      if (appFunderIds.length > 0) {
        const { data: funders } = await supabase.from("funders").select("id, donor_name").in("id", appFunderIds);
        (funders || []).forEach(f => { funderNames[f.id] = f.donor_name; });
      }

      // Also get match scores for the apps
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

      // Deadline intelligence
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

      // Recent activity from applications
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
    { label: "Matched Grants", value: matchedCount, icon: Target, glow: "blue" as const, desc: "Score ≥60%", suffix: "" },
    { label: "In Progress", value: inProgressCount, icon: Clock, glow: "amber" as const, desc: "Active applications", suffix: "" },
    { label: "Completed", value: completedCount, icon: CheckCircle, glow: "teal" as const, desc: "All time", suffix: "" },
    { label: "Deadlines This Month", value: deadlinesCount, icon: AlertTriangle, glow: "red" as const, desc: "Open windows", suffix: "" },
    { label: "Proposal Health", value: avgScore, icon: Heart, glow: "green" as const, desc: "Avg AI score", suffix: "%" },
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GlassCard glowColor={kpi.glow} className="flex items-start gap-3 p-4">
                <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{kpi.value}{kpi.suffix}</div>
                  <div className="text-xs font-medium text-foreground">{kpi.label}</div>
                  <div className="text-[10px] text-muted-foreground">{kpi.desc}</div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Kanban */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Application Pipeline</h2>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/grants")}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {kanbanData.map((col) => (
                <div key={col.title} className="min-w-[220px] flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-foreground">{col.title}</span>
                    <span className="text-xs text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">{col.items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {col.items.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border/30 rounded-xl">
                        No applications
                      </div>
                    )}
                    {col.items.map((item) => {
                      const isUrgent = item.deadline && new Date(item.deadline) < new Date(Date.now() + 14 * 86400000);
                      return (
                        <GlassCard key={item.id} className="p-3 cursor-pointer" onClick={() => navigate("/applications")}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-xs font-medium text-foreground leading-tight flex-1 mr-2">{item.funder}</h4>
                            {item.score > 0 && <MatchScoreRing score={item.score} size="sm" />}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusBadge status={item.status} />
                          </div>
                          {item.deadline && (
                            <div className={`text-[9px] mt-1.5 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                              Due: {new Date(item.deadline).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                              {isUrgent ? " ⚠️" : ""}
                            </div>
                          )}
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workload Forecast */}
            <GlassCard hoverable={false}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Workload Forecast</h3>
              </div>
              {deadlineIntel.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No deadline intelligence yet. Complete onboarding and save some grants to generate forecasts.</p>
              ) : (
                <div className="space-y-3">
                  {deadlineIntel.map((w, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-border/30 bg-secondary/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">{w.funder}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} className={`h-1.5 w-1.5 rounded-full ${n <= w.priority ? "bg-primary" : "bg-secondary"}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1">
                        <span>Window: {w.window}</span>
                        <span>{w.days} days est.</span>
                        <span>Start by {w.startBy}</span>
                      </div>
                      {w.conflict && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">⚠️ Overlap</span>
                      )}
                      {w.recommendation && <p className="text-[9px] text-muted-foreground mt-1 italic">{w.recommendation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Activity */}
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No activity yet. Start by applying to grants!</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        a.type === "ai" ? "bg-primary" : a.type === "score" ? "bg-accent-amber" : a.type === "report" ? "bg-accent-teal" : "bg-muted-foreground"
                      }`} />
                      <div>
                        <div className="text-xs text-foreground">
                          <span className="font-medium">{a.funder}</span> · {a.action}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

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
