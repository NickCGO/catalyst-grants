import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Mail, Phone, Users, FileText, TrendingUp, Eye,
  Calendar, Pin, PinOff, Trash2, Plus, Send, Loader2,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const noteTypeLabels: Record<string, string> = {
  note: "Note",
  call_log: "Call Log",
  meeting_note: "Meeting Note",
  strategy: "Strategy",
  follow_up: "Follow-up",
};

const noteTypeColors: Record<string, string> = {
  note: "bg-muted text-muted-foreground",
  call_log: "bg-primary/20 text-primary",
  meeting_note: "bg-accent/20 text-accent-foreground",
  strategy: "bg-warning/20 text-warning",
  follow_up: "bg-success/20 text-success",
};

const interactionIcons: Record<string, typeof Mail> = {
  email_sent: Mail, email_received: Mail, call: Phone, meeting: Users,
  proposal_submitted: FileText, proposal_outcome: TrendingUp,
  report_submitted: FileText, site_visit: Eye, event: Calendar, note: MessageSquare,
};

const sentimentColors: Record<string, string> = {
  positive: "bg-success/20 text-success",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-destructive/20 text-destructive",
  unknown: "bg-muted text-muted-foreground",
};

interface Props {
  orgId: string;
  funderId: string;
  interactions: any[];
  onRefresh: () => void;
}

export default function CRMActivityFeed({ orgId, funderId, interactions, onRefresh }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [adding, setAdding] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    loadNotes();
    const channel = supabase
      .channel(`crm-notes-${funderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_activity_notes", filter: `funder_id=eq.${funderId}` }, () => loadNotes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [funderId]);

  const loadNotes = async () => {
    const { data } = await supabase
      .from("crm_activity_notes")
      .select("*")
      .eq("org_id", orgId)
      .eq("funder_id", funderId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setNotes(data || []);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAdding(true);
    await supabase.from("crm_activity_notes").insert({
      org_id: orgId,
      funder_id: funderId,
      content: newNote.trim(),
      note_type: noteType,
    });
    setNewNote("");
    setAdding(false);
    setShowComposer(false);
    toast({ title: "Note added" });
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from("crm_activity_notes").update({ is_pinned: !pinned }).eq("id", id);
    loadNotes();
  };

  const deleteNote = async (id: string) => {
    await supabase.from("crm_activity_notes").delete().eq("id", id);
    loadNotes();
    toast({ title: "Note deleted" });
  };

  // Merge interactions + notes into unified timeline
  const timeline = [
    ...notes.map((n) => ({ ...n, _type: "note" as const, _date: new Date(n.created_at) })),
    ...interactions.map((i) => ({ ...i, _type: "interaction" as const, _date: new Date(i.date) })),
  ].sort((a, b) => {
    // Pinned notes first
    if (a._type === "note" && a.is_pinned && !(b._type === "note" && b.is_pinned)) return -1;
    if (b._type === "note" && b.is_pinned && !(a._type === "note" && a.is_pinned)) return 1;
    return b._date.getTime() - a._date.getTime();
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Activity Feed</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowComposer(!showComposer)}>
          <Plus className="h-3 w-3 mr-1" /> Add Note
        </Button>
      </div>

      {showComposer && (
        <GlassCard className="p-3 space-y-2">
          <div className="flex gap-2">
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger className="w-[130px] h-7 text-[10px] bg-secondary/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(noteTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add an internal note..."
            className="bg-secondary/30 border-border/30 min-h-[80px] text-xs"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowComposer(false)}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs" onClick={addNote} disabled={adding || !newNote.trim()}>
              {adding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
              Save
            </Button>
          </div>
        </GlassCard>
      )}

      {timeline.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity yet. Add a note or log an interaction.</p>
      ) : (
        <div className="space-y-1">
          {timeline.map((item, i) => {
            if (item._type === "note") {
              return (
                <motion.div key={`note-${item.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className={`flex gap-3 p-3 rounded-lg hover:bg-secondary/10 transition-colors ${item.is_pinned ? "border border-primary/20 bg-primary/5" : ""}`}>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={`${noteTypeColors[item.note_type] || "bg-muted text-muted-foreground"} text-[9px] h-4`}>
                          {noteTypeLabels[item.note_type] || item.note_type}
                        </Badge>
                        {item.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {item._date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <button onClick={() => togglePin(item.id, item.is_pinned)} className="text-muted-foreground hover:text-primary transition-colors">
                          {item.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                        </button>
                        <button onClick={() => deleteNote(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{item.content}</p>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // Interaction
            const Icon = interactionIcons[item.interaction_type] || MessageSquare;
            return (
              <motion.div key={`int-${item.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/10 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{item.interaction_type?.replace(/_/g, " ")}</span>
                      <Badge className={`${sentimentColors[item.sentiment || "unknown"]} text-[9px] h-4`}>{item.sentiment}</Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {item._date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {item.summary && <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>}
                    {item.outcome && <p className="text-xs text-muted-foreground/70 mt-0.5 italic">Outcome: {item.outcome}</p>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
