import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Mail, Phone, Users, FileText, TrendingUp, Eye,
  Calendar, MessageSquare, Star, Sparkles, Plus, ExternalLink,
  Globe, Clock, Tag,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const sentimentColors: Record<string, string> = {
  positive: "bg-success/20 text-success",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-destructive/20 text-destructive",
};

const interactionIcons: Record<string, typeof Mail> = {
  email_sent: Mail, email_received: Mail, call: Phone, meeting: Users,
  proposal_submitted: FileText, proposal_outcome: TrendingUp,
  report_submitted: FileText, site_visit: Eye, event: Calendar, note: MessageSquare,
};

const interactionLabels: Record<string, string> = {
  email_sent: "Email Sent", email_received: "Email Received", call: "Phone Call",
  meeting: "Meeting", proposal_submitted: "Proposal Submitted", proposal_outcome: "Proposal Outcome",
  report_submitted: "Report Submitted", site_visit: "Site Visit", event: "Conference", note: "Note",
};

const mockFunder = {
  id: "f1", name: "DG Murray Trust", category: "SA Trusts/ Foundations",
  focus: "Education innovation, leadership development, and institutional strengthening in South Africa",
  method: "Concept Note", application_period: "Jan–May", website: "https://dgmt.co.za",
  contact_person: "David Harrison", email: "info@dgmt.co.za", geographical_area: "National",
};

const mockRelationship = {
  status: "active", health_score: 82, tags: ["strategic", "annual"],
  total_applied: 450000, total_awarded: 180000, applications_count: 3, successful_count: 2,
  next_action_date: "2026-03-28", next_action_type: "Follow up", next_action_note: "Check on Q1 proposal status",
  owner: "Sarah Moyo",
};

const mockInteractions = [
  { id: "1", type: "proposal_submitted", date: "2026-03-18", summary: "Submitted Q2 concept note for Education Innovation programme", outcome: "Awaiting response", sentiment: "positive", created_by: "Sarah Moyo" },
  { id: "2", type: "email_received", date: "2026-03-10", summary: "Received positive feedback on Q1 report, funder noted strong M&E data", outcome: "Encouraged to apply for additional funding", sentiment: "positive", created_by: "System" },
  { id: "3", type: "meeting", date: "2026-02-20", summary: "Met with programme officer at sector conference in Cape Town", outcome: "Agreed to informal check-in before next submission", sentiment: "positive", created_by: "Sarah Moyo" },
  { id: "4", type: "report_submitted", date: "2026-01-15", summary: "Submitted Q4 2025 impact report covering AfterSchool programme", outcome: "Acknowledged receipt", sentiment: "neutral", created_by: "James Ndlovu" },
  { id: "5", type: "call", date: "2025-11-05", summary: "Called to discuss upcoming funding cycles and potential for multi-year grant", outcome: "Funder open to multi-year discussion in March", sentiment: "positive", created_by: "Sarah Moyo" },
];

const mockApplications = [
  { id: "a1", project: "AfterSchool Enhancement 2026", status: "submitted", amount: 200000, date: "2026-03-18" },
  { id: "a2", project: "ECD Teacher Training", status: "successful", amount: 150000, date: "2025-09-01" },
  { id: "a3", project: "Youth Leadership Programme", status: "successful", amount: 100000, date: "2025-03-15" },
];

const aiInsights = [
  "They responded to your 2025 proposals within 3 weeks — faster than average for this funder category.",
  "They funded 2 of your last 3 applications — a strong 67% win rate indicates a healthy relationship.",
  "Their next open window is January–May. You've already submitted for Q2 — consider a follow-up in 10 days.",
];

const CRMDetailPage = () => {
  const { funderId } = useParams();
  const [notes, setNotes] = useState("DG Murray Trust has been a consistent supporter of our education programmes. Key contact David Harrison is responsive and values strong M&E data.\n\nThey prefer concept notes under 5 pages. Always include a Theory of Change diagram.");
  const [nextActionDate, setNextActionDate] = useState(mockRelationship.next_action_date);
  const [nextActionType, setNextActionType] = useState(mockRelationship.next_action_type);
  const [nextActionNote, setNextActionNote] = useState(mockRelationship.next_action_note);

  const formatCurrency = (v: number) => `R${v.toLocaleString()}`;
  const winRate = mockRelationship.applications_count > 0 ? Math.round((mockRelationship.successful_count / mockRelationship.applications_count) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link to="/crm" className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-2">
              <ArrowLeft className="h-3 w-3" /> Back to CRM
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{mockFunder.name}</h1>
              <Badge className="bg-success/20 text-success capitalize">{mockRelationship.status}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>{mockFunder.category}</span>
              <span>•</span>
              <span>{mockFunder.geographical_area}</span>
              <span>•</span>
              <span>Owner: {mockRelationship.owner}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <MatchScoreRing score={mockRelationship.health_score} size="lg" />
              <p className="text-[10px] text-muted-foreground mt-1">Health Score</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Applied", value: formatCurrency(mockRelationship.total_applied) },
            { label: "Total Won", value: formatCurrency(mockRelationship.total_awarded) },
            { label: "Win Rate", value: `${winRate}%` },
            { label: "Applications", value: mockRelationship.applications_count.toString() },
          ].map(s => (
            <GlassCard key={s.label} className="p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-secondary/30 border border-border/30">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="interactions" className="text-xs">Interactions</TabsTrigger>
            <TabsTrigger value="applications" className="text-xs">Applications</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Funder Profile */}
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Funder Profile</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p><span className="text-foreground font-medium">Focus:</span> {mockFunder.focus}</p>
                  <p><span className="text-foreground font-medium">Method:</span> {mockFunder.method}</p>
                  <p><span className="text-foreground font-medium">Application Period:</span> {mockFunder.application_period}</p>
                  <p><span className="text-foreground font-medium">Contact:</span> {mockFunder.contact_person} · {mockFunder.email}</p>
                  {mockFunder.website && (
                    <a href={mockFunder.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3 w-3" /> {mockFunder.website}
                    </a>
                  )}
                </div>
              </GlassCard>

              {/* AI Relationship Intelligence */}
              <GlassCard className="p-4 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Relationship Intelligence</h3>
                </div>
                <div className="space-y-2">
                  {aiInsights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <p className="text-xs text-muted-foreground">{insight}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Next Action */}
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Next Action</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[10px]">Date</Label>
                    <Input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} className="bg-secondary/30 border-border/30 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Type</Label>
                    <Input value={nextActionType} onChange={e => setNextActionType(e.target.value)} className="bg-secondary/30 border-border/30 h-8 text-xs" placeholder="e.g. Follow up, Submit report" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Note</Label>
                    <Textarea value={nextActionNote} onChange={e => setNextActionNote(e.target.value)} className="bg-secondary/30 border-border/30 min-h-[60px] text-xs" />
                  </div>
                  <Button size="sm" className="w-full h-7 text-xs" onClick={() => toast({ title: "Action updated" })}>Save Action</Button>
                </div>
              </GlassCard>

              {/* Tags */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockRelationship.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="bg-secondary/30">{tag}</Badge>
                  ))}
                  <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground">
                    <Plus className="h-3 w-3 mr-1" /> Add tag
                  </Button>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Interaction Timeline</h3>
              <Button size="sm" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" /> Log Interaction</Button>
            </div>
            <div className="space-y-1">
              {mockInteractions.map((interaction, i) => {
                const Icon = interactionIcons[interaction.type] || MessageSquare;
                return (
                  <motion.div key={interaction.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/10 transition-colors">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {i < mockInteractions.length - 1 && <div className="w-px flex-1 bg-border/30 mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{interactionLabels[interaction.type]}</span>
                          <Badge className={`${sentimentColors[interaction.sentiment]} text-[9px] h-4`}>{interaction.sentiment}</Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(interaction.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{interaction.summary}</p>
                        {interaction.outcome && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 italic">Outcome: {interaction.outcome}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/50 mt-1">by {interaction.created_by}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Applications History</h3>
            <div className="space-y-2">
              {mockApplications.map(app => (
                <GlassCard key={app.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">{app.project}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(app.amount)} · {new Date(app.date).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}</p>
                    </div>
                    <Badge className={app.status === "successful" ? "bg-success/20 text-success" : app.status === "submitted" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}>
                      {app.status}
                    </Badge>
                  </div>
                </GlassCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Strategic Notes</h3>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="bg-secondary/30 border-border/30 min-h-[300px] text-sm"
            />
            <Button size="sm" onClick={() => toast({ title: "Notes saved" })}>Save Notes</Button>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CRMDetailPage;
