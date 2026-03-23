import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Mail, Phone, Users, FileText, TrendingUp, Eye,
  Calendar, MessageSquare, Star, Sparkles, Plus, Globe, Tag,
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const sentimentColors: Record<string, string> = {
  positive: "bg-success/20 text-success",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-destructive/20 text-destructive",
  unknown: "bg-muted text-muted-foreground",
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

const CRMDetailPage = () => {
  const { funderId } = useParams();
  const { user } = useAuth();
  const [funder, setFunder] = useState<any>(null);
  const [relationship, setRelationship] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [nextActionType, setNextActionType] = useState("");
  const [nextActionNote, setNextActionNote] = useState("");

  useEffect(() => {
    if (!user || !funderId) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) { setLoading(false); return; }

      const [{ data: funderData }, { data: relData }, { data: interData }, { data: appData }] = await Promise.all([
        supabase.from("funders").select("*").eq("id", funderId).maybeSingle(),
        supabase.from("funder_relationships").select("*").eq("org_id", org.id).eq("funder_id", funderId).maybeSingle(),
        supabase.from("funder_interactions").select("*").eq("org_id", org.id).eq("funder_id", funderId).order("date", { ascending: false }),
        supabase.from("applications").select("*").eq("org_id", org.id).eq("funder_id", funderId).order("created_at", { ascending: false }),
      ]);

      setFunder(funderData);
      setRelationship(relData);
      setInteractions(interData || []);
      setApplications(appData || []);
      if (relData) {
        setNotes(relData.notes || "");
        setNextActionDate(relData.next_action_date || "");
        setNextActionType(relData.next_action_type || "");
        setNextActionNote(relData.next_action_note || "");
      }
      setLoading(false);
    };
    load();
  }, [user, funderId]);

  const saveAction = async () => {
    if (!relationship) return;
    await supabase.from("funder_relationships").update({
      next_action_date: nextActionDate || null,
      next_action_type: nextActionType || null,
      next_action_note: nextActionNote || null,
    }).eq("id", relationship.id);
    toast({ title: "Action updated" });
  };

  const saveNotes = async () => {
    if (!relationship) return;
    await supabase.from("funder_relationships").update({ notes }).eq("id", relationship.id);
    toast({ title: "Notes saved" });
  };

  const formatCurrency = (v: number) => `R${(v || 0).toLocaleString()}`;

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    </DashboardLayout>
  );

  if (!funder) return (
    <DashboardLayout>
      <div className="text-center py-12">
        <p className="text-muted-foreground">Funder not found</p>
        <Link to="/crm" className="text-primary text-sm mt-2 inline-block">← Back to CRM</Link>
      </div>
    </DashboardLayout>
  );

  const winRate = (relationship?.applications_count || 0) > 0 ? Math.round(((relationship?.successful_count || 0) / relationship.applications_count) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link to="/crm" className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-2">
              <ArrowLeft className="h-3 w-3" /> Back to CRM
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{funder.donor_name}</h1>
              {relationship && <Badge className="bg-success/20 text-success capitalize">{relationship.relationship_status}</Badge>}
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>{funder.category}</span>
              <span>•</span>
              <span>{funder.geographical_area || "National"}</span>
            </div>
          </div>
          <MatchScoreRing score={relationship?.health_score || 50} size="lg" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Applied", value: formatCurrency(Number(relationship?.total_applied) || 0) },
            { label: "Total Won", value: formatCurrency(Number(relationship?.total_awarded) || 0) },
            { label: "Win Rate", value: `${winRate}%` },
            { label: "Applications", value: String(relationship?.applications_count || applications.length || 0) },
          ].map(s => (
            <GlassCard key={s.label} className="p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-secondary/30 border border-border/30">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="interactions" className="text-xs">Interactions ({interactions.length})</TabsTrigger>
            <TabsTrigger value="applications" className="text-xs">Applications ({applications.length})</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Funder Profile</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {funder.funder_focus && <p><span className="text-foreground font-medium">Focus:</span> {funder.funder_focus}</p>}
                  {funder.method_of_approach && <p><span className="text-foreground font-medium">Method:</span> {funder.method_of_approach}</p>}
                  {funder.application_period && <p><span className="text-foreground font-medium">Application Period:</span> {funder.application_period}</p>}
                  {funder.contact_person && <p><span className="text-foreground font-medium">Contact:</span> {funder.contact_person} {funder.email && `· ${funder.email}`}</p>}
                  {funder.website && (
                    <a href={funder.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3 w-3" /> {funder.website}
                    </a>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Next Action</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[10px]">Date</Label>
                    <Input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} className="bg-secondary/30 border-border/30 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Type</Label>
                    <Input value={nextActionType} onChange={e => setNextActionType(e.target.value)} className="bg-secondary/30 border-border/30 h-8 text-xs" placeholder="e.g. Follow up" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Note</Label>
                    <Textarea value={nextActionNote} onChange={e => setNextActionNote(e.target.value)} className="bg-secondary/30 border-border/30 min-h-[60px] text-xs" />
                  </div>
                  <Button size="sm" className="w-full h-7 text-xs" onClick={saveAction}>Save Action</Button>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Interaction Timeline</h3>
            {interactions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No interactions logged yet.</p>
            ) : (
              <div className="space-y-1">
                {interactions.map((interaction, i) => {
                  const Icon = interactionIcons[interaction.interaction_type] || MessageSquare;
                  return (
                    <motion.div key={interaction.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/10 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">{interactionLabels[interaction.interaction_type] || interaction.interaction_type}</span>
                            <Badge className={`${sentimentColors[interaction.sentiment || "unknown"]} text-[9px] h-4`}>{interaction.sentiment}</Badge>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(interaction.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          {interaction.summary && <p className="text-xs text-muted-foreground mt-1">{interaction.summary}</p>}
                          {interaction.outcome && <p className="text-xs text-muted-foreground/70 mt-0.5 italic">Outcome: {interaction.outcome}</p>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Applications History</h3>
            {applications.length === 0 ? (
              <p className="text-xs text-muted-foreground">No applications with this funder yet.</p>
            ) : (
              <div className="space-y-2">
                {applications.map(app => (
                  <GlassCard key={app.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{app.project_name || "Application"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {app.amount_requested ? `R${Number(app.amount_requested).toLocaleString()}` : ""} · {new Date(app.created_at).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <Badge className={app.status === "successful" ? "bg-success/20 text-success" : app.status === "submitted" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}>
                        {app.status}
                      </Badge>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Strategic Notes</h3>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-secondary/30 border-border/30 min-h-[300px] text-sm" placeholder="Add notes about this funder relationship..." />
            <Button size="sm" onClick={saveNotes}>Save Notes</Button>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CRMDetailPage;
