import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowRight, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { createNotification } from "@/hooks/useNotifications";

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
  const [newReadyToSubmit, setNewReadyToSubmit] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  // Attach-grant picker state
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachAppId, setAttachAppId] = useState<string | null>(null);
  const [funderSearch, setFunderSearch] = useState("");
  const [funderResults, setFunderResults] = useState<{ id: string; donor_name: string }[]>([]);
  const [attachLoading, setAttachLoading] = useState(false);

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

  // Realtime sync — keep board in sync across tabs/teammates
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel('applications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `org_id=eq.${orgId}` }, () => {
        loadApps(orgId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

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

  // Auto-create CRM prospect when moving to submitted or creating
  const ensureCRMProspect = async (funderId: string | null) => {
    if (!funderId || !orgId) return;
    const { data: existing } = await supabase.from("funder_relationships").select("id").eq("org_id", orgId).eq("funder_id", funderId).maybeSingle();
    if (!existing) {
      await supabase.from("funder_relationships").insert({ org_id: orgId, funder_id: funderId, relationship_status: "prospect", health_score: 50 });
    }
  };

  // Debounced funder search for the attach dialog
  useEffect(() => {
    if (!attachOpen) return;
    const timer = setTimeout(async () => {
      const term = funderSearch.trim();
      if (term.length < 2) { setFunderResults([]); return; }
      const { data } = await supabase
        .from("funders")
        .select("id, donor_name")
        .ilike("donor_name", `%${term}%`)
        .order("donor_name")
        .limit(20);
      setFunderResults(data || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [funderSearch, attachOpen]);

  const moveApp = async (appId: string, newColumn: string, newStatus?: string) => {
    const updateData: any = { kanban_column: newColumn, updated_at: new Date().toISOString() };
    if (newStatus) updateData.status = newStatus;
    if (newColumn === "submitted" && !newStatus) updateData.status = "submitted";
    if (newColumn === "in_progress" && !newStatus) updateData.status = "in_progress";

    await supabase.from("applications").update(updateData).eq("id", appId);
    const app = apps.find(a => a.id === appId);
    if (app?.funder_id) await ensureCRMProspect(app.funder_id);

    // Send notification on key status changes
    if (user && updateData.status) {
      const statusLabel = updateData.status === "submitted" ? "submitted" : updateData.status === "successful" ? "awarded 🎉" : updateData.status === "denied" ? "marked as unsuccessful" : null;
      if (statusLabel) {
        await createNotification({
          userId: user.id,
          orgId: orgId || undefined,
          type: "application_status",
          title: `Application ${statusLabel}`,
          body: `"${app?.project_name || app?.funder || "Application"}" has been ${statusLabel}.`,
          link: "/applications",
        });
      }
    }

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
    const status = newReadyToSubmit ? "in_progress" : "pending";
    const kanban = newReadyToSubmit ? "in_progress" : "backlog";
    const { error } = await supabase.from("applications").insert({
      org_id: orgId,
      project_name: newProjectName,
      amount_requested: newAmount ? parseFloat(newAmount) : null,
      deadline: newDeadline || null,
      status,
      kanban_column: kanban,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: newReadyToSubmit ? "Application created — marked Ready to Submit" : "Application created!" });
    setCreateOpen(false);
    setNewProjectName(""); setNewAmount(""); setNewDeadline(""); setNewReadyToSubmit(false);
    await loadApps(orgId);
  };

  // Open the funder picker for an existing application
  const openAttachFunder = (appId: string) => {
    setAttachAppId(appId);
    setFunderSearch("");
    setFunderResults([]);
    setAttachOpen(true);
  };

  const attachFunder = async (funderId: string) => {
    if (!attachAppId || !orgId) return;
    setAttachLoading(true);
    await supabase.from("applications").update({ funder_id: funderId }).eq("id", attachAppId);
    await ensureCRMProspect(funderId);
    setAttachLoading(false);
    setAttachOpen(false);
    setAttachAppId(null);
    await loadApps(orgId);
    toast({ title: "Funder attached to application" });
  };

  // Drag-and-drop handlers
  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (colId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  };
  const onDrop = (colId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggingId) return;
    const targetCol = colId === "closed" ? "closed" : colId;
    const newStatus = colId === "closed" ? "successful" : undefined;
    const app = apps.find(a => a.id === draggingId);
    if (app && app.kanban_column !== targetCol) {
      moveApp(draggingId, targetCol, newStatus);
    }
    setDraggingId(null);
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
            <p className="text-sm text-muted-foreground mb-4">No applications yet. You can start from a matched grant or create a blank application and attach a funder later.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate("/grants")} variant="outline">Browse Grants</Button>
              <Button className="bg-primary text-primary-foreground" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Blank Application
              </Button>
            </div>
          </GlassCard>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {columns.map((col) => {
              const items = getColumnItems(col.id);
              const isOver = dragOverCol === col.id;
              return (
                <div
                  key={col.id}
                  className={`min-w-[280px] flex-1 rounded-lg p-2 transition-colors ${isOver ? "bg-primary/5 ring-2 ring-primary/40" : ""}`}
                  onDragOver={onDragOver(col.id)}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={onDrop(col.id)}
                >
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                    <span className="text-xs text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">{items.length}</span>
                  </div>
                  <div className="space-y-3 min-h-[60px]">
                    {items.map((item, j) => {
                      const isUrgent = item.deadline && new Date(item.deadline) < new Date(Date.now() + 14 * 86400000);
                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={onDragStart(item.id)}
                          onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                          className={`cursor-grab active:cursor-grabbing ${draggingId === item.id ? "opacity-40" : ""}`}
                        >
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: j * 0.05 }}>
                          <GlassCard className={`p-4 ${item.status === "successful" ? "border-emerald-500/30 bg-emerald-500/5" : ""}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 mr-2">
                                <h4 className="text-sm font-medium text-foreground leading-tight">{item.funder}</h4>
                                {item.status === "successful" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">✅ Won</span>}
                              </div>
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
                            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/20 flex-wrap">
                              {!item.funder_id && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-amber-500" onClick={() => openAttachFunder(item.id)}>
                                  <Link2 className="h-2.5 w-2.5 mr-0.5" /> Attach Funder
                                </Button>
                              )}
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
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] px-2 text-primary"
                                onClick={() => navigate(item.proposal_id ? `/writer/${item.proposal_id}` : `/grants`)}
                              >
                                {item.proposal_id ? "Edit Proposal" : "Write Proposal"}
                              </Button>
                              {col.id === "submitted" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-emerald-500" onClick={() => moveApp(item.id, "closed", "successful")}>Won</Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => moveApp(item.id, "closed", "denied")}>Lost</Button>
                                </div>
                              )}
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive ml-auto" onClick={() => deleteApp(item.id)}>
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </GlassCard>
                          </motion.div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="text-[10px] text-muted-foreground/50 text-center py-6 border border-dashed border-border/30 rounded-lg">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-2">💡 Tip: drag cards between columns to update status.</p>
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
              <p className="text-[10px] text-muted-foreground mt-1">Internal name for this application — you can attach a specific funder later.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Amount Requested ($)</Label>
                <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="50000" className="mt-1 bg-secondary/30 border-border/50 text-foreground" />
                <p className="text-[10px] text-muted-foreground mt-1">USD. Leave blank if not yet decided.</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Deadline</Label>
                <Input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className="mt-1 bg-secondary/30 border-border/50 text-foreground" />
                <p className="text-[10px] text-muted-foreground mt-1">Submission deadline. Used for the Deadlines view.</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/20 px-3 py-2">
              <div>
                <Label className="text-xs text-foreground">Mark as ready to submit</Label>
                <p className="text-[10px] text-muted-foreground">Skips Backlog and lands in "In Progress".</p>
              </div>
              <Switch checked={newReadyToSubmit} onCheckedChange={setNewReadyToSubmit} />
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

      {/* Attach Funder Dialog */}
      <Dialog open={attachOpen} onOpenChange={(o) => { setAttachOpen(o); if (!o) { setAttachAppId(null); setFunderSearch(""); setFunderResults([]); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Attach a Funder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-[11px] text-muted-foreground">Search the funder database and attach one to this application. We'll also create a CRM relationship automatically.</p>
            <Input
              autoFocus
              value={funderSearch}
              onChange={(e) => setFunderSearch(e.target.value)}
              placeholder="Search funders by name..."
              className="bg-secondary/30 border-border/50"
            />
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border/40 divide-y divide-border/30">
              {funderSearch.trim().length < 2 && (
                <p className="p-4 text-[11px] text-muted-foreground text-center">Type at least 2 characters to search.</p>
              )}
              {funderSearch.trim().length >= 2 && funderResults.length === 0 && (
                <p className="p-4 text-[11px] text-muted-foreground text-center">No funders match "{funderSearch}".</p>
              )}
              {funderResults.map(f => (
                <button
                  key={f.id}
                  onClick={() => attachFunder(f.id)}
                  disabled={attachLoading}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary/40 disabled:opacity-50 transition-colors"
                >
                  {f.donor_name}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ApplicationsPage;
