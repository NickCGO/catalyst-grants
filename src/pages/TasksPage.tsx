import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Plus, Calendar, User, Flag, Circle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "done";
  linkedTo?: string;
}

const priorityConfig = {
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-secondary" },
  medium: { label: "Medium", color: "text-primary", bg: "bg-primary/10" },
  high: { label: "High", color: "text-accent-amber", bg: "bg-accent-amber/10" },
  urgent: { label: "Urgent", color: "text-destructive", bg: "bg-destructive/10" },
};

const mockTasks: Task[] = [
  { id: "1", title: "Draft executive summary for DG Murray", description: "Write the first draft based on programme data", assignee: "James Ndlovu", dueDate: "2026-03-28", priority: "high", status: "in_progress", linkedTo: "DG Murray Trust" },
  { id: "2", title: "Review NLC proposal methodology section", description: "Check alignment with funder requirements", assignee: "Fatima Abdi", dueDate: "2026-03-25", priority: "urgent", status: "open", linkedTo: "NLC" },
  { id: "3", title: "Collect M&E data for impact report", description: "Gather attendance registers and outcome surveys", assignee: "Sarah Moyo", dueDate: "2026-04-01", priority: "medium", status: "open" },
  { id: "4", title: "Update org financials for Anglo American", description: "Get latest audited figures from finance team", assignee: "James Ndlovu", dueDate: "2026-03-30", priority: "medium", status: "done" },
  { id: "5", title: "Schedule site visit with Ford Foundation", description: "Coordinate with programme team", assignee: "Sarah Moyo", dueDate: "2026-04-10", priority: "low", status: "open" },
];

const TasksPage = () => {
  const [tasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "done">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const overdue = tasks.filter(t => t.status !== "done" && new Date(t.dueDate) < new Date());

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-primary" /> Tasks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.filter(t => t.status !== "done").length} open · {overdue.length > 0 && <span className="text-destructive">{overdue.length} overdue</span>}
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
                  <Input placeholder="What needs to be done?" className="mt-1 bg-secondary/30 border-border/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea placeholder="Details..." className="mt-1 bg-secondary/30 border-border/50 min-h-[60px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Assign To</Label>
                    <select className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                      <option>Sarah Moyo</option><option>James Ndlovu</option><option>Fatima Abdi</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <Input type="date" className="mt-1 bg-secondary/30 border-border/50" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <div className="flex gap-2 mt-1">
                    {(["low", "medium", "high", "urgent"] as const).map(p => (
                      <button key={p} className={`px-3 py-1.5 rounded-lg text-xs border ${priorityConfig[p].bg} ${priorityConfig[p].color} border-border/30`}>
                        {priorityConfig[p].label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full bg-primary text-primary-foreground" onClick={() => { setCreateOpen(false); toast({ title: "Task created!" }); }}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {([["all", "All"], ["open", "Open"], ["in_progress", "In Progress"], ["done", "Done"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === key ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:bg-secondary/30 border border-transparent"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filtered.map((task, i) => {
            const isOverdue = task.status !== "done" && new Date(task.dueDate) < new Date();
            const pri = priorityConfig[task.priority];
            return (
              <motion.div key={task.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard className="p-4">
                  <div className="flex items-start gap-3">
                    <button className="mt-0.5 shrink-0">
                      {task.status === "done" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : task.status === "in_progress" ? (
                        <Clock className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/30" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" /> {task.assignee}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                          {isOverdue && " ⚠️ Overdue"}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${pri.bg} ${pri.color}`}>
                          <Flag className="h-2.5 w-2.5 inline mr-0.5" />{pri.label}
                        </span>
                        {task.linkedTo && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{task.linkedTo}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
