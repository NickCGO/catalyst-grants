import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ provider: "gmail", email_address: "" });

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

  const connect = async () => {
    if (!orgId || !form.email_address.trim()) {
      toast({ title: "Email address is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("email_credentials")
      .insert({
        org_id: orgId,
        provider: form.provider as any,
        email_address: form.email_address,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({
        title: "Could not connect",
        description: error.message.includes("row-level")
          ? "Only org admins can connect an inbox."
          : error.message,
        variant: "destructive",
      });
      return;
    }
    setCred(data as Cred);
    toast({ title: "Inbox registered", description: "OAuth flow will be triggered next." });
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
                  {cred.provider} · {cred.last_synced_at ? `synced ${format(new Date(cred.last_synced_at), "MMM d, HH:mm")}` : "not yet synced"}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={disconnect}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              OAuth authorization is not yet wired up. Once configured, replies from funders will be threaded into your CRM automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                    <SelectItem value="smtp">SMTP / IMAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Email address</Label>
                <Input
                  type="email"
                  value={form.email_address}
                  onChange={(e) => setForm({ ...form, email_address: e.target.value })}
                  placeholder="grants@yourorg.org"
                />
              </div>
            </div>
            <Button onClick={connect} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
              Connect inbox
            </Button>
            <p className="text-xs text-muted-foreground">
              Only org admins can connect an inbox. OAuth authorization will be requested in a follow-up step.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
