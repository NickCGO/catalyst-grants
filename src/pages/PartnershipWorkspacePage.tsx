import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import MatchScoreRing from "@/components/MatchScoreRing";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import {
  Users, FileText, MessageSquare, Download, Upload, Sparkles, Clock,
  CheckCircle, Lock, Send, ArrowLeft, Merge, Shield, Eye,
} from "lucide-react";

const sections = [
  { key: "executive_summary", label: "Executive Summary" },
  { key: "problem_statement", label: "Problem Statement" },
  { key: "project_objectives", label: "Project Objectives" },
  { key: "methodology", label: "Methodology & Activities" },
  { key: "monitoring_evaluation", label: "Monitoring & Evaluation" },
  { key: "budget_narrative", label: "Budget Narrative" },
  { key: "organisational_capacity", label: "Organisational Capacity" },
  { key: "conclusion", label: "Conclusion" },
];

const mockPartnership = {
  id: "p1",
  name: "Cape Youth Consortium",
  type: "consortium",
  status: "forming",
  funder: "DG Murray Trust",
  deadline: "2026-05-15",
  leadOrg: { id: "org1", name: "Elizayo Foundation", initials: "EF" },
  partnerOrg: { id: "org2", name: "Horizon Youth Foundation", initials: "HY" },
  budgetTotal: 750000,
  leadShare: 60,
  responsibilities: {
    lead: ["Proposal writing", "Fund management", "Reporting", "M&E oversight"],
    partner: ["Programme delivery in Cape Flats", "Youth recruitment", "Field data collection"],
  },
};

const mockMessages = [
  { id: "m1", sender: "Horizon Youth Foundation", initials: "HY", text: "Hi! Excited to work together on this. We've started drafting our methodology section.", time: "2 hours ago" },
  { id: "m2", sender: "Elizayo Foundation", initials: "EF", text: "Great! I've allocated the sections — you'll see the ownership tags. Let us know if you want to swap any.", time: "1 hour ago" },
  { id: "m3", sender: "Horizon Youth Foundation", initials: "HY", text: "Looks good. We'll have our sections done by Friday. Can you share the funder guidelines?", time: "30 min ago" },
];

const mockDocs = [
  { name: "Elizayo_NPO_Certificate.pdf", org: "Elizayo Foundation", type: "Lead Org Docs", date: "2026-03-20" },
  { name: "Elizayo_Audited_Financials_2025.pdf", org: "Elizayo Foundation", type: "Lead Org Docs", date: "2026-03-20" },
  { name: "Horizon_NPO_Certificate.pdf", org: "Horizon Youth Foundation", type: "Partner Org Docs", date: "2026-03-21" },
  { name: "DG_Murray_Guidelines_2026.pdf", org: "Elizayo Foundation", type: "Funder Requirements", date: "2026-03-22" },
];

const PartnershipWorkspacePage = () => {
  const { id } = useParams();
  const p = mockPartnership;

  const [activeSection, setActiveSection] = useState("executive_summary");
  const [sectionOwnership, setSectionOwnership] = useState<Record<string, string>>({
    executive_summary: "org1", problem_statement: "org1", project_objectives: "shared",
    methodology: "org2", monitoring_evaluation: "org1", budget_narrative: "org1",
    organisational_capacity: "shared", conclusion: "org1",
  });
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({
    executive_summary: "The Cape Youth Consortium, led by Elizayo Foundation in partnership with Horizon Youth Foundation, proposes a comprehensive youth development programme targeting at-risk adolescents in the Western Cape...",
    methodology: "Horizon Youth Foundation will deliver the community-based component through their established After School Programme network across Cape Flats, reaching 500 young people aged 13-24...",
  });
  const [merging, setMerging] = useState(false);
  const [mouGenerating, setMouGenerating] = useState(false);
  const [mouContent, setMouContent] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const daysLeft = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const completedSections = Object.keys(sectionContent).length;
  const progressPct = Math.round((completedSections / sections.length) * 100);

  const ownerLabel = (key: string) => {
    const owner = sectionOwnership[key];
    if (owner === "org1") return { label: p.leadOrg.name, color: "bg-primary/15 text-primary border-primary/30" };
    if (owner === "org2") return { label: p.partnerOrg.name, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    return { label: "Shared", color: "bg-teal-500/15 text-teal-400 border-teal-500/30" };
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      const result = await callAI(
        "Merge these sections from two NGOs into a coherent proposal. Ensure consistent voice and remove duplication. Return the merged text.",
        Object.entries(sectionContent).map(([k, v]) => `## ${k}\n${v}`).join("\n\n")
      );
      toast.success("Sections merged & harmonised successfully!");
    } catch {
      toast.error("Merge failed. Try again.");
    }
    setMerging(false);
  };

  const handleGenerateMOU = async () => {
    setMouGenerating(true);
    try {
      const result = await callAI(
        `Generate a partnership MOU between ${p.leadOrg.name} (lead, ${p.leadShare}% budget) and ${p.partnerOrg.name} (partner, ${100 - p.leadShare}% budget) for a grant application to ${p.funder}. Include: Purpose, Roles, Financial Management, Reporting, Dispute Resolution, Termination. Format as professional HTML.`,
        JSON.stringify({ partnership: p.name, budget: p.budgetTotal, responsibilities: p.responsibilities })
      );
      setMouContent(result || "MOU content generated.");
      toast.success("MOU generated!");
    } catch {
      toast.error("MOU generation failed.");
    }
    setMouGenerating(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/partnerships" className="p-2 rounded-lg hover:bg-secondary/30 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">{p.name}</h1>
              <Badge variant="secondary" className="text-[10px]">{p.type}</Badge>
              <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">{p.leadOrg.initials}</div>
                {p.leadOrg.name} (Lead)
              </span>
              <span>+</span>
              <span className="flex items-center gap-1">
                <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[8px] font-bold text-amber-400">{p.partnerOrg.initials}</div>
                {p.partnerOrg.name}
              </span>
              <span>·</span>
              <span>Targeting: {p.funder}</span>
              <span>·</span>
              <span className={daysLeft < 14 ? "text-destructive" : ""}>
                <Clock className="h-3 w-3 inline mr-0.5" /> {daysLeft} days left
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Proposal Progress</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progressPct} className="w-24 h-1.5" />
              <span className="text-xs font-medium text-foreground">{progressPct}%</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="proposal">Shared Proposal</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-5 gap-6">
              {/* Left - Agreement Summary */}
              <div className="col-span-3 space-y-4">
                <GlassCard hoverable={false}>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Partnership Agreement</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg border border-border/30">
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">Lead Organisation</div>
                      <div className="text-sm font-medium text-foreground">{p.leadOrg.name}</div>
                      <div className="text-xs text-primary">{p.leadShare}% budget</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border/30">
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">Partner Organisation</div>
                      <div className="text-sm font-medium text-foreground">{p.partnerOrg.name}</div>
                      <div className="text-xs text-amber-400">{100 - p.leadShare}% budget</div>
                    </div>
                  </div>

                  {/* Responsibilities Matrix */}
                  <h4 className="text-xs font-medium text-foreground mb-2">Responsibilities</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      {p.responsibilities.lead.map(r => (
                        <div key={r} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {r}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {p.responsibilities.partner.map(r => (
                        <div key={r} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleGenerateMOU} disabled={mouGenerating}>
                      <Sparkles className="h-3 w-3" /> {mouGenerating ? "Generating..." : "Generate MOU"}
                    </Button>
                    {mouContent && (
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        <Download className="h-3 w-3" /> Download MOU
                      </Button>
                    )}
                  </div>
                </GlassCard>

                {mouContent && (
                  <GlassCard hoverable={false}>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Generated MOU</h3>
                    <div className="text-xs text-muted-foreground border border-border/30 rounded-lg p-4 max-h-60 overflow-y-auto prose prose-invert prose-xs" dangerouslySetInnerHTML={{ __html: mouContent }} />
                    <p className="text-[10px] text-muted-foreground/60 mt-2 italic">⚠️ This is a starting point — have it reviewed by a legal advisor before signing.</p>
                  </GlassCard>
                )}
              </div>

              {/* Right - Messages */}
              <div className="col-span-2">
                <GlassCard hoverable={false} className="flex flex-col h-[500px]">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Messages
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                    {mockMessages.map(m => (
                      <div key={m.id} className="flex gap-2">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${m.initials === "EF" ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-400"}`}>
                          {m.initials}
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-medium text-foreground">{m.sender}</span> · {m.time}
                          </div>
                          <div className="text-xs text-foreground mt-0.5">{m.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-border/30">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      className="text-xs bg-secondary/30 border-border/50"
                    />
                    <Button size="sm" className="shrink-0">
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </GlassCard>
              </div>
            </div>
          </TabsContent>

          {/* Proposal Tab */}
          <TabsContent value="proposal">
            <div className="grid grid-cols-5 gap-6">
              {/* Section Navigator */}
              <div className="col-span-1">
                <GlassCard hoverable={false} className="sticky top-20">
                  <h3 className="text-xs font-semibold text-foreground mb-3">Sections</h3>
                  <div className="space-y-1">
                    {sections.map(s => {
                      const owner = ownerLabel(s.key);
                      const hasContent = !!sectionContent[s.key];
                      return (
                        <button
                          key={s.key}
                          onClick={() => setActiveSection(s.key)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                            activeSection === s.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{s.label}</span>
                            {hasContent ? (
                              <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-border/50 shrink-0" />
                            )}
                          </div>
                          <Badge variant="outline" className={`text-[8px] mt-1 ${owner.color}`}>
                            {owner.label}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
                    <Button size="sm" className="w-full text-xs gap-1" onClick={handleMerge} disabled={merging}>
                      <Merge className="h-3 w-3" /> {merging ? "Merging..." : "Merge & Harmonise"}
                    </Button>
                  </div>
                </GlassCard>
              </div>

              {/* Editor */}
              <div className="col-span-3">
                <GlassCard hoverable={false}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {sections.find(s => s.key === activeSection)?.label}
                      </h3>
                      <Badge variant="outline" className={`text-[9px] mt-1 ${ownerLabel(activeSection).color}`}>
                        Assigned to: {ownerLabel(activeSection).label}
                      </Badge>
                    </div>
                    {sectionOwnership[activeSection] === "org2" && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                        <Lock className="h-3 w-3" /> Partner section (read-only)
                      </div>
                    )}
                  </div>

                  <Textarea
                    value={sectionContent[activeSection] || ""}
                    onChange={e => setSectionContent(prev => ({ ...prev, [activeSection]: e.target.value }))}
                    placeholder={`Write the ${sections.find(s => s.key === activeSection)?.label} section here...`}
                    className="min-h-[300px] bg-secondary/20 border-border/30 text-sm"
                    readOnly={sectionOwnership[activeSection] === "org2"}
                  />

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] text-muted-foreground">
                      {(sectionContent[activeSection] || "").split(/\s+/).filter(Boolean).length} words
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" /> AI Generate
                      </Button>
                      <Button size="sm" className="text-xs">Save Section</Button>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Ownership Config */}
              <div className="col-span-1">
                <GlassCard hoverable={false} className="sticky top-20">
                  <h3 className="text-xs font-semibold text-foreground mb-3">Section Ownership</h3>
                  <div className="space-y-2">
                    {sections.map(s => (
                      <div key={s.key} className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground truncate flex-1">{s.label}</span>
                        <Select
                          value={sectionOwnership[s.key]}
                          onValueChange={v => setSectionOwnership(prev => ({ ...prev, [s.key]: v }))}
                        >
                          <SelectTrigger className="w-20 h-6 text-[9px] bg-secondary/30 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="org1" className="text-[10px]">Lead</SelectItem>
                            <SelectItem value="org2" className="text-[10px]">Partner</SelectItem>
                            <SelectItem value="shared" className="text-[10px]">Shared</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/30">
                    <h4 className="text-[10px] font-medium text-foreground mb-2">Presence</h4>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary ring-2 ring-green-400/60">EF</div>
                      <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[8px] font-bold text-amber-400 ring-2 ring-green-400/60">HY</div>
                      <span className="text-[10px] text-muted-foreground">2 online</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <GlassCard hoverable={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Shared Documents</h3>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Upload className="h-3 w-3" /> Upload Document
                </Button>
              </div>

              <div className="space-y-1">
                {["Lead Org Docs", "Partner Org Docs", "Funder Requirements", "Joint Docs"].map(category => {
                  const docs = mockDocs.filter(d => d.type === category);
                  return (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{category}</h4>
                      {docs.length > 0 ? (
                        <div className="space-y-1.5">
                          {docs.map(d => (
                            <div key={d.name} className="flex items-center justify-between p-2.5 rounded-lg border border-border/20 hover:bg-secondary/20 transition-colors">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <span className="text-xs text-foreground">{d.name}</span>
                                  <div className="text-[10px] text-muted-foreground">{d.org} · {d.date}</div>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" className="text-xs">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground pl-2">No documents uploaded yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnershipWorkspacePage;
