import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Zap } from "lucide-react";

const TRIGGERS = [
  { value: "application_submitted", label: "Application submitted" },
  { value: "application_won", label: "Application won" },
  { value: "application_lost", label: "Application lost" },
  { value: "deadline_approaching_7d", label: "Deadline in 7 days" },
  { value: "deadline_approaching_1d", label: "Deadline in 1 day" },
  { value: "no_reply_after_14d", label: "No reply after 14 days" },
  { value: "no_activity_after_30d", label: "No activity for 30 days" },
];

const ACTIONS = [
  { value: "create_task", label: "Create a task" },
  { value: "send_notification", label: "Send a notification" },
  { value: "send_email_draft", label: "Draft a follow-up email" },
  { value: "move_kanban_column", label: "Move kanban column" },
];

type Rule = {
  id: string;
  name: string;
  trigger_event: string;
  action_type: string;
  action_payload: any;
  is_active: boolean;
};

export default function AutomationsTab() {
  const { user } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger_event: TRIGGERS[0].value,
    action_type: ACTIONS[0].value,
    payload_text: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) return setLoading(false);
      setOrgId(org.id);
      const { data } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });
      setRules((data || []) as Rule[]);
      setLoading(false);
    })();
  }, [user]);

  const create = async () => {
    if (!orgId || !form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const payload = form.payload_text.trim()
      ? { template: form.payload_text }
      : {};
    const { data, error } = await supabase
      .from("automation_rules")
      .insert({
        org_id: orgId,
        name: form.name,
        trigger_event: form.trigger_event as any,
        action_type: form.action_type as any,
        action_payload: payload,
      })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast({ title: "Could not create rule", description: error.message, variant: "destructive" });
      return;
    }
    setRules([data as Rule, ...rules]);
    setForm({ name: "", trigger_event: TRIGGERS[0].value, action_type: ACTIONS[0].value, payload_text: "" });
    toast({ title: "Rule created" });
  };

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("automation_rules").update({ is_active }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setRules(rules.map((r) => (r.id === id ? { ...r, is_active } : r)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("automation_rules").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    setRules(rules.filter((r) => r.id !== id));
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <GlassCard hoverable={false}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">New automation rule</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Follow up after submission" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">When (trigger)</Label>
              <Select value={form.trigger_event} onValueChange={(v) => setForm({ ...form, trigger_event: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Then (action)</Label>
              <Select value={form.action_type} onValueChange={(v) => setForm({ ...form, action_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Template / notes (optional)</Label>
            <Input value={form.payload_text} onChange={(e) => setForm({ ...form, payload_text: e.target.value })} placeholder="Task title or email subject" />
          </div>
          <Button onClick={create} disabled={creating} size="sm">
            {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Create rule
          </Button>
        </div>
      </GlassCard>

      <GlassCard hoverable={false}>
        <h3 className="text-sm font-semibold mb-3">Active rules ({rules.length})</h3>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rules yet. Create one above to automate follow-ups.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-card">
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {TRIGGERS.find((t) => t.value === r.trigger_event)?.label} → {ACTIONS.find((a) => a.value === r.action_type)?.label}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={r.is_active} onCheckedChange={(v) => toggle(r.id, v)} />
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Rules are stored and will execute once the automation engine runs.
        </p>
      </GlassCard>
    </div>
  );
}
