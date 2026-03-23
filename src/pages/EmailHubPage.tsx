import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Plus, Copy, ExternalLink, FileText, Send, Loader2, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { callAI } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation } from "@/hooks/useAuth";

const purposes = [
  "Introduction / Letter of Intent",
  "Follow-up on submitted proposal",
  "Request for feedback on declined application",
  "Acknowledge successful grant",
  "Request for reporting extension",
  "Thank you note",
];

const templates = [
  { name: "Cold Introduction to SA Corporate", preview: "Dear [Contact], I am writing to introduce our organisation..." },
  { name: "Letter of Enquiry (LOE)", preview: "We write to enquire about potential funding alignment..." },
  { name: "Follow-up After 3 Weeks", preview: "I hope this message finds you well. We submitted our proposal..." },
  { name: "Decline Response (Gracious)", preview: "Thank you for considering our application. While we are disappointed..." },
  { name: "Grant Acceptance Thank-You", preview: "We are deeply grateful to confirm receipt of the grant award..." },
  { name: "Report Submission Cover Note", preview: "Please find attached our impact report for the period..." },
];

const EmailHubPage = () => {
  const { org } = useOrganisation();
  const [showDrafter, setShowDrafter] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [funder, setFunder] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generated, setGenerated] = useState(false);
  const [funders, setFunders] = useState<any[]>([]);

  // Load real funders from applications/relationships
  useEffect(() => {
    if (!org) return;
    const load = async () => {
      const { data: apps } = await supabase
        .from("applications")
        .select("funder_id, funders(donor_name, contact_person, email)")
        .eq("org_id", org.id);
      const seen = new Set<string>();
      const unique = (apps || []).filter(a => {
        if (!a.funder_id || seen.has(a.funder_id)) return false;
        seen.add(a.funder_id);
        return true;
      });
      setFunders(unique);
    };
    load();
  }, [org]);

  const generateEmail = async () => {
    setGenerating(true);
    try {
      const orgName = org?.name || "Our Organisation";
      const result = await callAI([
        { role: "system", content: "You are a professional communications writer for African NGOs. Write clear, warm, respectful emails. Return JSON with 'subject' and 'body' keys." },
        { role: "user", content: `Write a professional email from ${orgName} to ${funder || "the funder"}. Purpose: ${purpose}. Notes: ${notes || "None"}. Organisation: ${orgName}, ${org?.country || "South Africa"}. Focus: ${(org?.focus_areas || []).join(", ")}. Length: 150-250 words. Return JSON: {"subject":"...","body":"..."}` },
      ]);
      try {
        const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
        const parsed = JSON.parse(jsonMatch[1]?.trim() || result.trim());
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast({ title: "Copied to clipboard!" });
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
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setShowDrafter(true); setGenerated(false); setPurpose(""); setNotes(""); setFunder(""); }}>
            <Plus className="h-4 w-4 mr-1" /> Draft Email
          </Button>
        </div>

        {showDrafter && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
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
                    <Label className="text-xs text-muted-foreground">Additional Notes (optional)</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. mention our Q4 programme report" className="bg-secondary/30 border-border/50" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={generateEmail} disabled={generating || !purpose} className="bg-primary text-primary-foreground">
                      {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                      Generate
                    </Button>
                    <Button variant="ghost" onClick={() => setShowDrafter(false)} className="text-muted-foreground">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Subject</Label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Body</Label>
                    <Textarea value={body} onChange={e => setBody(e.target.value)} className="min-h-[200px] bg-secondary/30 border-border/50" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="border-border/50">
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                    <a href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                      <Button variant="outline" size="sm" className="border-border/50">
                        <Send className="h-3 w-3 mr-1" /> Open in Email
                      </Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => setShowDrafter(false)} className="ml-auto text-muted-foreground">Close</Button>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        <Tabs defaultValue="templates">
          <TabsList className="bg-secondary/30 border border-border/30">
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="space-y-3 mt-4">
            {templates.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="flex items-center gap-4">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.preview}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-primary"
                    onClick={() => { setShowDrafter(true); setGenerated(false); }}>
                    Use →
                  </Button>
                </GlassCard>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmailHubPage;
