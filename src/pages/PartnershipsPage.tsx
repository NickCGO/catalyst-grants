import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import MatchScoreRing from "@/components/MatchScoreRing";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation } from "@/hooks/useAuth";
import {
  Search, Users, Handshake, Send, CheckCircle, XCircle,
  MapPin, Shield, Plus, Globe,
} from "lucide-react";

interface DiscoverableOrg {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  org_size: string | null;
  focus_areas: string[] | null;
  partnership_open: boolean | null;
  partnership_statement: string | null;
  partnership_role: string | null;
  partnership_strengths: string[] | null;
  mission_statement: string | null;
  is_audited: boolean | null;
  programmes: string[] | null;
}

const PartnershipsPage = () => {
  const { org, loading: orgLoading } = useOrganisation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [discoverableOrgs, setDiscoverableOrgs] = useState<DiscoverableOrg[]>([]);
  const [activePartnerships, setActivePartnerships] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);

  // Request dialog
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<DiscoverableOrg | null>(null);
  const [requestRole, setRequestRole] = useState("equal");
  const [budgetSplit, setBudgetSplit] = useState([50]);
  const [requestMessage, setRequestMessage] = useState("");
  const [partnershipName, setPartnershipName] = useState("");

  useEffect(() => {
    if (orgLoading || !org?.id) return;
    loadData(org.id);
  }, [org?.id, orgLoading]);

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      const [discRes, partRes, memberRes] = await Promise.all([
        // Discoverable orgs (not self)
        supabase
          .from("organisations")
          .select("id, name, country, region, org_size, focus_areas, partnership_open, partnership_statement, partnership_role, partnership_strengths, mission_statement, is_audited, programmes")
          .eq("is_discoverable", true)
          .neq("id", orgId)
          .limit(50),
        // Partnerships where we are lead
        supabase
          .from("partnerships")
          .select("*, partnership_members(org_id, role, status, organisations(name))")
          .eq("lead_org_id", orgId),
        // Partnerships where we are a member
        supabase
          .from("partnership_members")
          .select("partnership_id, role, status, partnerships(*, partnership_members(org_id, role, organisations(name)))")
          .eq("org_id", orgId),
      ]);

      setDiscoverableOrgs(discRes.data || []);

      // Merge partnerships from both lead and member perspectives
      const allPartnerships = new Map<string, any>();
      (partRes.data || []).forEach(p => allPartnerships.set(p.id, p));
      (memberRes.data || []).forEach(m => {
        if (m.partnerships && !allPartnerships.has(m.partnerships.id)) {
          allPartnerships.set(m.partnerships.id, m.partnerships);
        }
      });

      const partArray = Array.from(allPartnerships.values());
      setActivePartnerships(partArray.filter(p => p.status !== "pending_request" && p.status !== "declined"));

      // Incoming = partnerships where status is pending and we're NOT lead
      const incoming = partArray.filter(p => p.status === "pending_request" && p.lead_org_id !== orgId);
      setIncomingRequests(incoming);

      // Outgoing = partnerships where status is pending and we ARE lead
      const outgoing = partArray.filter(p => p.status === "pending_request" && p.lead_org_id === orgId);
      setOutgoingRequests(outgoing);

    } catch (err) {
      console.error("Partnership load error:", err);
    } finally {
      setLoading(false);
    }
  }

  function calcComplementarity(partner: DiscoverableOrg): number {
    if (!org?.focus_areas || !partner.focus_areas) return 50;
    const myAreas = new Set(org.focus_areas);
    const overlap = partner.focus_areas.filter(a => myAreas.has(a)).length;
    const unique = partner.focus_areas.filter(a => !myAreas.has(a)).length;
    const total = new Set([...org.focus_areas, ...partner.focus_areas]).size;
    // Balance: some overlap (alignment) + some unique (complementarity)
    if (total === 0) return 50;
    const alignScore = (overlap / Math.max(org.focus_areas.length, 1)) * 50;
    const complementScore = (unique / total) * 50;
    return Math.min(99, Math.round(alignScore + complementScore));
  }

  const filteredOrgs = discoverableOrgs.filter(o => {
    if (searchQuery && !o.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (countryFilter && o.country !== countryFilter) return false;
    if (sizeFilter && o.org_size !== sizeFilter) return false;
    return true;
  });

  async function handleSendRequest() {
    if (!org || !selectedOrg) return;
    try {
      // Create partnership
      const { data: partnership, error: pErr } = await supabase.from("partnerships").insert({
        lead_org_id: org.id,
        partnership_name: partnershipName || `${org.name} × ${selectedOrg.name}`,
        description: requestMessage,
        status: "pending_request",
        partnership_type: "consortium",
        lead_share_percent: budgetSplit[0],
      }).select().single();

      if (pErr) throw pErr;

      // Add partner as member
      await supabase.from("partnership_members").insert({
        partnership_id: partnership.id,
        org_id: selectedOrg.id,
        role: requestRole === "lead" ? "sub_grantee" : requestRole === "sub" ? "lead" : "equal_partner",
        budget_share_percent: 100 - budgetSplit[0],
        status: "pending",
      });

      // Add self as member
      await supabase.from("partnership_members").insert({
        partnership_id: partnership.id,
        org_id: org.id,
        role: requestRole,
        budget_share_percent: budgetSplit[0],
        status: "active",
      });

      toast.success("Partnership request sent!");
      setRequestOpen(false);
      setRequestMessage("");
      setPartnershipName("");
      loadData(org.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to send request");
    }
  }

  async function handleAccept(partnershipId: string) {
    if (!org) return;
    try {
      await supabase.from("partnerships").update({ status: "forming" }).eq("id", partnershipId);
      await supabase.from("partnership_members").update({ status: "active" }).eq("partnership_id", partnershipId).eq("org_id", org.id);
      toast.success("Partnership accepted! Workspace created.");
      loadData(org.id);
    } catch {
      toast.error("Failed to accept");
    }
  }

  async function handleDecline(partnershipId: string) {
    if (!org) return;
    await supabase.from("partnerships").update({ status: "declined" }).eq("id", partnershipId);
    toast.info("Request declined");
    loadData(org.id);
  }

  function getPartnerNames(p: any): string {
    const members = p.partnership_members || [];
    return members
      .filter((m: any) => m.org_id !== org?.id)
      .map((m: any) => m.organisations?.name || "Unknown")
      .join(", ") || "No partners yet";
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Partnership Hub</h1>
            <p className="text-sm text-muted-foreground mt-1">Find partners, form consortia, and co-write proposals</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="discover">Discover Partners</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Requests
              {incomingRequests.length > 0 && (
                <span className="ml-1.5 h-4 w-4 rounded-full bg-amber-500 text-[9px] text-white flex items-center justify-center">
                  {incomingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Active Partnerships</h2>
              {activePartnerships.length > 0 ? (
                <div className="grid gap-4">
                  {activePartnerships.map((p) => (
                    <GlassCard key={p.id} className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{p.partnership_name || "Unnamed Partnership"}</h3>
                            <Badge variant="secondary" className="text-[10px]">{p.partnership_type}</Badge>
                            <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            With {getPartnerNames(p)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/partnerships/${p.id}`)}>
                          Open Workspace →
                        </Button>
                      </div>
                      {p.trust_score && (
                        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${p.trust_score}%` }} />
                        </div>
                      )}
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <GlassCard className="p-8 text-center">
                  <Handshake className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No active partnerships yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Discover NGO partners to form your first consortium.</p>
                </GlassCard>
              )}
            </div>

            {/* AI Suggested - top complementarity from discoverable */}
            {discoverableOrgs.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">✨</span> Suggested Partners
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {discoverableOrgs
                    .map(o => ({ ...o, score: calcComplementarity(o) }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map((p) => (
                      <GlassCard key={p.id} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">
                              {p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground">{p.name}</span>
                            <div className="text-[10px] text-muted-foreground">{p.score}% complementary</div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">
                          {p.partnership_statement || p.mission_statement || "Open to partnerships"}
                        </p>
                        <Button size="sm" className="w-full text-xs" onClick={() => {
                          setSelectedOrg(p);
                          setRequestOpen(true);
                        }}>
                          Send Partnership Request →
                        </Button>
                      </GlassCard>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-4">
            <div className="flex gap-4">
              <div className="w-64 shrink-0 space-y-4">
                <GlassCard className="p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search NGOs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-secondary/30 border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Country</label>
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                      <SelectTrigger className="mt-1 bg-secondary/30 border-border"><SelectValue placeholder="All countries" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All countries</SelectItem>
                        <SelectItem value="South Africa">South Africa</SelectItem>
                        <SelectItem value="Kenya">Kenya</SelectItem>
                        <SelectItem value="Nigeria">Nigeria</SelectItem>
                        <SelectItem value="Ghana">Ghana</SelectItem>
                        <SelectItem value="Tanzania">Tanzania</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Organisation Size</label>
                    <Select value={sizeFilter} onValueChange={setSizeFilter}>
                      <SelectTrigger className="mt-1 bg-secondary/30 border-border"><SelectValue placeholder="All sizes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sizes</SelectItem>
                        <SelectItem value="micro">Micro (1-5)</SelectItem>
                        <SelectItem value="small">Small (6-20)</SelectItem>
                        <SelectItem value="medium">Medium (21-50)</SelectItem>
                        <SelectItem value="large">Large (50+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </GlassCard>
              </div>

              <div className="flex-1">
                {filteredOrgs.length === 0 ? (
                  <GlassCard className="p-8 text-center">
                    <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No discoverable organisations found.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: Enable "Discoverable" in your Settings to appear here for others too.
                    </p>
                  </GlassCard>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredOrgs.map((p) => {
                      const score = calcComplementarity(p);
                      return (
                        <GlassCard key={p.id} className="p-5 hover:border-primary/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">
                                  {p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground text-sm">{p.name}</span>
                                  {p.is_audited && <Shield className="h-3.5 w-3.5 text-primary" />}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <MapPin className="h-3 w-3" /> {p.country} {p.region ? `· ${p.region}` : ""} {p.org_size ? `· ${p.org_size}` : ""}
                                </div>
                              </div>
                            </div>
                            <div className="w-12 h-12">
                              <MatchScoreRing score={score} size="sm" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {p.partnership_statement || p.mission_statement || "Open to partnerships"}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {(p.focus_areas || []).slice(0, 4).map((a) => (
                              <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs flex-1"
                              onClick={() => navigate(`/partnerships/profile/${p.id}`)}>
                              View Profile
                            </Button>
                            <Button size="sm" className="text-xs flex-1 gap-1" onClick={() => {
                              setSelectedOrg(p);
                              setRequestOpen(true);
                            }}>
                              <Send className="h-3 w-3" /> Request
                            </Button>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Incoming Requests</h2>
              {incomingRequests.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <p className="text-xs text-muted-foreground">No incoming requests</p>
                </GlassCard>
              ) : (
                incomingRequests.map((r) => (
                  <GlassCard key={r.id} className="p-5 border-amber-500/20 mb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{r.partnership_name || "Partnership Request"}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span>Split: {r.lead_share_percent || 50}% / {100 - (r.lead_share_percent || 50)}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleDecline(r.id)}>
                          <XCircle className="h-3 w-3" /> Decline
                        </Button>
                        <Button size="sm" className="text-xs gap-1" onClick={() => handleAccept(r.id)}>
                          <CheckCircle className="h-3 w-3" /> Accept
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Outgoing Requests</h2>
              {outgoingRequests.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <p className="text-xs text-muted-foreground">No outgoing requests</p>
                </GlassCard>
              ) : (
                outgoingRequests.map((r) => (
                  <GlassCard key={r.id} className="p-5 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground text-sm">{r.partnership_name || "Partnership Request"}</h3>
                        <p className="text-xs text-muted-foreground">
                          Sent {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Partnership Request Dialog */}
        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Send Partnership Request {selectedOrg ? `to ${selectedOrg.name}` : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">Partnership Name</label>
                <Input
                  value={partnershipName}
                  onChange={e => setPartnershipName(e.target.value)}
                  placeholder={selectedOrg ? `${org?.name} × ${selectedOrg.name}` : "Enter name"}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Your Proposed Role</label>
                <Select value={requestRole} onValueChange={setRequestRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead Organisation</SelectItem>
                    <SelectItem value="sub">Sub-grantee</SelectItem>
                    <SelectItem value="equal">Equal Partners</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">
                  Budget Split: You {budgetSplit[0]}% / Partner {100 - budgetSplit[0]}%
                </label>
                <Slider value={budgetSplit} onValueChange={setBudgetSplit} min={20} max={80} step={5} className="mt-2" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Your Message</label>
                <Textarea
                  value={requestMessage}
                  onChange={e => setRequestMessage(e.target.value)}
                  className="mt-1"
                  placeholder="Introduce your organisation and explain why this partnership would be valuable..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSendRequest} className="w-full gap-2" disabled={!selectedOrg}>
                <Send className="h-4 w-4" /> Send Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PartnershipsPage;
