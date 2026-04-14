import { useState, useEffect } from "react";
import { Mail, Send, FileText, Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { icon: typeof Mail; color: string; label: string }> = {
  draft: { icon: FileText, color: "bg-muted text-muted-foreground", label: "Draft" },
  queued: { icon: Clock, color: "bg-warning/20 text-warning", label: "Queued" },
  sent: { icon: CheckCircle, color: "bg-success/20 text-success", label: "Sent" },
  failed: { icon: AlertCircle, color: "bg-destructive/20 text-destructive", label: "Failed" },
};

interface Props {
  orgId: string;
  funderId: string;
  refreshKey: number;
}

export default function CRMEmailLog({ orgId, funderId, refreshKey }: Props) {
  const [emails, setEmails] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadEmails();
    const channel = supabase
      .channel(`crm-emails-${funderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_emails", filter: `funder_id=eq.${funderId}` }, () => loadEmails())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [funderId, refreshKey]);

  const loadEmails = async () => {
    const { data } = await supabase
      .from("crm_emails")
      .select("*")
      .eq("org_id", orgId)
      .eq("funder_id", funderId)
      .order("created_at", { ascending: false });
    setEmails(data || []);
  };

  const deleteEmail = async (id: string) => {
    await supabase.from("crm_emails").delete().eq("id", id);
    toast({ title: "Email deleted" });
  };

  if (emails.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-4">No emails yet. Use the composer above to draft your first email.</p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">Email History ({emails.length})</h4>
      {emails.map((email) => {
        const config = statusConfig[email.status] || statusConfig.draft;
        const Icon = config.icon;
        const isExpanded = expanded === email.id;

        return (
          <GlassCard
            key={email.id}
            className={`p-3 cursor-pointer transition-colors hover:bg-secondary/10 ${isExpanded ? "ring-1 ring-primary/20" : ""}`}
            onClick={() => setExpanded(isExpanded ? null : email.id)}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{email.subject || "(No subject)"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {email.recipient_email || "No recipient"} · {new Date(email.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                </p>
              </div>
              <Badge className={`${config.color} text-[9px] h-4`}>{config.label}</Badge>
              <button
                onClick={(e) => { e.stopPropagation(); deleteEmail(email.id); }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border/20">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{email.body}</p>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
