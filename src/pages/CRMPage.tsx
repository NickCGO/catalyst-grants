import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users, Plus, Search, Filter, AlertCircle, Calendar, Phone,
  Mail, FileText, TrendingUp, Star, Clock, ChevronRight, MessageSquare,
  Eye, Handshake, XCircle, Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { callAI } from "@/lib/ai";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Eye }> = {
  prospect: { label: "Prospect", color: "bg-muted text-muted-foreground", icon: Eye },
  contacted: { label: "Contacted", color: "bg-primary/20 text-primary", icon: Mail },
  active: { label: "Active", color: "bg-success/20 text-success", icon: Handshake },
  strategic: { label: "Strategic", color: "bg-accent-amber/20 text-accent-amber", icon: Star },
  lapsed: { label: "Lapsed", color: "bg-muted text-muted-foreground", icon: Clock },
  declined: { label: "Declined", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

const sentimentConfig: Record<string, { label: string; color: string }> = {
  positive: { label: "Positive", color: "bg-success/20 text-success" },
  neutral: { label: "Neutral", color: "bg-muted text-muted-foreground" },
  negative: { label: "Negative", color: "bg-destructive/20 text-destructive" },
  unknown: { label: "Unknown", color: "bg-muted text-muted-foreground" },
};

const interactionTypes = [
  "email_sent", "email_received", "call", "meeting", "proposal_submitted",
  "proposal_outcome", "report_submitted", "site_visit", "event", "note",
];

const interactionTypeLabels: Record<string, string> = {
  email_sent: "Email Sent", email_received: "Email Received", call: "Phone Call",
  meeting: "Meeting", proposal_submitted: "Proposal Submitted", proposal_outcome: "Proposal Outcome",
  report_submitted: "Report Submitted", site_visit: "Site Visit", event: "Conference/Event", note: "General Note",
};

const interactionIcons: Record<string, typeof Mail> = {
  email_sent: Mail, email_received: Mail, call: Phone, meeting: Users,
  proposal_submitted: FileText, proposal_outcome: TrendingUp,
  report_submitted: FileText, site_visit: Eye, event: Calendar, note: MessageSquare,
};

// Mock data for demonstration
interface FunderRelationship {
  id: string;
  funder_id: string;
  funder_name: string;
  category: string;
  relationship_status: string;
  health_score: number;
  last_interaction: string;
  next_action_date: string;
  next_action_type: string;
  next_action_note: string;
  total_applied: number;
  total_awarded: number;
  applications_count: number;
  successful_count: number;
  tags: string[];
}

interface Interaction {
  id: string;
  type: string;
  date: string;
  summary: string;
  outcome: string;
  sentiment: string;
  created_by: string;
}

const mockRelationships: FunderRelationship[] = [
  {
    id: "1", funder_id: "f1", funder_name: "DG Murray Trust", category: "SA Trusts/ Foundations",
    relationship_status: "active", health_score: 82, last_interaction: "2026-03-18",
    next_action_date: "2026-03-28", next_action_type: "Follow up", next_action_note: "Check on Q1 proposal status",
    total_applied: 450000, total_awarded: 180000, applications_count: 3, successful_count: 2, tags: ["strategic", "annual"],
  },
  {
    id: "2", funder_id: "f2", funder_name: "Anglo American Chairman's Fund", category: "SACorp",
    relationship_status: "strategic", health_score: 91, last_interaction: "2026-03-10",
    next_action_date: "2026-04-01", next_action_type: "Proposal submission", next_action_note: "Submit full proposal for Education grant",
    total_applied: 800000, total_awarded: 500000, applications_count: 4, successful_count: 3, tags: ["strategic", "warm", "corporate"],
  },
  {
    id: "3", funder_id: "f3", funder_name: "Ford Foundation", category: "USA",
    relationship_status: "contacted", health_score: 55, last_interaction: "2026-02-15",
    next_action_date: "2026-03-20", next_action_type: "Email follow-up", next_action_note: "Follow up on LOI submission",
    total_applied: 200000, total_awarded: 0, applications_count: 1, successful_count: 0, tags: ["international"],
  },
  {
    id: "4", funder_id: "f4", funder_name: "National Lotteries Commission", category: "SA Trusts/ Foundations",
    relationship_status: "active", health_score: 72, last_interaction: "2026-03-01",
    next_action_date: "2026-04-15", next_action_type: "Report due", next_action_note: "Submit Q1 impact report",
    total_applied: 1200000, total_awarded: 900000, applications_count: 5, successful_count: 3, tags: ["annual", "government"],
  },
  {
    id: "5", funder_id: "f5", funder_name: "Raith Foundation", category: "SA Trusts/ Foundations",
    relationship_status: "lapsed", health_score: 35, last_interaction: "2025-09-14",
    next_action_date: "", next_action_type: "", next_action_note: "",
    total_applied: 300000, total_awarded: 0, applications_count: 2, successful_count: 0, tags: [],
  },
  {
    id: "6", funder_id: "f6", funder_name: "ABSA Foundation", category: "SACorp",
    relationship_status: "prospect", health_score: 50, last_interaction: "",
    next_action_date: "", next_action_type: "", next_action_note: "",
    total_applied: 0, total_awarded: 0, applications_count: 0, successful_count: 0, tags: ["new"],
  },
];

const mockInteractions: Interaction[] = [
  { id: "i1", type: "proposal_submitted", date: "2026-03-18", summary: "Submitted Q2 concept note for Education Innovation programme", outcome: "Awaiting response", sentiment: "positive", created_by: "Sarah Moyo" },
  { id: "i2", type: "email_received", date: "2026-03-10", summary: "Received positive feedback on Q1 report, funder noted strong M&E data", outcome: "Encouraged to apply for additional funding", sentiment: "positive", created_by: "System" },
  { id: "i3", type: "meeting", date: "2026-02-20", summary: "Met with programme officer at sector conference in Cape Town", outcome: "Agreed to informal check-in before next submission", sentiment: "positive", created_by: "Sarah Moyo" },
  { id: "i4", type: "report_submitted", date: "2026-01-15", summary: "Submitted Q4 2025 impact report covering AfterSchool programme", outcome: "Acknowledged receipt", sentiment: "neutral", created_by: "James Ndlovu" },
];

const mockStewardshipSuggestions = [
  { funder: "Raith Foundation", suggestion: "Haven't heard from you in 6 months. Their window opens in April. Consider sending a brief update sharing your latest impact data.", action: "Draft email" },
  { funder: "Ford Foundation", suggestion: "Your LOI follow-up is overdue by 3 days. Send a polite check-in referencing your February submission.", action: "Draft email" },
  { funder: "National Lotteries Commission", suggestion: "Your Q1 report is due April 15. Start compiling M&E data now to submit early and demonstrate reliability.", action: "Start report" },
];

const CRMPage = () => {
  const [relationships] = useState(mockRelationships);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [selectedFunder, setSelectedFunder] = useState<FunderRelationship | null>(null);
  const [newInteraction, setNewInteraction] = useState({ type: "email_sent", summary: "", outcome: "", sentiment: "unknown", date: new Date().toISOString().split("T")[0] });
  const [analysingSentiment, setAnalysingSentiment] = useState(false);

  const pipelineStages = [
    { key: "prospect", count: relationships.filter(r => r.relationship_status === "prospect").length },
    { key: "contacted", count: relationships.filter(r => r.relationship_status === "contacted").length },
    { key: "active", count: relationships.filter(r => r.relationship_status === "active").length },
    { key: "strategic", count: relationships.filter(r => r.relationship_status === "strategic").length },
    { key: "lapsed", count: relationships.filter(r => r.relationship_status === "lapsed").length },
    { key: "declined", count: relationships.filter(r => r.relationship_status === "declined").length },
  ];

  const filtered = relationships.filter(r => {
    if (selectedStatus && r.relationship_status !== selectedStatus) return false;
    if (searchQuery && !r.funder_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const todaysActions = relationships
    .filter(r => r.next_action_date)
    .sort((a, b) => a.next_action_date.localeCompare(b.next_action_date))
    .slice(0, 5);

  const overdueActions = todaysActions.filter(r => r.next_action_date < new Date().toISOString().split("T")[0]);

  const formatCurrency = (v: number) => v >= 1000000 ? `R${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `R${(v / 1000).toFixed(0)}k` : `R${v}`;

  const analyseSentiment = async () => {
    if (!newInteraction.summary) return;
    setAnalysingSentiment(true);
    try {
      const result = await callAI([
        { role: "system", content: "Analyse this NGO-funder interaction summary. Return ONLY one word: positive, neutral, or negative." },
        { role: "user", content: newInteraction.summary },
      ]);
      const sentiment = result.trim().toLowerCase();
      if (["positive", "neutral", "negative"].includes(sentiment)) {
        setNewInteraction(prev => ({ ...prev, sentiment }));
      }
    } catch {
      // fallback
    }
    setAnalysingSentiment(false);
  };

  const handleLogInteraction = () => {
    toast({ title: "Interaction logged", description: `${interactionTypeLabels[newInteraction.type]} recorded for ${selectedFunder?.funder_name}` });
    setLogOpen(false);
    setNewInteraction({ type: "email_sent", summary: "", outcome: "", sentiment: "unknown", date: new Date().toISOString().split("T")[0] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Funder CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage relationships, track interactions, and nurture funder partnerships</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Pipeline */}
          <div className="lg:col-span-2 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline</h3>
            <button
              onClick={() => setSelectedStatus(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedStatus ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
            >
              All ({relationships.length})
            </button>
            {pipelineStages.map(stage => {
              const config = statusConfig[stage.key];
              return (
                <button
                  key={stage.key}
                  onClick={() => setSelectedStatus(selectedStatus === stage.key ? null : stage.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedStatus === stage.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
                >
                  <span>{config.label}</span>
                  <Badge variant="outline" className="text-[10px] h-5">{stage.count}</Badge>
                </button>
              );
            })}
          </div>

          {/* Column 2: Funder List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search funders..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/30 border-border/30"
                />
              </div>
              <Button size="sm" variant="outline" className="border-border/30">
                <Plus className="h-4 w-4 mr-1" /> Add to CRM
              </Button>
            </div>

            <div className="space-y-3">
              {filtered.map(rel => (
                <motion.div key={rel.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassCard className="p-4 hover:border-primary/30 transition-all cursor-pointer">
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
                        {rel.last_interaction && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            Last interaction: {new Date(rel.last_interaction).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                          </p>
                        )}
                        {rel.next_action_date && (
                          <p className={`text-[10px] mt-0.5 ${rel.next_action_date < new Date().toISOString().split("T")[0] ? "text-destructive font-medium" : "text-accent-amber"}`}>
                            Next: {rel.next_action_type} · {new Date(rel.next_action_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                          <span>Applied: {formatCurrency(rel.total_applied)}</span>
                          <span>Won: {formatCurrency(rel.total_awarded)}</span>
                          <span>Win rate: {rel.applications_count > 0 ? Math.round((rel.successful_count / rel.applications_count) * 100) : 0}%</span>
                        </div>
                        {rel.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {rel.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-[9px] h-4 bg-secondary/30">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <MatchScoreRing score={rel.health_score} size="sm" />
                        <span className="text-[9px] text-muted-foreground">Health</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                      <Link to={`/crm/${rel.funder_id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          View details <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                      <Button
                        size="sm" variant="ghost" className="h-7 text-xs"
                        onClick={() => { setSelectedFunder(rel); setLogOpen(true); }}
                      >
                        Log interaction
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Set reminder
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Column 3: Today's Actions & Stewardship */}
          <div className="lg:col-span-3 space-y-4">
            <GlassCard className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions Due</h3>
              {overdueActions.length > 0 && (
                <div className="mb-3 px-2 py-1.5 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-[10px] font-medium text-destructive">{overdueActions.length} overdue action{overdueActions.length > 1 ? "s" : ""}</p>
                </div>
              )}
              <div className="space-y-3">
                {todaysActions.map(action => {
                  const isOverdue = action.next_action_date < new Date().toISOString().split("T")[0];
                  return (
                    <div key={action.id} className={`p-2 rounded-lg border ${isOverdue ? "border-destructive/30 bg-destructive/5" : "border-border/20 bg-secondary/10"}`}>
                      <p className="text-xs font-medium text-foreground">{action.funder_name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{action.next_action_type}</p>
                      <p className="text-[10px] text-muted-foreground">{action.next_action_note}</p>
                      <p className={`text-[10px] mt-1 ${isOverdue ? "text-destructive font-medium" : "text-accent-amber"}`}>
                        {isOverdue ? "⚠️ Overdue" : ""} {new Date(action.next_action_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-accent-amber" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Stewardship</h3>
              </div>
              <div className="space-y-3">
                {mockStewardshipSuggestions.map((s, i) => (
                  <div key={i} className="p-2 rounded-lg border border-accent-amber/20 bg-accent-amber/5">
                    <p className="text-xs font-medium text-foreground">{s.funder}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{s.suggestion}</p>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-accent-amber mt-1 px-2">
                      {s.action} →
                    </Button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Log Interaction Modal */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log Interaction</DialogTitle>
            {selectedFunder && <p className="text-sm text-muted-foreground">{selectedFunder.funder_name}</p>}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={newInteraction.date} onChange={e => setNewInteraction(prev => ({ ...prev, date: e.target.value }))} className="bg-secondary/30 border-border/30" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <select
                value={newInteraction.type}
                onChange={e => setNewInteraction(prev => ({ ...prev, type: e.target.value }))}
                className="w-full h-9 rounded-md border border-border/30 bg-secondary/30 text-foreground text-sm px-3"
              >
                {interactionTypes.map(t => (
                  <option key={t} value={t}>{interactionTypeLabels[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Summary</Label>
              <Textarea
                placeholder="What happened?"
                value={newInteraction.summary}
                onChange={e => setNewInteraction(prev => ({ ...prev, summary: e.target.value }))}
                className="bg-secondary/30 border-border/30 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-xs">Outcome (optional)</Label>
              <Textarea
                placeholder="What was the result?"
                value={newInteraction.outcome}
                onChange={e => setNewInteraction(prev => ({ ...prev, outcome: e.target.value }))}
                className="bg-secondary/30 border-border/30 min-h-[60px]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Sentiment</Label>
                <Button
                  size="sm" variant="ghost" className="h-6 text-[10px] text-primary"
                  onClick={analyseSentiment}
                  disabled={analysingSentiment || !newInteraction.summary}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {analysingSentiment ? "Analysing..." : "AI detect"}
                </Button>
              </div>
              <div className="flex gap-2 mt-1">
                {["positive", "neutral", "negative"].map(s => (
                  <button
                    key={s}
                    onClick={() => setNewInteraction(prev => ({ ...prev, sentiment: s }))}
                    className={`px-3 py-1.5 rounded-md text-xs capitalize transition-colors ${newInteraction.sentiment === s ? sentimentConfig[s].color : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleLogInteraction} className="w-full">Save Interaction</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CRMPage;
