import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Globe, Mail,
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
import CRMEmailComposer from "@/components/crm/CRMEmailComposer";
import CRMEmailLog from "@/components/crm/CRMEmailLog";
import CRMActivityFeed from "@/components/crm/CRMActivityFeed";
import CRMContactsSection from "@/components/crm/CRMContactsSection";

import { hints } from "@/lib/formHints";

const CRMDetailPage = () => {
  const { funderId } = useParams();
  const { user } = useAuth();
  const [funder, setFunder] = useState<any>(null);
  const [relationship, setRelationship] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [inboundEmails, setInboundEmails] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [nextActionType, setNextActionType] = useState("");
  const [nextActionNote, setNextActionNote] = useState("");
  const [emailRefreshKey, setEmailRefreshKey] = useState(0);

  const loadData = async () => {
    if (!user || !funderId) return;
    const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
    if (!org) { setLoading(false); return; }
    setOrgId(org.id);

    const [{ data: funderData }, { data: relData }, { data: interData }, { data: appData }, { data: inboundData }] = await Promise.all([
      supabase.from("funders").select("*").eq("id", funderId).maybeSingle(),
      supabase.from("funder_relationships").select("*").eq("org_id", org.id).eq("funder_id", funderId).maybeSingle(),
      supabase.from("funder_interactions").select("*").eq("org_id", org.id).eq("funder_id", funderId).order("date", { ascending: false }),
      supabase.from("applications").select("*").eq("org_id", org.id).eq("funder_id", funderId).order("created_at", { ascending: false }),
      supabase.from("inbound_emails").select("*").eq("org_id", org.id).eq("funder_id", funderId).order("received_at", { ascending: false }),
    ]);

    setFunder(funderData);
    setRelationship(relData);
    setInteractions(interData || []);
    setApplications(appData || []);
    setInboundEmails(inboundData || []);
    if (relData) {
      setNotes(relData.notes || "");
      setNextActionDate(relData.next_action_date || "");
      setNextActionType(relData.next_action_type || "");
      setNextActionNote(relData.next_action_note || "");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user, funderId]);

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

  const formatCurrency = (v: number) => `$${(v || 0).toLocaleString()}`;

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
        {/* Header */}
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
              {funder.email && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{funder.email}</span>
                </>
              )}
            </div>
          </div>
          <MatchScoreRing score={relationship?.health_score || 50} size="lg" />
        </div>

        {/* Stats */}
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

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-secondary/30 border border-border/30">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs">Contacts</TabsTrigger>
            <TabsTrigger value="communications" className="text-xs">Communications</TabsTrigger>
            <TabsTrigger value="inbox" className="text-xs">Inbox ({inboundEmails.length})</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
            <TabsTrigger value="applications" className="text-xs">Applications ({applications.length})</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>


          {/* Overview Tab */}
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
                    <p className="text-[10px] text-muted-foreground mt-1">{hints.crm.nextActionDate}</p>
                  </div>
                  <div>
                    <Label className="text-[10px]">Type</Label>
                    <Input value={nextActionType} onChange={e => setNextActionType(e.target.value)} className="bg-secondary/30 border-border/30 h-8 text-xs" placeholder="e.g. Follow up" />
                    <p className="text-[10px] text-muted-foreground mt-1">{hints.crm.nextActionType}</p>
                  </div>
                  <div>
                    <Label className="text-[10px]">Note</Label>
                    <Textarea value={nextActionNote} onChange={e => setNextActionNote(e.target.value)} className="bg-secondary/30 border-border/30 min-h-[60px] text-xs" />
                    <p className="text-[10px] text-muted-foreground mt-1">{hints.crm.nextActionNote}</p>
                  </div>
                  <Button size="sm" className="w-full h-7 text-xs" onClick={saveAction}>Save Action</Button>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            {orgId && funderId && (
              <CRMContactsSection orgId={orgId} funderId={funderId} relationshipId={relationship?.id} />
            )}
          </TabsContent>



          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-4">
            {orgId && funderId && (
              <>
                <CRMEmailComposer
                  orgId={orgId}
                  funderId={funderId}
                  funderName={funder.donor_name}
                  funderEmail={funder.email}
                  relationshipId={relationship?.id}
                  onEmailSaved={() => { setEmailRefreshKey(k => k + 1); loadData(); }}
                />
                <CRMEmailLog orgId={orgId} funderId={funderId} refreshKey={emailRefreshKey} />
              </>
            )}
          </TabsContent>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Replies from this funder</h3>
            {inboundEmails.length === 0 ? (
              <p className="text-xs text-muted-foreground">No inbound replies linked to this funder yet.</p>
            ) : (
              <div className="space-y-2">
                {inboundEmails.map((e) => (
                  <GlassCard key={e.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {e.subject || "(no subject)"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {e.from_name || e.from_email} · {new Date(e.received_at).toLocaleString()}
                        </p>
                        {e.body_text && (
                          <p className="text-xs text-foreground/80 mt-2 line-clamp-3 whitespace-pre-wrap">
                            {e.body_text}
                          </p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            {orgId && funderId && (
              <CRMActivityFeed
                orgId={orgId}
                funderId={funderId}
                interactions={interactions}
                onRefresh={loadData}
              />
            )}
          </TabsContent>

          {/* Applications Tab */}
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
                          {app.amount_requested ? `$${Number(app.amount_requested).toLocaleString()}` : ""} · {new Date(app.created_at).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}
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

          {/* Notes Tab */}
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
