import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { MatchScoreRing } from "@/components/MatchScoreRing";
import { toast } from "sonner";
import {
  Search, Users, Handshake, Send, CheckCircle, XCircle,
  MessageSquare, FileText, Plus, Globe, MapPin, Shield,
} from "lucide-react";

// Mock data
const mockPartners = [
  {
    id: "1", name: "Horizon Youth Foundation", tagline: "Empowering Cape Town's youth through education and sport",
    country: "South Africa", region: "Western Cape", size: "small (6-20)", focusAreas: ["Youth", "Education", "Sports"],
    appetite: "open", statement: "Looking for partners with health programming to submit joint applications.",
    complementarity: 87, verified: true, programmes: ["After School Programme", "Youth Leadership Academy"],
  },
  {
    id: "2", name: "Ubuntu Health Initiative", tagline: "Community-based healthcare in rural South Africa",
    country: "South Africa", region: "Eastern Cape", size: "medium (21-50)", focusAreas: ["Health/HIV", "Women", "Community Dev"],
    appetite: "selective", statement: "We bring strong M&E frameworks and rural community networks.",
    complementarity: 72, verified: true, programmes: ["Mobile Health Clinics", "CHW Training"],
  },
  {
    id: "3", name: "Green Futures Africa", tagline: "Environmental education and conservation across Southern Africa",
    country: "South Africa", region: "KwaZulu-Natal", size: "small (6-20)", focusAreas: ["Environment", "Education", "Youth"],
    appetite: "open", statement: "Open to consortiums for international climate funding.",
    complementarity: 64, verified: false, programmes: ["Eco Schools", "Community Gardens"],
  },
];

const mockActivePartnerships = [
  {
    id: "p1", name: "Cape Youth Consortium", type: "consortium", partner: "Horizon Youth Foundation",
    funder: "DG Murray Trust", status: "forming", progress: 30,
  },
];

const mockRequests = {
  incoming: [
    {
      id: "r1", org: "Ubuntu Health Initiative", grant: "Comic Relief - Health & Education",
      role: "sub_grantee", split: { requesting: 60, target: 40 },
      message: "We'd love to partner on the Comic Relief call. Your education work complements our health programming perfectly.",
      deadline: "2026-04-15",
    },
  ],
  outgoing: [
    {
      id: "r2", org: "Green Futures Africa", grant: "General partnership",
      role: "lead", status: "pending", sentAt: "2026-03-20",
    },
  ],
};

const PartnerCard = ({ partner, onRequest }: { partner: typeof mockPartners[0]; onRequest: () => void }) => (
  <GlassCard className="p-5 hover:border-primary/30 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{partner.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">{partner.name}</span>
            {partner.verified && <Shield className="h-3.5 w-3.5 text-primary" />}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {partner.region} · {partner.size}
          </div>
        </div>
      </div>
      <div className="w-12 h-12">
        <MatchScoreRing score={partner.complementarity} size="sm" />
      </div>
    </div>
    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{partner.tagline}</p>
    <div className="flex flex-wrap gap-1 mb-3">
      {partner.focusAreas.map((a) => (
        <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
      ))}
    </div>
    <p className="text-[10px] text-muted-foreground italic mb-3">"{partner.statement}"</p>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="text-xs flex-1">View Profile</Button>
      <Button size="sm" className="text-xs flex-1 gap-1" onClick={onRequest}>
        <Send className="h-3 w-3" /> Request
      </Button>
    </div>
  </GlassCard>
);

const PartnershipsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [budgetSplit, setBudgetSplit] = useState([60]);

  const handleSendRequest = () => {
    toast.success("Partnership request sent!");
    setRequestOpen(false);
  };

  const handleAccept = (id: string) => {
    toast.success("Partnership accepted! Workspace created.");
  };

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
              {mockRequests.incoming.length > 0 && (
                <span className="ml-1.5 h-4 w-4 rounded-full bg-amber-500 text-[9px] text-white flex items-center justify-center">
                  {mockRequests.incoming.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Active Partnerships */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Active Partnerships</h2>
              {mockActivePartnerships.length > 0 ? (
                <div className="grid gap-4">
                  {mockActivePartnerships.map((p) => (
                    <GlassCard key={p.id} className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{p.name}</h3>
                            <Badge variant="secondary" className="text-[10px]">{p.type}</Badge>
                            <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            With {p.partner} · Targeting: {p.funder}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">Open Workspace →</Button>
                      </div>
                      <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
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

            {/* AI Suggested Matches */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">✨</span> AI-Suggested Partners
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockPartners.slice(0, 3).map((p) => (
                  <GlassCard key={p.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">{p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-foreground">{p.name}</span>
                        <div className="text-[10px] text-muted-foreground">{p.complementarity}% complementary</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{p.tagline}</p>
                    <Button size="sm" className="w-full text-xs">Send Partnership Request →</Button>
                  </GlassCard>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-4">
            <div className="flex gap-4">
              {/* Filters */}
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
                    <Select>
                      <SelectTrigger className="mt-1 bg-secondary/30 border-border"><SelectValue placeholder="All countries" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="za">South Africa</SelectItem>
                        <SelectItem value="ke">Kenya</SelectItem>
                        <SelectItem value="ng">Nigeria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Organisation Size</label>
                    <Select>
                      <SelectTrigger className="mt-1 bg-secondary/30 border-border"><SelectValue placeholder="All sizes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="micro">Micro (1-5)</SelectItem>
                        <SelectItem value="small">Small (6-20)</SelectItem>
                        <SelectItem value="medium">Medium (21-50)</SelectItem>
                        <SelectItem value="large">Large (50+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Partnership Role</label>
                    <Select>
                      <SelectTrigger className="mt-1 bg-secondary/30 border-border"><SelectValue placeholder="Any role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="sub">Sub-grantee</SelectItem>
                        <SelectItem value="equal">Equal Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </GlassCard>
              </div>

              {/* Results */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockPartners
                  .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => (
                    <PartnerCard
                      key={p.id}
                      partner={p}
                      onRequest={() => { setSelectedPartner(p.id); setRequestOpen(true); }}
                    />
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {/* Incoming */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Incoming Requests</h2>
              {mockRequests.incoming.map((r) => (
                <GlassCard key={r.id} className="p-5 border-amber-500/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{r.org}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">For: {r.grant}</p>
                      <p className="text-xs text-muted-foreground mt-2 italic">"{r.message}"</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>Role: {r.role === "sub_grantee" ? "Sub-grantee" : r.role}</span>
                        <span>Split: {r.split.requesting}% / {r.split.target}%</span>
                        <span>Deadline: {r.deadline}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info("Declined")}>
                        <XCircle className="h-3 w-3" /> Decline
                      </Button>
                      <Button size="sm" className="text-xs gap-1" onClick={() => handleAccept(r.id)}>
                        <CheckCircle className="h-3 w-3" /> Accept
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Outgoing */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Outgoing Requests</h2>
              {mockRequests.outgoing.map((r) => (
                <GlassCard key={r.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground text-sm">{r.org}</h3>
                      <p className="text-xs text-muted-foreground">For: {r.grant} · Sent {r.sentAt}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                  </div>
                </GlassCard>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Partnership Request Dialog */}
        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Send Partnership Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">Grant / Opportunity</label>
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a grant or 'General partnership'" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Partnership</SelectItem>
                    <SelectItem value="dg">DG Murray Trust - Education</SelectItem>
                    <SelectItem value="comic">Comic Relief - Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Your Proposed Role</label>
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead Organisation</SelectItem>
                    <SelectItem value="sub">Sub-grantee</SelectItem>
                    <SelectItem value="equal">Equal Partners</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Budget Split: You {budgetSplit[0]}% / Partner {100 - budgetSplit[0]}%</label>
                <Slider value={budgetSplit} onValueChange={setBudgetSplit} min={20} max={80} step={5} className="mt-2" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Your Message</label>
                <Textarea
                  className="mt-1"
                  placeholder="Introduce your organisation and explain why this partnership would be valuable..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSendRequest} className="w-full gap-2">
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
