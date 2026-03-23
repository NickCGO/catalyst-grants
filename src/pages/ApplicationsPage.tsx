import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

const columns = [
  {
    id: "backlog",
    title: "Backlog",
    items: [
      { funder: "Anglo American Chairman's Fund", area: "Education", score: 91, deadline: "2026-04-15", status: "pending" },
      { funder: "Nedbank Foundation", area: "Youth", score: 78, deadline: "2026-05-01", status: "pending" },
      { funder: "Irish Aid", area: "Health", score: 74, deadline: "2026-05-15", status: "pending" },
    ],
  },
  {
    id: "in_progress",
    title: "In Progress",
    items: [
      { funder: "DG Murray Trust", area: "Education", score: 85, deadline: "2026-04-01", status: "in_progress" },
      { funder: "Ford Foundation", area: "Human Rights", score: 72, deadline: "2026-06-30", status: "in_progress" },
    ],
  },
  {
    id: "submitted",
    title: "Submitted",
    items: [
      { funder: "National Lotteries Commission", area: "Community Dev", score: 88, deadline: "2026-03-15", status: "submitted" },
      { funder: "Standard Bank Foundation", area: "Education", score: 80, deadline: "2026-04-30", status: "submitted" },
    ],
  },
  {
    id: "closed",
    title: "Closed",
    items: [
      { funder: "ABSA Foundation", area: "Education", score: 76, deadline: "2026-02-28", status: "successful" },
      { funder: "Raith Foundation", area: "Youth", score: 69, deadline: "2026-01-31", status: "denied" },
    ],
  },
];

const ApplicationsPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">Drag and drop to update status</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" /> New Application
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6">
          {columns.map((col) => (
            <div key={col.id} className="min-w-[280px] flex-1">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                <span className="text-xs text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">
                  {col.items.length}
                </span>
              </div>
              <div className="space-y-3">
                {col.items.map((item, j) => {
                  const isUrgent = new Date(item.deadline) < new Date(Date.now() + 14 * 86400000);
                  return (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: j * 0.05 }}
                    >
                      <GlassCard className="p-4 cursor-grab active:cursor-grabbing">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-foreground leading-tight flex-1 mr-2">
                            {item.funder}
                          </h4>
                          <MatchScoreRing score={item.score} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {item.area}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className={`text-[10px] ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                          Due: {new Date(item.deadline).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                          {isUrgent && " ⚠️"}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsPage;
