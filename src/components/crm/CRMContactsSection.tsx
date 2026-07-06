import { useEffect, useState } from "react";
import { Plus, Star, Trash2, Pencil, X, Check } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  alt_emails: string[] | null;
  phone: string | null;
  notes: string | null;
  is_primary: boolean;
  source: string | null;
}

interface Props {
  orgId: string;
  funderId: string;
  relationshipId?: string | null;
}

const empty = { name: "", role: "", email: "", alt_emails: "", phone: "", notes: "" };

const CRMContactsSection = ({ orgId, funderId, relationshipId }: Props) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("funder_contacts")
      .select("*")
      .eq("org_id", orgId)
      .eq("funder_id", funderId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    setContacts((data as Contact[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (orgId && funderId) load();
    // eslint-disable-next-line
  }, [orgId, funderId]);

  const startEdit = (c: Contact) => {
    setEditingId(c.id);
    setAdding(false);
    setForm({
      name: c.name || "",
      role: c.role || "",
      email: c.email || "",
      alt_emails: (c.alt_emails || []).join(", "),
      phone: c.phone || "",
      notes: c.notes || "",
    });
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setForm(empty);
  };

  const cancel = () => {
    setAdding(false);
    setEditingId(null);
    setForm(empty);
  };

  const parseAlts = (s: string) =>
    s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

  const save = async () => {
    const payload = {
      org_id: orgId,
      funder_id: funderId,
      relationship_id: relationshipId ?? null,
      name: form.name || null,
      role: form.role || null,
      email: form.email ? form.email.trim().toLowerCase() : null,
      alt_emails: parseAlts(form.alt_emails),
      phone: form.phone || null,
      notes: form.notes || null,
    };
    if (editingId) {
      const { error } = await supabase.from("funder_contacts").update(payload).eq("id", editingId);
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      toast({ title: "Contact updated" });
    } else {
      const { error } = await supabase.from("funder_contacts").insert(payload);
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      toast({ title: "Contact added" });
    }
    cancel();
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await supabase.from("funder_contacts").delete().eq("id", id);
    load();
  };

  const togglePrimary = async (c: Contact) => {
    if (!c.is_primary) {
      // demote others
      await supabase
        .from("funder_contacts")
        .update({ is_primary: false })
        .eq("org_id", orgId)
        .eq("funder_id", funderId);
    }
    await supabase.from("funder_contacts").update({ is_primary: !c.is_primary }).eq("id", c.id);
    load();
  };

  const renderForm = () => (
    <GlassCard className="p-4 space-y-3 border-primary/30">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px]">Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-secondary/30 border-border/30 h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Role</Label>
          <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="bg-secondary/30 border-border/30 h-8 text-xs" placeholder="e.g. Program Officer" />
        </div>
        <div>
          <Label className="text-[10px]">Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-secondary/30 border-border/30 h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="bg-secondary/30 border-border/30 h-8 text-xs" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-[10px]">Alternate emails (comma-separated)</Label>
          <Input value={form.alt_emails} onChange={(e) => setForm({ ...form, alt_emails: e.target.value })}
            className="bg-secondary/30 border-border/30 h-8 text-xs"
            placeholder="alt1@funder.org, alt2@funder.org" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-[10px]">Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="bg-secondary/30 border-border/30 min-h-[60px] text-xs" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={cancel} className="h-7 text-xs">
          <X className="h-3 w-3 mr-1" /> Cancel
        </Button>
        <Button size="sm" onClick={save} className="h-7 text-xs">
          <Check className="h-3 w-3 mr-1" /> Save
        </Button>
      </div>
    </GlassCard>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Contacts ({contacts.length})</h3>
        {!adding && !editingId && (
          <Button size="sm" onClick={startAdd} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add contact
          </Button>
        )}
      </div>

      {adding && renderForm()}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : contacts.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground">No contacts yet. Add the program officer or grants manager you're working with.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) =>
            editingId === c.id ? (
              <div key={c.id}>{renderForm()}</div>
            ) : (
              <GlassCard key={c.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-foreground truncate">
                        {c.name || c.email || "(unnamed)"}
                      </p>
                      {c.is_primary && (
                        <Badge className="bg-primary/15 text-primary border-primary/30 text-[9px]">Primary</Badge>
                      )}
                      {c.source === "auto_inbound" && (
                        <Badge variant="outline" className="text-[9px]">auto-added</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {c.role ? `${c.role} · ` : ""}{c.email}{c.phone ? ` · ${c.phone}` : ""}
                    </p>
                    {c.alt_emails && c.alt_emails.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                        Also: {c.alt_emails.join(", ")}
                      </p>
                    )}
                    {c.notes && (
                      <p className="text-[11px] text-foreground/80 mt-1 whitespace-pre-wrap">{c.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => togglePrimary(c)}
                      title={c.is_primary ? "Remove primary" : "Mark as primary"} className="h-7 w-7">
                      <Star className={`h-3.5 w-3.5 ${c.is_primary ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(c)} className="h-7 w-7">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => del(c.id)} className="h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default CRMContactsSection;
