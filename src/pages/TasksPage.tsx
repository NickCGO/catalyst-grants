import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Plus, Calendar, Flag, Circle, CheckCircle, Clock, Pencil, Trash2, List, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Form state (shared for create and edit)
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState("medium");
  const [formDueDate, setFormDueDate] = useState("");

  const loadTasks = async (oid: string) => {
    const { data } = await supabase.from("tasks").select("*").eq("org_id", oid).order("created_at", { ascending: false });
    setTasks(data || []);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) { setLoading(false); return; }
      setOrgId(org.id);
      await loadTasks(org.id);
      setLoading(false);
    };
    load();
  }, [user]);

  // Realtime sync
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `org_id=eq.${orgId}` }, () => {
        loadTasks(orgId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const getDueDateStatus = (task: any) => {
    if (task.status === "done" || !task.due_date) return null;
    const due = new Date(task.due_date + "T23:59:59");
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, className: "text-destructive" };
    if (diffDays === 0) return { label: "Due today", className: "text-accent-amber" };
    if (diffDays <= 3) return { label: `Due in ${diffDays}d`, className: "text-accent-amber" };
    return null;
  };

  const overdue = tasks.filter(t => {
    if (t.status === "done" || !t.due_date) return false;
    return new Date(t.due_date + "T23:59:59") < new Date();
  });

  const resetForm = () => {
    setFormTitle(""); setFormDesc(""); setFormPriority("medium"); setFormDueDate("");
  };

  const createTask = async () => {
    if (!formTitle || !orgId) return;
    const { error } = await supabase.from("tasks").insert({
      org_id: orgId, title: formTitle, description: formDesc || null,
      priority: formPriority, due_date: formDueDate || null, status: "open",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Task created!" });
    resetForm();
    setCreateOpen(false);
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || "");
    setFormPriority(task.priority || "medium");
    setFormDueDate(task.due_date || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingTask || !formTitle) return;
    const { error } = await supabase.from("tasks").update({
      title: formTitle, description: formDesc || null,
      priority: formPriority, due_date: formDueDate || null,
    }).eq("id", editingTask.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Task updated!" });
    resetForm();
    setEditOpen(false);
    setEditingTask(null);
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: "Task deleted" });
  };

  const toggleStatus = async (task: any) => {
    const next = task.status === "done" ? "open" : task.status === "open" ? "in_progress" : "done";
    await supabase.from("tasks").update({ status: next, completed_at: next === "done" ? new Date().toISOString() : null }).eq("id", task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next, completed_at: next === "done" ? new Date().toISOString() : null } : t));
  };

  const renderTaskForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-3 mt-2">
      <div>
        <Label className="text-xs text-muted-foreground">Title</Label>
        <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="What needs to be done?" className="mt-1 bg-secondary/30 border-border/50" />
        <p className="text-[10px] text-muted-foreground mt-1">A short, action-oriented summary (e.g. "Draft concept note for Ford Foundation").</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Details..." className="mt-1 bg-secondary/30 border-border/50 min-h-[60px]" />
        <p className="text-[10px] text-muted-foreground mt-1">Optional context, links, or sub-steps for whoever picks this up.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Due Date</Label>
          <Input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
          <p className="text-[10px] text-muted-foreground mt-1">When this needs to be done by.</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <div className="flex gap-2 mt-1 flex-wrap">
            {(["low", "medium", "high", "urgent"] as const).map(p => (
              <button key={p} onClick={() => setFormPriority(p)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${formPriority === p ? "ring-2 ring-primary" : ""} ${priorityConfig[p].bg} ${priorityConfig[p].color} border-border/30`}>
                {priorityConfig[p].label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button className="w-full bg-primary text-primary-foreground" onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  );

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
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Task</DialogTitle>
              </DialogHeader>
              {renderTaskForm(createTask, "Create Task")}
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex gap-2">
            {([["all", "All"], ["open", "Open"], ["in_progress", "In Progress"], ["done", "Done"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === key ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:bg-secondary/30 border border-transparent"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/40 p-0.5 bg-secondary/20">
            <button onClick={() => setView("list")} className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 ${view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button onClick={() => setView("calendar")} className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 ${view === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Calendar
            </button>
          </div>
        </div>

        {view === "calendar" ? (
          <CalendarView tasks={tasks} month={calMonth} setMonth={setCalMonth} onTaskClick={openEdit} priorityConfig={priorityConfig} />
        ) : filtered.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <CheckSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tasks yet. Create your first task to get started.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((task, i) => {
              const dueStatus = getDueDateStatus(task);
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
                            <span className={`flex items-center gap-1 text-[10px] ${dueStatus?.className || "text-muted-foreground"}`}>
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date + "T00:00:00").toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                              {dueStatus && ` · ${dueStatus.label}`}
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${pri.bg} ${pri.color}`}>
                            <Flag className="h-2.5 w-2.5 inline mr-0.5" />{pri.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(task)} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { resetForm(); setEditingTask(null); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Task</DialogTitle>
          </DialogHeader>
          {renderTaskForm(saveEdit, "Save Changes")}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TasksPage;

function CalendarView({ tasks, month, setMonth, onTaskClick, priorityConfig }: { tasks: any[]; month: Date; setMonth: (d: Date) => void; onTaskClick: (t: any) => void; priorityConfig: any }) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const startDay = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells: Array<{ date: Date | null; iso: string | null }> = [];
  for (let i = 0; i < startDay; i++) cells.push({ date: null, iso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, m, d);
    cells.push({ date, iso: date.toISOString().slice(0, 10) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, iso: null });

  const tasksByDay: Record<string, any[]> = {};
  tasks.forEach(t => {
    if (!t.due_date) return;
    (tasksByDay[t.due_date] ||= []).push(t);
  });

  const monthName = first.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth(new Date(year, m - 1, 1))} className="p-1.5 rounded hover:bg-secondary/40 text-muted-foreground"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-2 py-1 rounded text-[11px] hover:bg-secondary/40 text-muted-foreground">Today</button>
          <button onClick={() => setMonth(new Date(year, m + 1, 1))} className="p-1.5 rounded hover:bg-secondary/40 text-muted-foreground"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-[10px] uppercase tracking-wider text-muted-foreground text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c.date) return <div key={i} className="min-h-[88px] rounded bg-secondary/10" />;
          const dayTasks = c.iso ? (tasksByDay[c.iso] || []) : [];
          const isToday = c.date.getTime() === today.getTime();
          const isPast = c.date < today;
          return (
            <div key={i} className={`min-h-[88px] rounded border p-1.5 ${isToday ? "border-primary bg-primary/5" : "border-border/30 bg-card"}`}>
              <div className={`text-[10px] mb-1 ${isToday ? "font-semibold text-primary" : isPast ? "text-muted-foreground/60" : "text-muted-foreground"}`}>{c.date.getDate()}</div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(t => {
                  const pri = priorityConfig[t.priority || "medium"];
                  return (
                    <button key={t.id} onClick={() => onTaskClick(t)} title={t.title}
                      className={`block w-full text-left text-[9px] px-1 py-0.5 rounded truncate ${t.status === "done" ? "line-through text-muted-foreground bg-secondary/30" : `${pri.bg} ${pri.color}`}`}>
                      {t.title}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
