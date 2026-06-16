import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Mail, Paperclip, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AfricaSpinner from "./AfricaSpinner";
import { proposalPdfToBase64 } from "@/lib/proposalPdf";

interface SendProposalModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  funderId: string;
  funderName: string;
  funderEmail?: string;
  funderContact?: string;
  formatLabel: string;
  sections: { key: string; label: string }[];
  sectionContent: Record<string, string>;
}

export default function SendProposalModal({
  open, onClose, orgId, orgName, funderId, funderName, funderEmail, funderContact, formatLabel, sections, sectionContent,
}: SendProposalModalProps) {
  const [checkingInbox, setCheckingInbox] = useState(true);
  const [hasInbox, setHasInbox] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(funderEmail || "");
    setSubject(`${formatLabel}: ${orgName}`);
    setBody(
      `Dear ${funderContact || "Sir/Madam"},\n\nPlease find attached our ${formatLabel.toLowerCase()} on behalf of ${orgName}.\n\nWe would welcome the opportunity to discuss this further.\n\nKind regards,\n${orgName}`
    );
    setCheckingInbox(true);
    supabase.from("email_credentials").select("id").eq("org_id", orgId).maybeSingle().then(({ data }) => {
      setHasInbox(!!data);
      setCheckingInbox(false);
    });
  }, [open, funderEmail, funderContact, formatLabel, orgName, orgId]);

  const handleSend = async () => {
    if (!to.trim()) {
      toast({ title: "Recipient email required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { base64, filename } = proposalPdfToBase64({ orgName, funderName, formatLabel, sections, sectionContent });
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
          funder_id: funderId,
          attachment: { filename, contentBase64: base64, mimeType: "application/pdf" },
        },
      });
      if (error || data?.error) {
        const msg = data?.error === "inbox_not_connected"
          ? "Connect your Gmail or Outlook account in Settings → Connected Inboxes to send."
          : (data?.error || error?.message || "Send failed");
        toast({ title: "Could not send proposal", description: msg, variant: "destructive" });
        setSending(false);
        return;
      }
      toast({ title: "Proposal sent ✓", description: `Delivered to ${to}` });
      setSending(false);
      onClose();
    } catch (e: any) {
      toast({ title: "Could not send proposal", description: e?.message || "Try again", variant: "destructive" });
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Send proposal to funder</DialogTitle>
        </DialogHeader>

        {checkingInbox ? (
          <div className="flex justify-center py-10"><AfricaSpinner className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !hasInbox ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              You need to connect Gmail or Outlook before you can send proposals directly from the app.
            </p>
            <Link to="/settings?tab=inbox">
              <Button size="sm">Go to Connected Inboxes</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="funder@example.org" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-[160px]" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-md px-3 py-2">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              Proposal PDF will be attached automatically when you send.
            </div>
          </div>
        )}

        {!checkingInbox && hasInbox && (
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={sending}>Cancel</Button>
            <Button size="sm" onClick={handleSend} disabled={sending || !to.trim()}>
              {sending ? <AfricaSpinner className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              Send proposal
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
