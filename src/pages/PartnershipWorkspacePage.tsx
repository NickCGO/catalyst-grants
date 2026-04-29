import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { callAI } from "@/lib/ai";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, FileText, MessageSquare, Download, Upload, Sparkles, Clock,
  CheckCircle, Lock, Send, ArrowLeft, Merge, Shield, Eye, AlertCircle,
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

interface PartnershipData {
  id: string;
  partnership_name: string | null;
  partnership_type: string | null;
  status: string | null;
  budget_total: number | null;
  lead_share_percent: number | null;
  mou_content: string | null;
  lead_org_id: string;
  funder_id: string | null;
  application_id: string | null;
}

interface MemberData {
  id: string;
  org_id: string;
  role: string | null;
  budget_share_percent: number | null;
  responsibilities: string[] | null;
  org_name?: string;
}

interface ProposalData {
  id: string;
  sections: Record<string, string> | null;
  section_ownership: Record<string, string> | null;
  merged_content: string | null;
  ai_merge_status: string | null;
  status: string | null;
}

const PartnershipWorkspacePage = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [partnership, setPartnership] = useState<PartnershipData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [funderName, setFunderName] = useState("");
  const [leadOrgName, setLeadOrgName] = useState("");
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState("executive_summary");
  const [sectionOwnership, setSectionOwnership] = useState<Record<string, string>>({});
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [merging, setMerging] = useState(false);
  const [mouGenerating, setMouGenerating] = useState(false);
  const [mouContent, setMouContent] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Messaging
  interface Message { id: string; body: string; author_user_id: string; author_name: string | null; org_id: string; created_at: string; }
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // Documents
  interface PDoc { id: string; file_name: string; file_path: string; file_size: number | null; mime_type: string | null; uploader_name: string | null; uploaded_by: string; created_at: string; }
  const [docs, setDocs] = useState<PDoc[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (id) loadWorkspace();
  }, [id]);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      setCurrentUserName(user.email?.split("@")[0] || "Member");

      // Get user's org
      const { data: org } = await supabase.from("organisations").select("id, name").eq("user_id", user.id).maybeSingle();
      if (org) {
        setUserOrgId(org.id);
        setLeadOrgName(org.name);
        setCurrentUserName(org.name); // prefer org name as author display
      }

      // Load partnership
      const { data: p, error: pErr } = await supabase
        .from("partnerships")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (pErr || !p) {
        toast.error("Partnership not found");
        setLoading(false);
        return;
      }
      setPartnership(p as PartnershipData);
      setMouContent(p.mou_content || "");

      // Load messages
      const { data: msgs } = await supabase
        .from("partnership_messages")
        .select("*")
        .eq("partnership_id", id!)
        .order("created_at", { ascending: true });
      if (msgs) setMessages(msgs as Message[]);

      // Load documents
      const { data: docsData } = await supabase
        .from("partnership_documents")
        .select("*")
        .eq("partnership_id", id!)
        .order("created_at", { ascending: false });
      if (docsData) setDocs(docsData as PDoc[]);

      if (pErr || !p) {
        toast.error("Partnership not found");
        setLoading(false);
        return;
      }
      setPartnership(p as PartnershipData);
      setMouContent(p.mou_content || "");

      // Load funder name
      if (p.funder_id) {
        const { data: funder } = await supabase.from("funders").select("donor_name").eq("id", p.funder_id).maybeSingle();
        if (funder) setFunderName(funder.donor_name);
      }

      // Load lead org name if different from user's org
      if (p.lead_org_id && p.lead_org_id !== org?.id) {
        const { data: leadOrg } = await supabase.from("organisations").select("name").eq("id", p.lead_org_id).maybeSingle();
        if (leadOrg) setLeadOrgName(leadOrg.name);
      }

      // Load members with org names
      const { data: membersData } = await supabase
        .from("partnership_members")
        .select("*")
        .eq("partnership_id", id!);

      if (membersData) {
        const enriched: MemberData[] = [];
        for (const m of membersData) {
          const { data: mOrg } = await supabase.from("organisations").select("name").eq("id", m.org_id).maybeSingle();
          enriched.push({ ...m, org_name: mOrg?.name || "Unknown Org" });
        }
        setMembers(enriched);
      }

      // Load proposal
      const { data: proposalData } = await supabase
        .from("partnership_proposals")
        .select("*")
        .eq("partnership_id", id!)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (proposalData) {
        setProposal(proposalData as ProposalData);
        const sec = (proposalData.sections as Record<string, string>) || {};
        setSectionContent(sec);
        const own = (proposalData.section_ownership as Record<string, string>) || {};
        setSectionOwnership(own);
      } else {
        // Initialize default ownership with lead org
        const defaultOwnership: Record<string, string> = {};
        sections.forEach(s => { defaultOwnership[s.key] = p.lead_org_id; });
        setSectionOwnership(defaultOwnership);
      }
    } catch (err) {
      console.error("Failed to load workspace:", err);
      toast.error("Failed to load partnership workspace");
    }
    setLoading(false);
  };

  const getOrgInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

  const getOrgName = (orgId: string) => {
    const m = members.find(m => m.org_id === orgId);
    return m?.org_name || "Unknown";
  };

  const isLeadOrg = userOrgId === partnership?.lead_org_id;

  const ownerLabel = (key: string) => {
    const ownerId = sectionOwnership[key];
    if (!ownerId || ownerId === partnership?.lead_org_id) {
      return { label: getOrgName(partnership?.lead_org_id || ""), color: "bg-primary/15 text-primary border-primary/30", isLead: true };
    }
    if (ownerId === "shared") {
      return { label: "Shared", color: "bg-teal-500/15 text-teal-400 border-teal-500/30", isLead: false };
    }
    return { label: getOrgName(ownerId), color: "bg-amber-500/15 text-amber-400 border-amber-500/30", isLead: false };
  };

  const canEditSection = (key: string) => {
    const ownerId = sectionOwnership[key];
    if (ownerId === "shared") return true;
    return ownerId === userOrgId;
  };

  const completedSections = Object.values(sectionContent).filter(v => v && v.trim().length > 0).length;
  const progressPct = Math.round((completedSections / sections.length) * 100);

  const handleSaveSection = async () => {
    if (!proposal) return;
    setSaving(true);
    try {
      const updatedSections = { ...sectionContent };
      const { error } = await supabase
        .from("partnership_proposals")
        .update({
          sections: updatedSections as any,
          section_ownership: sectionOwnership as any,
        })
        .eq("id", proposal.id);
      if (error) throw error;
      toast.success("Section saved");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleSaveOwnership = async () => {
    if (!proposal) return;
    try {
      await supabase
        .from("partnership_proposals")
        .update({ section_ownership: sectionOwnership as any })
        .eq("id", proposal.id);
      toast.success("Ownership updated");
    } catch {
      toast.error("Failed to update ownership");
    }
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      const result = await callAI([
        { role: "system", content: "Merge these sections from two NGOs into a coherent proposal. Ensure consistent voice and remove duplication. Return the merged text." },
        { role: "user", content: Object.entries(sectionContent).map(([k, v]) => `## ${k}\n${v}`).join("\n\n") },
      ]);
      if (proposal) {
        await supabase
          .from("partnership_proposals")
          .update({ merged_content: result, ai_merge_status: "merged" })
          .eq("id", proposal.id);
      }
      toast.success("Sections merged & harmonised successfully!");
    } catch {
      toast.error("Merge failed. Try again.");
    }
    setMerging(false);
  };

  const handleGenerateMOU = async () => {
    if (!partnership) return;
    setMouGenerating(true);
    try {
      const leadMember = members.find(m => m.org_id === partnership.lead_org_id);
      const partnerMembers = members.filter(m => m.org_id !== partnership.lead_org_id);

      const result = await callAI([
        { role: "system", content: `Generate a partnership MOU between ${getOrgName(partnership.lead_org_id)} (lead, ${partnership.lead_share_percent || 60}% budget) and partners for a grant application to ${funderName}. Include: Purpose, Roles, Financial Management, Reporting, Dispute Resolution, Termination. Format as professional HTML.` },
        { role: "user", content: JSON.stringify({
          partnership: partnership.partnership_name,
          budget: partnership.budget_total,
          lead: { name: getOrgName(partnership.lead_org_id), responsibilities: leadMember?.responsibilities },
          partners: partnerMembers.map(pm => ({ name: pm.org_name, responsibilities: pm.responsibilities, share: pm.budget_share_percent })),
        }) },
      ]);
      setMouContent(result || "MOU content generated.");
      await supabase
        .from("partnerships")
        .update({ mou_content: result })
        .eq("id", partnership.id);
      toast.success("MOU generated!");
    } catch {
      toast.error("MOU generation failed.");
    }
    setMouGenerating(false);
  };

  const handleAIGenerate = async () => {
    if (!partnership) return;
    const sectionLabel = sections.find(s => s.key === activeSection)?.label || activeSection;
    try {
      const result = await callAI([
        { role: "system", content: `You are an expert grant proposal writer for African NGOs. Write the "${sectionLabel}" section for a joint application to ${funderName}. Write ~250 words, professional and specific.` },
        { role: "user", content: `Partnership: ${partnership.partnership_name}\nFunder: ${funderName}\nPartners: ${members.map(m => m.org_name).join(", ")}` },
      ]);
      if (result) {
        setSectionContent(prev => ({ ...prev, [activeSection]: result }));
        toast.success(`${sectionLabel} generated`);
      }
    } catch {
      toast.error("AI generation failed");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!partnership) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Partnership not found</h2>
          <p className="text-sm text-muted-foreground mt-1">This partnership may have been removed or you don't have access.</p>
          <Link to="/partnerships">
            <Button variant="outline" className="mt-4">Back to Partnerships</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const leadMember = members.find(m => m.org_id === partnership.lead_org_id);
  const partnerMembers = members.filter(m => m.org_id !== partnership.lead_org_id);

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
              <h1 className="text-xl font-semibold text-foreground">{partnership.partnership_name || "Unnamed Partnership"}</h1>
              <Badge variant="secondary" className="text-[10px]">{partnership.partnership_type || "consortium"}</Badge>
              <Badge variant="outline" className="text-[10px]">{partnership.status || "forming"}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              {members.map((m, i) => (
                <span key={m.id} className="flex items-center gap-1">
                  {i > 0 && <span className="mr-2">+</span>}
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                    m.org_id === partnership.lead_org_id ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {getOrgInitials(m.org_name || "")}
                  </div>
                  {m.org_name} {m.role === "lead" && "(Lead)"}
                </span>
              ))}
              {funderName && (
                <>
                  <span>·</span>
                  <span>Targeting: {funderName}</span>
                </>
              )}
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
              <div className="col-span-3 space-y-4">
                <GlassCard hoverable={false}>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Partnership Agreement</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {leadMember && (
                      <div className="p-3 rounded-lg border border-border/30">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">Lead Organisation</div>
                        <div className="text-sm font-medium text-foreground">{leadMember.org_name}</div>
                        <div className="text-xs text-primary">{partnership.lead_share_percent || leadMember.budget_share_percent || 60}% budget</div>
                      </div>
                    )}
                    {partnerMembers.map(pm => (
                      <div key={pm.id} className="p-3 rounded-lg border border-border/30">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">Partner Organisation</div>
                        <div className="text-sm font-medium text-foreground">{pm.org_name}</div>
                        <div className="text-xs text-amber-400">{pm.budget_share_percent || (100 - (partnership.lead_share_percent || 60))}% budget</div>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-xs font-medium text-foreground mb-2">Responsibilities</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {leadMember?.responsibilities && leadMember.responsibilities.length > 0 && (
                      <div className="space-y-1.5">
                        {leadMember.responsibilities.map(r => (
                          <div key={r} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {r}
                          </div>
                        ))}
                      </div>
                    )}
                    {partnerMembers.map(pm => (
                      <div key={pm.id} className="space-y-1.5">
                        {(pm.responsibilities || []).map(r => (
                          <div key={r} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {r}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {members.length > 0 && (leadMember?.responsibilities?.length === 0 || !leadMember?.responsibilities) && partnerMembers.every(pm => !pm.responsibilities?.length) && (
                    <p className="text-[10px] text-muted-foreground italic mt-2">No responsibilities assigned yet.</p>
                  )}

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

              {/* Right - Messages placeholder */}
              <div className="col-span-2">
                <GlassCard hoverable={false} className="flex flex-col h-[500px]">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Messages
                  </h3>
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Partnership messaging coming soon.</p>
                      <p className="text-[10px] mt-1">Use the proposal tab to collaborate on your joint application.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-border/30">
                    <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="text-xs bg-secondary/30 border-border/50" disabled />
                    <Button size="sm" className="shrink-0" disabled><Send className="h-3 w-3" /></Button>
                  </div>
                </GlassCard>
              </div>
            </div>
          </TabsContent>

          {/* Proposal Tab */}
          <TabsContent value="proposal">
            {!proposal ? (
              <GlassCard hoverable={false}>
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-foreground">No proposal started yet</h3>
                  <p className="text-xs text-muted-foreground mt-1">Create a partnership proposal to begin collaborating.</p>
                  <Button size="sm" className="mt-4 text-xs" onClick={async () => {
                    const { data, error } = await supabase.from("partnership_proposals").insert({
                      partnership_id: partnership.id,
                      funder_id: partnership.funder_id,
                      sections: {} as any,
                      section_ownership: sectionOwnership as any,
                    }).select().single();
                    if (data) {
                      setProposal(data as ProposalData);
                      toast.success("Proposal created");
                    } else {
                      toast.error("Failed to create proposal");
                    }
                  }}>
                    <FileText className="h-3 w-3 mr-1" /> Start Proposal
                  </Button>
                </div>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-5 gap-6">
                {/* Section Navigator */}
                <div className="col-span-1">
                  <GlassCard hoverable={false} className="sticky top-20">
                    <h3 className="text-xs font-semibold text-foreground mb-3">Sections</h3>
                    <div className="space-y-1">
                      {sections.map(s => {
                        const owner = ownerLabel(s.key);
                        const hasContent = !!(sectionContent[s.key]?.trim());
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
                      {!canEditSection(activeSection) && (
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
                      readOnly={!canEditSection(activeSection)}
                    />

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[10px] text-muted-foreground">
                        {(sectionContent[activeSection] || "").split(/\s+/).filter(Boolean).length} words
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleAIGenerate} disabled={!canEditSection(activeSection)}>
                          <Sparkles className="h-3 w-3" /> AI Generate
                        </Button>
                        <Button size="sm" className="text-xs" onClick={handleSaveSection} disabled={saving || !canEditSection(activeSection)}>
                          {saving ? "Saving..." : "Save Section"}
                        </Button>
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
                            value={sectionOwnership[s.key] || partnership.lead_org_id}
                            onValueChange={v => {
                              setSectionOwnership(prev => ({ ...prev, [s.key]: v }));
                              handleSaveOwnership();
                            }}
                            disabled={!isLeadOrg}
                          >
                            <SelectTrigger className="w-20 h-6 text-[9px] bg-secondary/30 border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map(m => (
                                <SelectItem key={m.org_id} value={m.org_id} className="text-[10px]">
                                  {m.org_id === partnership.lead_org_id ? "Lead" : getOrgInitials(m.org_name || "")}
                                </SelectItem>
                              ))}
                              <SelectItem value="shared" className="text-[10px]">Shared</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/30">
                      <h4 className="text-[10px] font-medium text-foreground mb-2">Members</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {members.map(m => (
                          <div key={m.id} className="flex items-center gap-1">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold ${
                              m.org_id === partnership.lead_org_id ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {getOrgInitials(m.org_name || "")}
                            </div>
                          </div>
                        ))}
                        <span className="text-[10px] text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <GlassCard hoverable={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Shared Documents</h3>
                <Button size="sm" variant="outline" className="text-xs gap-1" disabled>
                  <Upload className="h-3 w-3" /> Upload Document
                </Button>
              </div>
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="text-sm font-medium text-foreground">Document sharing coming soon</h3>
                <p className="text-xs text-muted-foreground mt-1">File storage will be available in a future update.</p>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnershipWorkspacePage;
