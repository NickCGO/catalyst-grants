import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type Cred = {
  id: string;
  provider: string;
  email_address: string;
  token_expires_at: string | null;
  last_synced_at: string | null;
};

export default function ConnectedInboxesTab() {
  const { user } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [cred, setCred] = useState<Cred | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) return setLoading(false);
      setOrgId(org.id);
      const { data } = await supabase.from("email_credentials").select("*").eq("org_id", org.id).maybeSingle();
      setCred(data as Cred | null);
      setLoading(false);
    })();
  }, [user]);

  const connectGmail = async () => {
    if (!orgId) return;
    setConnecting(true);
    const oauthWindow = window.open("", "_blank", "width=560,height=720");

    if (oauthWindow) {
      oauthWindow.document.write(`<!doctype html><title>Connecting Gmail</title><body style="font-family:system-ui;padding:24px;color:#0f172a">Opening Google…</body>`);
      oauthWindow.document.close();
    }

    try {
      const { data, error } = await supabase.functions.invoke("gmail-oauth-start", {
        body: { returnTo: window.location.pathname + window.location.search, origin: window.location.origin },
      });
      if (error || !data?.url) throw error || new Error("Could not start OAuth");

      if (oauthWindow && !oauthWindow.closed) {
        oauthWindow.location.replace(data.url);
      } else {
        window.location.assign(data.url);
      }
    } catch (e: any) {
      if (oauthWindow && !oauthWindow.closed) oauthWindow.close();
      toast({ title: "Could not start Gmail connection", description: e.message || String(e), variant: "destructive" });
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!cred) return;
    const { error } = await supabase.from("email_credentials").delete().eq("id", cred.id);
    if (error) return toast({ title: "Disconnect failed", description: error.message, variant: "destructive" });
    setCred(null);
    toast({ title: "Inbox disconnected" });
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <GlassCard hoverable={false}>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Inbox sync</h3>
        </div>

        {cred ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-card">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  {cred.email_address}
                  {cred.token_expires_at && new Date(cred.token_expires_at) > new Date() ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {cred.provider} · {cred.last_synced_at ? `last used ${format(new Date(cred.last_synced_at), "MMM d, HH:mm")}` : "not yet used"}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={disconnect}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your Gmail account is connected. Emails sent from the Email Hub and Funder CRM will be delivered through your inbox.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Gmail account to send emails to funders directly from Find The Grant. We'll only request permission to send mail and read your own messages.
            </p>
            <Button onClick={connectGmail} disabled={connecting} size="sm">
              {connecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
              Connect Gmail
            </Button>
            <p className="text-xs text-muted-foreground">
              Only org admins can connect an inbox. Outlook support is coming soon.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
