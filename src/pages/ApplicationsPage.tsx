import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface AppItem {
  id: string;
  funder: string;
  funder_id: string | null;
  area: string;
  score: number;
  deadline: string;
  status: string;
  kanban_column: string;
  project_name: string;
  amount_requested: number | null;
  proposal_id?: string;
}

const statusOptions = ["pending", "in_progress", "submitted", "follow_up", "successful", "denied"];

const ApplicationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const loadApps = async (oid: string) => {
    const { data: applications } = await supabase
      .from("applications")
      .select("id, funder_id, status, kanban_column, deadline, activity_category, project_name, amount_requested")
      .eq("org_id", oid);

    if (!applications || applications.length === 0) { setApps([]); setLoading(false); return; }

    const funderIds = [...new Set(applications.map(a => a.funder_id).filter(Boolean))];
    const [funderRes, matchRes, proposalRes] = await Promise.all([
      funderIds.length > 0 ? supabase.from("funders").select("id, donor_name").in("id", funderIds as string[]) : Promise.resolve({ data: [] }),
      supabase.from("grant_matches").select("funder_id, match_score").eq("org_id", oid),
      supabase.from("proposals").select("id, application_id").eq("org_id", oid),
    ]);

    const funderMap = Object.fromEntries((funderRes.data || []).map(f => [f.id, f.donor_name]));
    const scoreMap = Object.fromEntries((matchRes.data || []).map(m => [m.funder_id, m.match_score || 0]));
    const proposalMap = Object.fromEntries((proposalRes.data || []).filter(p => p.application_id).map(p => [p.application_id!, p.id]));

    const items: AppItem[] = applications.map(a => ({
      id: a.id,
      funder: a.funder_id ? funderMap[a.funder_id] || a.project_name || "Unknown" : a.project_name || "Unknown",
      funder_id: a.funder_id,
      area: a.activity_category || "General",
      score: a.funder_id ? scoreMap[a.funder_id] || 0 : 0,
      deadline: a.deadline || "",
      status: a.status || "pending",
      kanban_column: a.kanban_column || "backlog",
      project_name: a.project_name || "",
      amount_requested: a.amount_requested ? Number(a.amount_requested) : null,
      proposal_id: proposalMap[a.id],
    }));

    setApps(items);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) { setLoading(false); return; }
      setOrgId(org.id);
      await loadApps(org.id);
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

  const moveApp = async (appId: string, newColumn: string, newStatus?: string) => {
    const updateData: any = { kanban_column: newColumn };
    if (newStatus) updateData.status = newStatus;
    if (newColumn === "submitted" && !newStatus) updateData.status = "submitted";
    if (newColumn === "in_progress" && !newStatus) updateData.status = "in_progress";

    await supabase.from("applications").update(updateData).eq("id", appId);
    setApps(prev => prev.map(a => a.id === appId ? { ...a, kanban_column: newColumn, status: updateData.status || a.status } : a));
    toast({ title: "Application updated" });
  };

  const deleteApp = async (appId: string) => {
    await supabase.from("applications").delete().eq("id", appId);
    setApps(prev => prev.filter(a => a.id !== appId));
    toast({ title: "Application deleted" });
  };

  const createManualApp = async () => {
    if (!orgId || !newProjectName) return;
    const { error } = await supabase.from("applications").insert({
      org_id: orgId,
      project_name: newProjectName,
      amount_requested: newAmount ? parseFloat(newAmount) : null,
      deadline: newDeadline || null,
      status: "pending",
      kanban_column: "backlog",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Application created!" });
    setCreateOpen(false);
    setNewProjectName(""); setNewAmount(""); setNewDeadline("");
    await loadApps(orgId);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/grants")} className="text-sm">
              Find Grants
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Application
            </Button>
          </div>
        </div>

        {apps.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">No applications yet. Browse grants and click "Apply" to create your first application.</p>
            <Button onClick={() => navigate("/grants")}>Browse Grants</Button>
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
                            {item.project_name && item.project_name !== item.funder && (
                              <p className="text-[10px] text-muted-foreground mb-1">{item.project_name}</p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{item.area}</span>
                              <StatusBadge status={item.status} />
                            </div>
                            {item.amount_requested && (
                              <p className="text-[10px] text-muted-foreground">${item.amount_requested.toLocaleString()} requested</p>
                            )}
                            {item.deadline && (
                              <div className={`text-[10px] ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                                Due: {new Date(item.deadline).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                                {isUrgent && " ⚠️"}
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/20">
                              {col.id !== "in_progress" && col.id !== "closed" && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => moveApp(item.id, "in_progress")}>
                                  Start <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                                </Button>
                              )}
                              {col.id === "in_progress" && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => moveApp(item.id, "submitted")}>
                                  Submit <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                                </Button>
                              )}
                              {item.proposal_id && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => navigate(`/writer/${item.proposal_id}`)}>
                                  Edit Proposal
                                </Button>
                              )}
                              {col.id === "submitted" && (
                                <div className="flex gap-1 ml-auto">
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-green-500" onClick={() => moveApp(item.id, "closed", "successful")}>Won</Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-red-500" onClick={() => moveApp(item.id, "closed", "denied")}>Lost</Button>
                                </div>
                              )}
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive ml-auto" onClick={() => deleteApp(item.id)}>
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
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

      {/* Create Application Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Manual Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Project Name *</Label>
              <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g. Youth Mentorship Programme" className="mt-1 bg-secondary/30 border-border/50 text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Amount Requested ($)</Label>
                <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="50000" className="mt-1 bg-secondary/30 border-border/50 text-foreground" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Deadline</Label>
                <Input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className="mt-1 bg-secondary/30 border-border/50 text-foreground" />
              </div>
            </div>
            <Button className="w-full bg-primary text-primary-foreground" onClick={createManualApp} disabled={!newProjectName}>
              Create Application
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Tip: For better matching, create applications from the <button onClick={() => { setCreateOpen(false); navigate("/grants"); }} className="text-primary hover:underline">Grants page</button>.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ApplicationsPage;
