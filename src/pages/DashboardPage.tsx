import { motion } from "framer-motion";
import { Target, Clock, CheckCircle, AlertTriangle, Plus, ChevronRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import StatusBadge from "@/components/StatusBadge";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

const kpis = [
  { label: "Matched Grants", value: 147, icon: Target, glow: "blue" as const, desc: "Score ≥60%" },
  { label: "In Progress", value: 12, icon: Clock, glow: "amber" as const, desc: "Active applications" },
  { label: "Completed", value: 34, icon: CheckCircle, glow: "teal" as const, desc: "This year" },
  { label: "Deadlines This Month", value: 5, icon: AlertTriangle, glow: "red" as const, desc: "Act soon" },
];

const kanbanColumns = [
  {
    title: "Backlog",
    count: 4,
    items: [
      { funder: "Anglo American Chairman's Fund", area: "Education", score: 91, deadline: "2026-04-15", status: "pending" },
      { funder: "Nedbank Foundation", area: "Youth", score: 78, deadline: "2026-05-01", status: "pending" },
    ],
  },
  {
    title: "In Progress",
    count: 3,
    items: [
      { funder: "DG Murray Trust", area: "Education", score: 85, deadline: "2026-04-01", status: "in_progress" },
      { funder: "Ford Foundation", area: "Human Rights", score: 72, deadline: "2026-06-30", status: "in_progress" },
    ],
  },
  {
    title: "Submitted",
    count: 2,
    items: [
      { funder: "National Lotteries Commission", area: "Community Dev", score: 88, deadline: "2026-03-15", status: "submitted" },
    ],
  },
  {
    title: "Closed",
    count: 3,
    items: [
      { funder: "ABSA Foundation", area: "Education", score: 76, deadline: "2026-02-28", status: "successful" },
      { funder: "Raith Foundation", area: "Youth", score: 69, deadline: "2026-01-31", status: "denied" },
    ],
  },
];

const deadlines = [
  { funder: "DG Murray Trust", date: "Apr 1, 2026", daysLeft: 9 },
  { funder: "Anglo American", date: "Apr 15, 2026", daysLeft: 23 },
  { funder: "Nedbank Foundation", date: "May 1, 2026", daysLeft: 39 },
  { funder: "Comic Relief", date: "May 15, 2026", daysLeft: 53 },
  { funder: "Ford Foundation", date: "Jun 30, 2026", daysLeft: 99 },
];

const recentActivity = [
  { funder: "ABSA Foundation", action: "Marked as successful", time: "2 days ago" },
  { funder: "DG Murray Trust", action: "Proposal draft started", time: "3 days ago" },
  { funder: "Raith Foundation", action: "Application denied", time: "5 days ago" },
  { funder: "NLC", action: "Submitted application", time: "1 week ago" },
];

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            Good morning, Elizayo Foundation 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="h-0.5 mt-4 rounded-full bg-gradient-to-r from-primary/60 via-accent-teal/40 to-transparent" />
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard glowColor={kpi.glow} className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  <div className="text-sm font-medium text-foreground">{kpi.label}</div>
                  <div className="text-xs text-muted-foreground">{kpi.desc}</div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
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
                <div key={col.title} className="min-w-[240px] flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-foreground">{col.title}</span>
                    <span className="text-xs text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">
                      {col.count}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {col.items.map((item, j) => {
                      const isUrgent = item.deadline && new Date(item.deadline) < new Date(Date.now() + 14 * 86400000);
                      return (
                        <GlassCard key={j} className="p-4 cursor-grab active:cursor-grabbing">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-foreground leading-tight flex-1 mr-2">
                              {item.funder}
                            </h4>
                            <MatchScoreRing score={item.score} size="sm" />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {item.area}
                            </span>
                            <StatusBadge status={item.status} />
                          </div>
                          {item.deadline && (
                            <div className={`text-[10px] mt-2 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
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
            {/* Deadlines */}
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {deadlines.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-foreground">{d.funder}</div>
                      <div className="text-xs text-muted-foreground">{d.date}</div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.daysLeft <= 14
                          ? "bg-destructive/15 text-destructive"
                          : d.daysLeft <= 30
                          ? "bg-accent-amber/15 text-accent-amber"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d.daysLeft}d left
                    </span>
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
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <div className="text-sm text-foreground">
                        <span className="font-medium">{a.funder}</span> · {a.action}
                      </div>
                      <div className="text-xs text-muted-foreground">{a.time}</div>
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
