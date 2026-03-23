import { motion } from "framer-motion";
import { Target, Clock, CheckCircle, AlertTriangle, Plus, Heart, Calendar } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import StatusBadge from "@/components/StatusBadge";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const kpis = [
  { label: "Matched Grants", value: 147, icon: Target, glow: "blue" as const, desc: "Score ≥60%" },
  { label: "In Progress", value: 12, icon: Clock, glow: "amber" as const, desc: "Active applications" },
  { label: "Completed", value: 34, icon: CheckCircle, glow: "teal" as const, desc: "This year" },
  { label: "Deadlines This Month", value: 5, icon: AlertTriangle, glow: "red" as const, desc: "Act soon" },
  { label: "Proposal Health", value: 74, icon: Heart, glow: "green" as const, desc: "Avg AI score" },
];

const kanbanColumns = [
  {
    title: "Backlog", count: 4,
    items: [
      { funder: "Anglo American Chairman's Fund", area: "Education", score: 91, deadline: "2026-04-15", status: "pending" },
      { funder: "Nedbank Foundation", area: "Youth", score: 78, deadline: "2026-05-01", status: "pending" },
    ],
  },
  {
    title: "In Progress", count: 3,
    items: [
      { funder: "DG Murray Trust", area: "Education", score: 85, deadline: "2026-04-01", status: "in_progress" },
      { funder: "Ford Foundation", area: "Human Rights", score: 72, deadline: "2026-06-30", status: "in_progress" },
    ],
  },
  {
    title: "Submitted", count: 2,
    items: [
      { funder: "National Lotteries Commission", area: "Community Dev", score: 88, deadline: "2026-03-15", status: "submitted" },
    ],
  },
  {
    title: "Closed", count: 3,
    items: [
      { funder: "ABSA Foundation", area: "Education", score: 76, deadline: "2026-02-28", status: "successful" },
      { funder: "Raith Foundation", area: "Youth", score: 69, deadline: "2026-01-31", status: "denied" },
    ],
  },
];

const workloadForecast = [
  { funder: "DG Murray Trust", window: "Apr", days: 5, startBy: "Mar 27", priority: 4, conflict: false, recommendation: "Start immediately — highest match score and window closes soon." },
  { funder: "Anglo American", window: "Apr", days: 7, startBy: "Mar 25", priority: 5, conflict: true, recommendation: "Overlaps with DG Murray. Consider delegating or starting early." },
  { funder: "Nedbank Foundation", window: "May", days: 4, startBy: "Apr 20", priority: 3, conflict: false, recommendation: "Good match. Schedule after current deadlines clear." },
  { funder: "Comic Relief", window: "May", days: 6, startBy: "Apr 15", priority: 2, conflict: false, recommendation: "Lower priority — focus on SA funders first." },
  { funder: "Ford Foundation", window: "Jun", days: 8, startBy: "May 20", priority: 4, conflict: false, recommendation: "Strong match for rights work. Start research phase early." },
];

const recentActivity = [
  { funder: "DG Murray Trust", action: "AI generated proposal", time: "1 hour ago", type: "ai" },
  { funder: "Anglo American", action: "Proposal scored: 72%", time: "3 hours ago", type: "score" },
  { funder: "ABSA Foundation", action: "Marked as successful", time: "2 days ago", type: "status" },
  { funder: "NLC", action: "Impact report generated", time: "3 days ago", type: "report" },
  { funder: "Raith Foundation", action: "Application denied", time: "5 days ago", type: "status" },
];

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">
            Good morning, Elizayo Foundation 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="h-0.5 mt-4 rounded-full bg-gradient-to-r from-primary/60 via-accent-teal/40 to-transparent" />
        </motion.div>

        {/* KPI Cards — now 5 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GlassCard glowColor={kpi.glow} className="flex items-start gap-3 p-4">
                <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{kpi.value}{kpi.label === "Proposal Health" ? "%" : ""}</div>
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
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {kanbanColumns.map((col) => (
                <div key={col.title} className="min-w-[220px] flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-foreground">{col.title}</span>
                    <span className="text-xs text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">{col.count}</span>
                  </div>
                  <div className="space-y-3">
                    {col.items.map((item, j) => {
                      const isUrgent = new Date(item.deadline) < new Date(Date.now() + 14 * 86400000);
                      return (
                        <GlassCard key={j} className="p-3 cursor-grab">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-xs font-medium text-foreground leading-tight flex-1 mr-2">{item.funder}</h4>
                            <MatchScoreRing score={item.score} size="sm" />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{item.area}</span>
                            <StatusBadge status={item.status} />
                          </div>
                          {item.deadline && (
                            <div className={`text-[9px] mt-1.5 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                              Due: {new Date(item.deadline).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                              {isUrgent && " ⚠️"}
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
              <p className="text-[10px] text-muted-foreground mb-3">
                You have <span className="text-foreground font-medium">5 opportunities</span> opening in the next 60 days. Based on your team size, focus on <span className="text-primary font-medium">3</span>.
              </p>
              <div className="space-y-3">
                {workloadForecast.map((w, i) => (
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
                    <p className="text-[9px] text-muted-foreground mt-1 italic">{w.recommendation}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Activity */}
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
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
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
