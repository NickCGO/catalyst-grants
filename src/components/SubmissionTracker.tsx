import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GlassCard from "./GlassCard";
import StatusBadge from "./StatusBadge";
import { CheckCircle2, Clock, Send, AlertCircle, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SubmissionEvent {
  id: string;
  project_name: string;
  funder_name: string;
  status: string;
  updated_at: string;
  application_id: string;
}

const statusTimeline = [
  { key: "pending", label: "Created", icon: Clock },
  { key: "in_progress", label: "In Progress", icon: AlertCircle },
  { key: "submitted", label: "Submitted", icon: Send },
  { key: "successful", label: "Awarded", icon: Trophy },
];

const SubmissionTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase
        .from("organisations")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!org) { setLoading(false); return; }

      const { data: apps } = await supabase
        .from("applications")
        .select("id, project_name, funder_id, status, updated_at")
        .eq("org_id", org.id)
        .in("status", ["submitted", "successful", "denied", "follow_up"])
        .order("updated_at", { ascending: false })
        .limit(20);

      if (!apps || apps.length === 0) { setSubmissions([]); setLoading(false); return; }

      const funderIds = [...new Set(apps.map(a => a.funder_id).filter(Boolean))];
      const { data: funders } = funderIds.length > 0
        ? await supabase.from("funders").select("id, donor_name").in("id", funderIds as string[])
        : { data: [] };

      const funderMap = Object.fromEntries((funders || []).map(f => [f.id, f.donor_name]));

      setSubmissions(apps.map(a => ({
        id: a.id,
        project_name: a.project_name || "Untitled",
        funder_name: a.funder_id ? funderMap[a.funder_id] || "Unknown" : "Manual",
        status: a.status || "submitted",
        updated_at: a.updated_at || "",
        application_id: a.id,
      })));
      setLoading(false);
    };
    load();
  }, [user]);

  const getStepIndex = (status: string) => {
    if (status === "denied") return 2;
    const idx = statusTimeline.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) return null;
  if (submissions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Submission Tracker</h3>
      {submissions.map((sub, i) => {
        const stepIdx = getStepIndex(sub.status);
        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard
              className="p-3 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => navigate("/applications")}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-foreground">{sub.project_name}</p>
                  <p className="text-[10px] text-muted-foreground">{sub.funder_name}</p>
                </div>
                <StatusBadge status={sub.status} />
              </div>
              <div className="flex items-center gap-1">
                {statusTimeline.map((step, j) => {
                  const Icon = step.icon;
                  const isActive = j <= stepIdx;
                  const isCurrent = j === stepIdx;
                  const isDenied = sub.status === "denied" && j === 2;
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full ${
                        isDenied ? "bg-destructive/20 text-destructive" :
                        isCurrent ? "bg-primary/20 text-primary ring-1 ring-primary/40" :
                        isActive ? "bg-primary/10 text-primary" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        <Icon className="h-2.5 w-2.5" />
                      </div>
                      {j < statusTimeline.length - 1 && (
                        <div className={`flex-1 h-px mx-0.5 ${isActive && j < stepIdx ? "bg-primary/40" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                Updated {sub.updated_at ? new Date(sub.updated_at).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }) : "–"}
              </p>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SubmissionTracker;
