import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AppItem {
  id: string;
  funder: string;
  area: string;
  score: number;
  deadline: string;
  status: string;
  kanban_column: string;
}

const ApplicationsPage = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) { setLoading(false); return; }

      const { data: applications } = await supabase
        .from("applications")
        .select("id, funder_id, status, kanban_column, deadline, activity_category, project_name")
        .eq("org_id", org.id);

      if (!applications || applications.length === 0) { setLoading(false); return; }

      const funderIds = [...new Set(applications.map(a => a.funder_id).filter(Boolean))];
      const { data: funders } = await supabase.from("funders").select("id, donor_name").in("id", funderIds as string[]);
      const funderMap = Object.fromEntries((funders || []).map(f => [f.id, f.donor_name]));

      const { data: matches } = await supabase.from("grant_matches").select("funder_id, match_score").eq("org_id", org.id);
      const scoreMap = Object.fromEntries((matches || []).map(m => [m.funder_id, m.match_score || 0]));

      const items: AppItem[] = applications.map(a => ({
        id: a.id,
        funder: a.funder_id ? funderMap[a.funder_id] || "Unknown" : a.project_name || "Unknown",
        area: a.activity_category || "General",
        score: a.funder_id ? scoreMap[a.funder_id] || 0 : 0,
        deadline: a.deadline || "",
        status: a.status || "pending",
        kanban_column: a.kanban_column || "backlog",
      }));

      setApps(items);
      setLoading(false);
    };
    load();
  }, [user]);

  const columns = [
    { id: "backlog", title: "Backlog" },
    { id: "in_progress", title: "In Progress" },
    { id: "submitted", title: "Submitted" },
    { id: "closed", title: "Closed" },
  ];

  const getColumnItems = (colId: string) => {
    if (colId === "closed") return apps.filter(a => ["successful", "denied"].includes(a.status) || a.kanban_column === "closed");
    return apps.filter(a => a.kanban_column === colId && !["successful", "denied"].includes(a.status));
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 flex-1" />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">{apps.length} total applications</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" /> New Application
          </Button>
        </div>

        {apps.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No applications yet. Browse grants and click "Apply" to create your first application.</p>
          </GlassCard>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {columns.map((col) => {
              const items = getColumnItems(col.id);
              return (
                <div key={col.id} className="min-w-[280px] flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                    <span className="text-xs text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, j) => {
                      const isUrgent = item.deadline && new Date(item.deadline) < new Date(Date.now() + 14 * 86400000);
                      return (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: j * 0.05 }}>
                          <GlassCard className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-medium text-foreground leading-tight flex-1 mr-2">{item.funder}</h4>
                              <MatchScoreRing score={item.score} size="sm" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{item.area}</span>
                              <StatusBadge status={item.status} />
                            </div>
                            {item.deadline && (
                              <div className={`text-[10px] ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                                Due: {new Date(item.deadline).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                                {isUrgent && " ⚠️"}
                              </div>
                            )}
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsPage;
