import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Inbox, Mail, Reply, ExternalLink, Loader2, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useOrganisation } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface InboundEmail {
  id: string;
  funder_id: string | null;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  is_read: boolean;
}

const InboxPage = () => {
  const { user } = useAuth();
  const { org } = useOrganisation();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [funders, setFunders] = useState<Record<string, { id: string; donor_name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("inbound_emails")
      .select("id,funder_id,from_email,from_name,subject,body_text,body_html,received_at,is_read")
      .eq("org_id", org.id)
      .order("received_at", { ascending: false })
      .limit(200);
    setEmails(data || []);

    const ids = Array.from(new Set((data || []).map((e) => e.funder_id).filter(Boolean) as string[]));
    if (ids.length) {
      const { data: f } = await supabase.from("funders").select("id,donor_name").in("id", ids);
      const map: Record<string, any> = {};
      (f || []).forEach((row) => { map[row.id] = row; });
      setFunders(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [org?.id]);

  // Realtime
  useEffect(() => {
    if (!org?.id) return;
    const channel = supabase
      .channel("inbox-realtime")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "inbound_emails", filter: `org_id=eq.${org.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, [org?.id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return emails;
    const q = search.toLowerCase();
    return emails.filter((e) =>
      (e.subject || "").toLowerCase().includes(q) ||
      (e.from_email || "").toLowerCase().includes(q) ||
      (e.body_text || "").toLowerCase().includes(q));
  }, [emails, search]);

  const selected = filtered.find((e) => e.id === selectedId) || filtered[0];

  const markRead = async (id: string) => {
    await supabase.from("inbound_emails").update({ is_read: true }).eq("id", id);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, is_read: true } : e)));
  };

  const openReply = (e: InboundEmail) => {
    if (!e.funder_id) {
      toast({ title: "No funder linked", description: "Reply from the Funder CRM once you've linked this funder." });
      return;
    }
    navigate(`/crm/${e.funder_id}?tab=communications&reply=${e.id}`);
  };

  const unreadCount = emails.filter((e) => !e.is_read).length;

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Inbox className="h-6 w-6 text-primary" /> Inbox
              {unreadCount > 0 && (
                <Badge className="bg-primary/15 text-primary border-primary/30 ml-1">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Replies from funders to your organisation's inbound address arrive here.
            </p>
          </div>
          <div className="relative w-72">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2 top-2.5" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, sender, body…"
              className="pl-7 h-9 text-xs bg-secondary/30 border-border/50" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : emails.length === 0 ? (
          <GlassCard hoverable={false}>
            <div className="p-12 text-center">
              <Mail className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-foreground">No messages yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Once your inbound provider is wired up, replies sent to your organisation's
                unique address will appear here automatically and get linked to the matching funder.
              </p>
              <Link to="/settings/team" className="text-xs text-primary hover:underline mt-3 inline-block">
                See your inbound address →
              </Link>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
            <GlassCard hoverable={false} className="overflow-hidden p-0 max-h-[70vh] overflow-y-auto">
              <div className="divide-y divide-border/20">
                {filtered.map((e) => {
                  const funderName = e.funder_id ? funders[e.funder_id]?.donor_name : null;
                  const isSelected = (selected?.id === e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => { setSelectedId(e.id); if (!e.is_read) markRead(e.id); }}
                      className={`w-full text-left p-3 hover:bg-secondary/30 transition-colors ${
                        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      } ${!e.is_read ? "bg-primary/[0.03]" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-foreground truncate flex items-center gap-1.5">
                            {!e.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                            {e.from_name || e.from_email}
                          </div>
                          <div className="text-[11px] text-foreground/80 truncate mt-0.5">
                            {e.subject || "(no subject)"}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {(e.body_text || "").slice(0, 80)}
                          </div>
                        </div>
                        <div className="text-[9px] text-muted-foreground/70 shrink-0">
                          {formatDistanceToNow(new Date(e.received_at), { addSuffix: false })}
                        </div>
                      </div>
                      {funderName && (
                        <Badge variant="outline" className="text-[9px] mt-1.5 border-border/40">
                          {funderName}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard hoverable={false} className="p-0 overflow-hidden">
              {selected ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-foreground truncate">
                          {selected.subject || "(no subject)"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selected.from_name ? `${selected.from_name} <${selected.from_email}>` : selected.from_email}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {new Date(selected.received_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {selected.funder_id && (
                          <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
                            <Link to={`/crm/${selected.funder_id}`}>
                              <ExternalLink className="h-3 w-3 mr-1" /> Funder
                            </Link>
                          </Button>
                        )}
                        <Button size="sm" onClick={() => openReply(selected)}
                          className="h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90">
                          <Reply className="h-3 w-3 mr-1" /> Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {selected.body_html ? (
                      <div className="prose prose-sm max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: selected.body_html }} />
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs text-foreground/90 font-sans">
                        {selected.body_text || "(empty body)"}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  Select a message to read.
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InboxPage;
