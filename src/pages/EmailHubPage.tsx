import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Plus, Copy, Send, Loader2, Sparkles, FileText, X, BookmarkPlus,
  Pencil, Trash2, CheckCircle, ArrowRight, Settings as SettingsIcon, ChevronDown,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { callAI } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation, useAuth } from "@/hooks/useAuth";

const purposes = [
  "Introduction / Letter of Intent",
  "Follow-up on submitted proposal",
  "Request for feedback on declined application",
  "Acknowledge successful grant",
  "Request for reporting extension",
  "Thank you note",
];

// Built-in seed templates (used when an org has no saved templates yet)
const builtinTemplates = [
  {
    name: "Cold Introduction to Corporate Funder",
    purpose: "Introduction / Letter of Intent",
    subject: "Introducing [Org Name] — alignment with your CSI priorities",
    body: "First contact with a corporate funder. Introduce your organisation, highlight alignment with their CSI priorities, and request a meeting.",
  },
  {
    name: "Letter of Enquiry (LOE)",
    purpose: "Introduction / Letter of Intent",
    subject: "Letter of Enquiry — [Project Name]",
    body: "A formal Letter of Enquiry to a foundation or trust. Briefly outline your organisation, the problem you address, your proposed solution, and the funding amount sought.",
  },
  {
    name: "Follow-up After 3 Weeks",
    purpose: "Follow-up on submitted proposal",
    subject: "Following up on our proposal submitted [date]",
    body: "Polite follow-up 3 weeks after submitting a proposal. Reference the submission date, express continued interest, and offer to provide additional information.",
  },
  {
    name: "Decline Response (Gracious)",
    purpose: "Request for feedback on declined application",
    subject: "Thank you for considering our application",
    body: "Respond graciously to a declined application. Thank them for considering your proposal, ask for feedback to improve future applications, and express interest in future opportunities.",
  },
  {
    name: "Grant Acceptance Thank-You",
    purpose: "Acknowledge successful grant",
    subject: "Thank you — confirming receipt of award",
    body: "Formal acknowledgment of a successful grant award. Express gratitude, confirm understanding of reporting requirements, and mention next steps.",
  },
  {
    name: "Report Submission Cover Note",
    purpose: "Request for reporting extension",
    subject: "Cover note — [Project] impact report",
    body: "A cover note to accompany an impact or narrative report submission. Summarize key achievements, highlight beneficiary impact, and reference attached documents.",
  },
];

interface EmailTemplate {
  id?: string;
  name: string;
  purpose: string | null;
  subject: string;
  body: string;
  isBuiltin?: boolean;
}

const EmailHubPage = () => {
  const { org } = useOrganisation();
  const { user } = useAuth();
  const [showDrafter, setShowDrafter] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [funder, setFunder] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [funders, setFunders] = useState<any[]>([]);
  const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>([]);
  const [hasInbox, setHasInbox] = useState<boolean | null>(null);
  const [walkthroughCollapsed, setWalkthroughCollapsed] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplPurpose, setTplPurpose] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");

  useEffect(() => {
    if (!org) return;
    const load = async () => {
      const [{ data: apps }, { data: tpls }, { data: creds }] = await Promise.all([
        supabase.from("applications").select("funder_id, funders(donor_name, contact_person, email)").eq("org_id", org.id),
        supabase.from("email_templates").select("*").eq("org_id", org.id).order("sort_order").order("created_at"),
        supabase.from("email_credentials").select("id").eq("org_id", org.id).limit(1),
      ]);
      const seen = new Set<string>();
      const unique = (apps || []).filter(a => {
        if (!a.funder_id || seen.has(a.funder_id)) return false;
        seen.add(a.funder_id);
        return true;
      });
      setFunders(unique);
      setCustomTemplates(tpls || []);
      setHasInbox((creds || []).length > 0);
    };
    load();
  }, [org]);

  const allTemplates: EmailTemplate[] = [
    ...customTemplates,
    ...builtinTemplates.map(t => ({ ...t, isBuiltin: true })),
  ];

  const generateEmail = async (templateContext?: string) => {
    setGenerating(true);
    try {
      const orgName = org?.name || "Our Organisation";
      const orgContext = `Organisation: ${orgName}, Country: ${org?.country || "Africa"}. Focus areas: ${(org?.focus_areas || []).join(", ") || "Not specified"}. Mission: ${org?.mission_statement || "Not specified"}.`;
      const extra = templateContext ? `\nTemplate context: ${templateContext}` : "";
      const result = await callAI([
        { role: "system", content: "You are a professional communications writer for African NGOs. Write clear, warm, respectful, professional emails. Return valid JSON with 'subject' and 'body' keys only. No markdown wrapping." },
        { role: "user", content: `Write a professional email from ${orgName} to ${funder || "the funder"}.\nPurpose: ${purpose}.\nAdditional notes: ${notes || "None"}.\n${orgContext}${extra}\nLength: 150-250 words.\nReturn JSON: {"subject":"...","body":"..."}` },
      ]);
      try {
        const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
        const cleaned = (jsonMatch[1] || result).trim();
        const parsed = JSON.parse(cleaned);
        setSubject(parsed.subject || "");
        setBody(parsed.body || "");
      } catch {
        setBody(result);
        setSubject(`Email to ${funder}`);
      }
      setGenerated(true);
    } catch {
      toast({ title: "Failed to generate email", variant: "destructive" });
    }
    setGenerating(false);
  };

  const useTemplate = (template: EmailTemplate) => {
    setPurpose(template.purpose || "");
    setNotes(template.body);
    setShowDrafter(true);
    setGenerated(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast({ title: "Copied to clipboard" });
  };

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTplName(""); setTplPurpose(""); setTplSubject(""); setTplBody("");
    setShowTemplateForm(true);
  };

  const openEditTemplate = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setTplName(t.name); setTplPurpose(t.purpose || ""); setTplSubject(t.subject); setTplBody(t.body);
    setShowTemplateForm(true);
  };

  const saveCurrentAsTemplate = () => {
    setEditingTemplate(null);
    setTplName(""); setTplPurpose(purpose); setTplSubject(subject); setTplBody(body);
    setShowTemplateForm(true);
  };

  const saveTemplate = async () => {
    if (!org || !tplName.trim() || !tplBody.trim()) {
      toast({ title: "Name and body are required", variant: "destructive" });
      return;
    }
    if (editingTemplate?.id) {
      const { error } = await supabase.from("email_templates").update({
        name: tplName.trim(), purpose: tplPurpose || null, subject: tplSubject, body: tplBody,
      }).eq("id", editingTemplate.id);
      if (error) { toast({ title: "Failed to update template", description: error.message, variant: "destructive" }); return; }
      setCustomTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, name: tplName, purpose: tplPurpose, subject: tplSubject, body: tplBody } : t));
      toast({ title: "Template updated" });
    } else {
      const { data, error } = await supabase.from("email_templates").insert({
        org_id: org.id, name: tplName.trim(), purpose: tplPurpose || null,
        subject: tplSubject, body: tplBody, created_by: user?.id || null,
      }).select().single();
      if (error) { toast({ title: "Failed to save template", description: error.message, variant: "destructive" }); return; }
      setCustomTemplates(prev => [...prev, data as any]);
      toast({ title: "Template saved" });
    }
    setShowTemplateForm(false);
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) { toast({ title: "Failed to delete", variant: "destructive" }); return; }
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    toast({ title: "Template deleted" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" /> Email Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI-drafted funder communications</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
            setShowDrafter(true); setGenerated(false); setPurpose(""); setNotes(""); setFunder("");
          }}>
            <Plus className="h-4 w-4 mr-1" /> Draft Email
          </Button>
        </div>

        {/* Walkthrough: connect an inbox */}
        {hasInbox === false && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">Connect your inbox to start sending</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You can draft and copy emails right now. Connect Gmail or Outlook to send them directly from Find The Grant — replies will also auto-link to the right funder.
                    </p>
                  </div>
                </div>
                <button onClick={() => setWalkthroughCollapsed(!walkthroughCollapsed)} className="text-muted-foreground hover:text-foreground p-1">
                  <ChevronDown className={`h-4 w-4 transition-transform ${walkthroughCollapsed ? "" : "rotate-180"}`} />
                </button>
              </div>
              {!walkthroughCollapsed && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { n: 1, title: "Open Settings", desc: "Go to Settings → Connected Inboxes." },
                    { n: 2, title: "Authorize Gmail or Outlook", desc: "Click Connect and sign in to authorize sending." },
                    { n: 3, title: "Start sending", desc: "Drafts you save here can be sent in one click." },
                  ].map(s => (
                    <div key={s.n} className="rounded-lg border border-border/30 bg-card p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">{s.n}</div>
                        <p className="text-xs font-medium text-foreground">{s.title}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Link to="/settings?tab=inboxes">
                  <Button size="sm" className="bg-primary text-primary-foreground h-7 text-xs">
                    <SettingsIcon className="h-3 w-3 mr-1" /> Open Settings
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
                <button onClick={() => setHasInbox(null)} className="text-[11px] text-muted-foreground hover:text-foreground">Hide for now</button>
              </div>
            </div>
          </motion.div>
        )}

        {hasInbox === true && (
          <div className="mb-4 flex items-center gap-2 text-xs text-success">
            <CheckCircle className="h-3.5 w-3.5" /> Inbox connected — you can send directly from drafts.
          </div>
        )}

        {/* Drafter */}
        <AnimatePresence>
          {showDrafter && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6">
              <GlassCard hoverable={false}>
                {!generated ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Draft an Email</h3>
                    <div>
                      <Label className="text-xs text-muted-foreground">Purpose</Label>
                      <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                        <option value="">Select purpose...</option>
                        {purposes.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Funder</Label>
                      <select value={funder} onChange={e => setFunder(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                        <option value="">Select funder...</option>
                        {funders.map(f => (
                          <option key={f.funder_id} value={f.funders?.donor_name || ""}>{f.funders?.donor_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Additional Notes / Context (optional)</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. mention our Q4 programme report, specific grant reference..." className="bg-secondary/30 border-border/50" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => generateEmail()} disabled={generating || !purpose} className="bg-primary text-primary-foreground">
                        {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                        Generate
                      </Button>
                      <Button variant="ghost" onClick={() => setShowDrafter(false)} className="text-muted-foreground">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <Input value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="recipient@example.com" className="mt-1 bg-secondary/30 border-border/50 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <Input value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 bg-secondary/30 border-border/50 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Body</Label>
                      <Textarea value={body} onChange={e => setBody(e.target.value)} className="min-h-[220px] bg-secondary/30 border-border/50" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hasInbox ? (
                        <Button size="sm" className="bg-primary text-primary-foreground" disabled={sending || !toAddress || !subject} onClick={async () => {
                          setSending(true);
                          const { data, error } = await supabase.functions.invoke("gmail-send", {
                            body: { to: toAddress, subject, body },
                          });
                          setSending(false);
                          if (error || data?.error) {
                            toast({ title: "Could not send", description: data?.error || error?.message || "Unknown error", variant: "destructive" });
                          } else {
                            toast({ title: "Email sent ✓", description: `Delivered to ${toAddress}` });
                            setShowDrafter(false); setGenerated(false); setToAddress(""); setSubject(""); setBody("");
                          }
                        }}>
                          {sending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                          Send via Gmail
                        </Button>
                      ) : (
                        <a href={`mailto:${toAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                          <Button variant="outline" size="sm" className="border-border/50">
                            <Send className="h-3 w-3 mr-1" /> Open in Email
                          </Button>
                        </a>
                      )}
                      <Button variant="outline" size="sm" onClick={copyToClipboard} className="border-border/50">
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={saveCurrentAsTemplate} className="border-border/50">
                        <BookmarkPlus className="h-3 w-3 mr-1" /> Save as Template
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setGenerated(false)} className="text-muted-foreground">← Edit Inputs</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowDrafter(false)} className="ml-auto text-muted-foreground">Close</Button>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Templates */}
        <Tabs defaultValue="templates">
          <div className="flex items-center justify-between mb-3">
            <TabsList className="bg-secondary/30 border border-border/30">
              <TabsTrigger value="templates">Templates ({allTemplates.length})</TabsTrigger>
            </TabsList>
            <Button size="sm" variant="outline" onClick={openNewTemplate} className="text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> New Template
            </Button>
          </div>
          <TabsContent value="templates" className="space-y-3">
            {allTemplates.map((t, i) => (
              <motion.div key={t.id || `builtin-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard className="flex items-center gap-4">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                      {!t.isBuiltin && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">Custom</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{t.subject || t.body}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!t.isBuiltin && t.id && (
                      <>
                        <button onClick={() => openEditTemplate(t)} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteTemplate(t.id!)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs text-primary h-7" onClick={() => useTemplate(t)}>Use →</Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Template editor modal-ish panel */}
        <AnimatePresence>
          {showTemplateForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateForm(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-foreground">{editingTemplate ? "Edit Template" : "New Template"}</h3>
                  <button onClick={() => setShowTemplateForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Name *</Label>
                    <Input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. Q4 follow-up" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Purpose</Label>
                    <select value={tplPurpose} onChange={e => setTplPurpose(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm">
                      <option value="">No specific purpose</option>
                      {purposes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Subject</Label>
                    <Input value={tplSubject} onChange={e => setTplSubject(e.target.value)} placeholder="Email subject" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Body *</Label>
                    <Textarea value={tplBody} onChange={e => setTplBody(e.target.value)} placeholder="Template content..." className="mt-1 min-h-[180px]" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={saveTemplate} className="bg-primary text-primary-foreground flex-1">
                      {editingTemplate ? "Save Changes" : "Create Template"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowTemplateForm(false)}>Cancel</Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default EmailHubPage;
