import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Plus, Calendar, User, Flag, Circle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-secondary" },
  medium: { label: "Medium", color: "text-primary", bg: "bg-primary/10" },
  high: { label: "High", color: "text-accent-amber", bg: "bg-accent-amber/10" },
  urgent: { label: "Urgent", color: "text-destructive", bg: "bg-destructive/10" },
};

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "done">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) { setLoading(false); return; }
      setOrgId(org.id);
      const { data } = await supabase.from("tasks").select("*").eq("org_id", org.id).order("created_at", { ascending: false });
      setTasks(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const overdue = tasks.filter(t => t.status !== "done" && t.due_date && new Date(t.due_date) < new Date());

  const createTask = async () => {
    if (!newTitle || !orgId) return;
    const { error } = await supabase.from("tasks").insert({
      org_id: orgId,
      title: newTitle,
      description: newDesc || null,
      priority: newPriority,
      due_date: newDueDate || null,
      status: "open",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Task created!" });
    setNewTitle(""); setNewDesc(""); setNewPriority("medium"); setNewDueDate("");
    setCreateOpen(false);
    // Reload
    const { data } = await supabase.from("tasks").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const toggleStatus = async (task: any) => {
    const next = task.status === "done" ? "open" : task.status === "open" ? "in_progress" : "done";
    await supabase.from("tasks").update({ status: next, completed_at: next === "done" ? new Date().toISOString() : null }).eq("id", task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
  };

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-primary" /> Tasks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.filter(t => t.status !== "done").length} open
              {overdue.length > 0 && <span className="text-destructive"> · {overdue.length} overdue</span>}
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="What needs to be done?" className="mt-1 bg-secondary/30 border-border/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Details..." className="mt-1 bg-secondary/30 border-border/50 min-h-[60px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {(["low", "medium", "high", "urgent"] as const).map(p => (
                        <button key={p} onClick={() => setNewPriority(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs border ${newPriority === p ? "ring-2 ring-primary" : ""} ${priorityConfig[p].bg} ${priorityConfig[p].color} border-border/30`}>
                          {priorityConfig[p].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-primary text-primary-foreground" onClick={createTask}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 mb-4">
          {([["all", "All"], ["open", "Open"], ["in_progress", "In Progress"], ["done", "Done"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === key ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:bg-secondary/30 border border-transparent"}`}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <CheckSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tasks yet. Create your first task to get started.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((task, i) => {
              const isOverdue = task.status !== "done" && task.due_date && new Date(task.due_date) < new Date();
              const pri = priorityConfig[task.priority || "medium"];
              return (
                <motion.div key={task.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <button className="mt-0.5 shrink-0" onClick={() => toggleStatus(task)}>
                        {task.status === "done" ? <CheckCircle className="h-5 w-5 text-success" />
                          : task.status === "in_progress" ? <Clock className="h-5 w-5 text-primary" />
                          : <Circle className="h-5 w-5 text-muted-foreground/30" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </div>
                        {task.description && <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {task.due_date && (
                            <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                              {isOverdue && " ⚠️ Overdue"}
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${pri.bg} ${pri.color}`}>
                            <Flag className="h-2.5 w-2.5 inline mr-0.5" />{pri.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
