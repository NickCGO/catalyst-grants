import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Users, Plus, Search, AlertCircle, Calendar, Phone,
  Mail, FileText, TrendingUp, Star, Clock, ChevronRight, MessageSquare,
  Eye, Handshake, XCircle, Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { callAI } from "@/lib/ai";

const statusConfig: Record<string, { label: string; color: string }> = {
  prospect: { label: "Prospect", color: "bg-muted text-muted-foreground" },
  contacted: { label: "Contacted", color: "bg-primary/20 text-primary" },
  active: { label: "Active", color: "bg-success/20 text-success" },
  strategic: { label: "Strategic", color: "bg-accent-amber/20 text-accent-amber" },
  lapsed: { label: "Lapsed", color: "bg-muted text-muted-foreground" },
  declined: { label: "Declined", color: "bg-destructive/20 text-destructive" },
};

const interactionTypeLabels: Record<string, string> = {
  email_sent: "Email Sent", email_received: "Email Received", call: "Phone Call",
  meeting: "Meeting", proposal_submitted: "Proposal Submitted", proposal_outcome: "Proposal Outcome",
  report_submitted: "Report Submitted", site_visit: "Site Visit", event: "Conference/Event", note: "General Note",
};

const CRMPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [selectedRel, setSelectedRel] = useState<any>(null);
  const [newInteraction, setNewInteraction] = useState({ type: "email_sent", summary: "", outcome: "", sentiment: "unknown", date: new Date().toISOString().split("T")[0] });
  const [orgId, setOrgId] = useState<string | null>(null);

  // Add relationship state
  const [addOpen, setAddOpen] = useState(false);
  const [funderSearch, setFunderSearch] = useState("");
  const [funderResults, setFunderResults] = useState<any[]>([]);
  const [searchingFunders, setSearchingFunders] = useState(false);

  const loadRelationships = async (oid: string) => {
    const { data: rels } = await supabase.from("funder_relationships").select("*").eq("org_id", oid);
    if (!rels || rels.length === 0) { setRelationships([]); setLoading(false); return; }

    const funderIds = [...new Set(rels.map(r => r.funder_id))];
    const { data: funders } = await supabase.from("funders").select("id, donor_name, category").in("id", funderIds);
    const funderMap = Object.fromEntries((funders || []).map(f => [f.id, f]));

    const enriched = rels.map(r => ({
      ...r,
      funder_name: funderMap[r.funder_id]?.donor_name || "Unknown",
      category: funderMap[r.funder_id]?.category || "",
    }));

    setRelationships(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) { setLoading(false); return; }
      setOrgId(org.id);
      await loadRelationships(org.id);
    };
    load();
  }, [user]);

  const pipelineStages = ["prospect", "contacted", "active", "strategic", "lapsed", "declined"].map(key => ({
    key,
    count: relationships.filter(r => r.relationship_status === key).length,
  }));

  const filtered = relationships.filter(r => {
    if (selectedStatus && r.relationship_status !== selectedStatus) return false;
    if (searchQuery && !r.funder_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const todaysActions = relationships
    .filter(r => r.next_action_date)
    .sort((a: any, b: any) => (a.next_action_date || "").localeCompare(b.next_action_date || ""))
    .slice(0, 5);

  const formatCurrency = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

  const handleLogInteraction = async () => {
    if (!selectedRel || !orgId) return;
    const { error } = await supabase.from("funder_interactions").insert({
      org_id: orgId,
      funder_id: selectedRel.funder_id,
      relationship_id: selectedRel.id,
      interaction_type: newInteraction.type,
      summary: newInteraction.summary,
      outcome: newInteraction.outcome || null,
      sentiment: newInteraction.sentiment,
      date: newInteraction.date,
      created_by: user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("funder_relationships").update({ last_interaction_date: newInteraction.date }).eq("id", selectedRel.id);
    toast({ title: "Interaction logged", description: `${interactionTypeLabels[newInteraction.type]} recorded` });
    setLogOpen(false);
    setNewInteraction({ type: "email_sent", summary: "", outcome: "", sentiment: "unknown", date: new Date().toISOString().split("T")[0] });
  };

  // Search funders to add
  const searchFunders = async () => {
    if (!funderSearch || funderSearch.length < 2) return;
    setSearchingFunders(true);
    const existingFunderIds = relationships.map(r => r.funder_id);
    const { data } = await supabase
      .from("funders")
      .select("id, donor_name, category")
      .ilike("donor_name", `%${funderSearch}%`)
      .limit(10);
    setFunderResults((data || []).filter(f => !existingFunderIds.includes(f.id)));
    setSearchingFunders(false);
  };

  useEffect(() => {
    const t = setTimeout(searchFunders, 300);
    return () => clearTimeout(t);
  }, [funderSearch]);

  const addRelationship = async (funder: any) => {
    if (!orgId) return;
    const { error } = await supabase.from("funder_relationships").insert({
      org_id: orgId,
      funder_id: funder.id,
      relationship_status: "prospect",
      health_score: 50,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Relationship added!", description: `${funder.donor_name} added as a prospect` });
    setAddOpen(false);
    setFunderSearch("");
    setFunderResults([]);
    await loadRelationships(orgId);
  };

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Funder CRM</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage relationships with {relationships.length} funders</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Add Funder
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pipeline */}
          <div className="lg:col-span-2 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline</h3>
            <button onClick={() => setSelectedStatus(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedStatus ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}>
              All ({relationships.length})
            </button>
            {pipelineStages.map(stage => (
              <button key={stage.key} onClick={() => setSelectedStatus(selectedStatus === stage.key ? null : stage.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedStatus === stage.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}>
                <span>{statusConfig[stage.key]?.label}</span>
                <Badge variant="outline" className="text-[10px] h-5">{stage.count}</Badge>
              </button>
            ))}
          </div>

          {/* Funder List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search funders..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/30 border-border/30" />
              </div>
            </div>

            {filtered.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">No funder relationships yet. Add funders to start tracking.</p>
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Your First Funder
                </Button>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {filtered.map(rel => (
                  <motion.div key={rel.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard className="p-4 hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link to={`/crm/${rel.funder_id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate">
                              {rel.funder_name}
                            </Link>
                            <Badge className={`${statusConfig[rel.relationship_status]?.color} text-[10px] h-5`}>
                              {statusConfig[rel.relationship_status]?.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rel.category}</p>
                          {rel.last_interaction_date && (
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              Last interaction: {new Date(rel.last_interaction_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                            </p>
                          )}
                          {rel.next_action_date && (
                            <p className={`text-[10px] mt-0.5 ${rel.next_action_date < new Date().toISOString().split("T")[0] ? "text-destructive font-medium" : "text-accent-amber"}`}>
                              Next: {rel.next_action_type || "Action"} · {new Date(rel.next_action_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                            <span>Applied: {formatCurrency(Number(rel.total_applied) || 0)}</span>
                            <span>Won: {formatCurrency(Number(rel.total_awarded) || 0)}</span>
                            <span>Win rate: {(rel.applications_count || 0) > 0 ? Math.round(((rel.successful_count || 0) / rel.applications_count) * 100) : 0}%</span>
                          </div>
                        </div>
                        <MatchScoreRing score={rel.health_score || 50} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                        <Link to={`/crm/${rel.funder_id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">View details <ChevronRight className="h-3 w-3 ml-1" /></Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => { setSelectedRel(rel); setLogOpen(true); }}>Log interaction</Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Actions */}
          <div className="lg:col-span-3 space-y-4">
            <GlassCard className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions Due</h3>
              {todaysActions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming actions</p>
              ) : (
                <div className="space-y-3">
                  {todaysActions.map(action => {
                    const isOverdue = action.next_action_date < new Date().toISOString().split("T")[0];
                    return (
                      <div key={action.id} className={`p-2 rounded-lg border ${isOverdue ? "border-destructive/30 bg-destructive/5" : "border-border/20 bg-secondary/10"}`}>
                        <p className="text-xs font-medium text-foreground">{action.funder_name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{action.next_action_type}</p>
                        {action.next_action_note && <p className="text-[10px] text-muted-foreground">{action.next_action_note}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Log Interaction Modal */}
        <Dialog open={logOpen} onOpenChange={setLogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Log Interaction — {selectedRel?.funder_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <select value={newInteraction.type} onChange={e => setNewInteraction(p => ({ ...p, type: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                    {Object.entries(interactionTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={newInteraction.date} onChange={e => setNewInteraction(p => ({ ...p, date: e.target.value }))} className="mt-1 bg-secondary/30 border-border/50" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Summary</Label>
                <Textarea value={newInteraction.summary} onChange={e => setNewInteraction(p => ({ ...p, summary: e.target.value }))} placeholder="What happened?" className="mt-1 bg-secondary/30 border-border/50" />
              </div>
              <div>
                <Label className="text-xs">Sentiment</Label>
                <div className="flex gap-2 mt-1">
                  {["positive", "neutral", "negative"].map(s => (
                    <button key={s} onClick={() => setNewInteraction(p => ({ ...p, sentiment: s }))}
                      className={`px-3 py-1.5 rounded-lg text-xs border capitalize ${newInteraction.sentiment === s ? "ring-2 ring-primary" : ""} border-border/30`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full bg-primary text-primary-foreground" onClick={handleLogInteraction}>Log Interaction</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Funder Relationship Modal */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Funder to CRM</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Search for a funder</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={funderSearch} onChange={e => setFunderSearch(e.target.value)} placeholder="Type funder name..." className="pl-9 bg-secondary/30 border-border/50 text-foreground" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchingFunders && <p className="text-xs text-muted-foreground text-center py-4">Searching...</p>}
                {!searchingFunders && funderSearch.length >= 2 && funderResults.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No funders found</p>
                )}
                {funderResults.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border/20 hover:bg-secondary/20 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{f.donor_name}</p>
                      <p className="text-[10px] text-muted-foreground">{f.category}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addRelationship(f)}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Browse all funders on the <button onClick={() => { setAddOpen(false); navigate("/grants"); }} className="text-primary hover:underline">Grants page</button>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CRMPage;
