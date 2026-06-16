import { useState } from "react";
import { Send, Save, Mail } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hints } from "@/lib/formHints";
import AfricaSpinner from "../AfricaSpinner";

const emailTemplates: Record<string, { subject: string; body: string }> = {
  introduction: {
    subject: "Introduction & Funding Inquiry",
    body: `Dear [Contact Name],\n\nI am writing on behalf of [Organisation Name] to introduce our work and explore potential funding alignment.\n\n[Brief description of your organisation and mission]\n\nWe would welcome the opportunity to discuss how our work aligns with your funding priorities.\n\nKind regards,\n[Your Name]`,
  },
  follow_up: {
    subject: "Follow-up on Funding Application",
    body: `Dear [Contact Name],\n\nI hope this message finds you well. I am following up on our application submitted on [date] for [project name].\n\nWe remain very enthusiastic about the possibility of partnering with [Funder Name] and would be happy to provide any additional information.\n\nKind regards,\n[Your Name]`,
  },
  thank_you: {
    subject: "Thank You for Your Support",
    body: `Dear [Contact Name],\n\nOn behalf of [Organisation Name], I would like to express our sincere gratitude for your generous support of [project name].\n\n[Brief update on impact]\n\nWe look forward to sharing our progress reports with you.\n\nWith appreciation,\n[Your Name]`,
  },
  report_submission: {
    subject: "Progress Report Submission",
    body: `Dear [Contact Name],\n\nPlease find attached our progress report for [project name] covering the period [dates].\n\nKey highlights:\n- [Highlight 1]\n- [Highlight 2]\n- [Highlight 3]\n\nWe welcome any questions or feedback.\n\nKind regards,\n[Your Name]`,
  },
};

interface Props {
  orgId: string;
  funderId: string;
  funderName: string;
  funderEmail?: string;
  relationshipId?: string;
  onEmailSaved: () => void;
}

export default function CRMEmailComposer({ orgId, funderId, funderName, funderEmail, relationshipId, onEmailSaved }: Props) {
  const [to, setTo] = useState(funderEmail || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState("");

  const applyTemplate = (key: string) => {
    const t = emailTemplates[key];
    if (t) {
      setSubject(t.subject.replace("[Funder Name]", funderName));
      setBody(t.body.replace(/\[Funder Name\]/g, funderName));
      setTemplate(key);
    }
  };

  const saveEmail = async (status: "draft" | "queued") => {
    if (!subject.trim() && !body.trim()) {
      toast({ title: "Please add a subject or body", variant: "destructive" });
      return;
    }
    setSaving(true);

    // If sending, attempt real delivery via the org's connected inbox (Gmail or Outlook)
    if (status === "queued") {
      if (!to.trim()) {
        toast({ title: "Recipient email required", variant: "destructive" });
        setSaving(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
          funder_id: funderId,
          relationship_id: relationshipId || null,
        },
      });
      setSaving(false);
      if (error || data?.error) {
        const msg = data?.error === "inbox_not_connected"
          ? "Connect your Gmail or Outlook account in Settings → Connected Inboxes to send."
          : (data?.error || error?.message || "Send failed");
        toast({ title: "Could not send email", description: msg, variant: "destructive" });
        return;
      }
      toast({ title: "Email sent ✓", description: `Delivered to ${to}` });
      setSubject(""); setBody(""); setTo(funderEmail || ""); setTemplate("");
      onEmailSaved();
      return;
    }

    // Draft path
    const { error } = await supabase.from("crm_emails").insert({
      org_id: orgId,
      funder_id: funderId,
      relationship_id: relationshipId || null,
      recipient_email: to || null,
      subject: subject.trim(),
      body: body.trim(),
      status: "draft",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save draft", variant: "destructive" });
      return;
    }
    toast({ title: "Draft saved" });
    setSubject(""); setBody(""); setTo(funderEmail || ""); setTemplate("");
    onEmailSaved();
  };


  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" /> Compose Email
        </h3>
        <Select value={template} onValueChange={applyTemplate}>
          <SelectTrigger className="w-[160px] h-7 text-[10px] bg-secondary/30 border-border/30">
            <SelectValue placeholder="Use template..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="introduction">Introduction</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="thank_you">Thank You</SelectItem>
            <SelectItem value="report_submission">Report Submission</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[10px]">To</Label>
        <Input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder={funderEmail || "recipient@example.com"}
          className="bg-secondary/30 border-border/30 h-8 text-xs"
        />
      </div>
      <div>
        <Label className="text-[10px]">Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
          className="bg-secondary/30 border-border/30 h-8 text-xs"
        />
        <p className="text-[10px] text-muted-foreground mt-1">{hints.crm.emailSubject}</p>
      </div>
      <div>
        <Label className="text-[10px]">Body</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email..."
          className="bg-secondary/30 border-border/30 min-h-[180px] text-xs"
        />
        <p className="text-[10px] text-muted-foreground mt-1">{hints.crm.emailBody}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => saveEmail("draft")} disabled={saving}>
          {saving ? <AfricaSpinner className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
          Save Draft
        </Button>
        <Button size="sm" className="h-7 text-xs flex-1" onClick={() => saveEmail("queued")} disabled={saving}>
          {saving ? <AfricaSpinner className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
          Send
        </Button>
      </div>
      <p className="text-[9px] text-muted-foreground">
        Sends via your connected Gmail account. Connect one in Settings → Connected Inboxes if you haven't yet.
      </p>

    </GlassCard>
  );
}
