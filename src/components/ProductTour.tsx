import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useOrganisation } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Step {
  title: string;
  body: string;
  route?: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to GrantMatch 👋",
    body: "Quick 60-second tour. You can replay this anytime from the Help button at the bottom-right.",
    route: "/dashboard",
  },
  {
    title: "Dashboard",
    body: "Your home base — pipeline value, deadlines, and recent activity. Click any KPI to drill in.",
    route: "/dashboard",
  },
  {
    title: "Find Grants",
    body: "Browse 2,400+ funders with match scores tailored to your profile. Save the strong fits.",
    route: "/grants",
  },
  {
    title: "Applications",
    body: "Track every grant from drafting to outcome. Use blank apps if you don't yet have a funder.",
    route: "/applications",
  },
  {
    title: "Funder CRM",
    body: "Manage relationships: log calls, send emails, and plan follow-ups. Funder replies land here.",
    route: "/crm",
  },
  {
    title: "Tasks",
    body: "Personal & team to-do list with smart deadline reminders. Auto-created from applications.",
    route: "/tasks",
  },
  {
    title: "Help is always here",
    body: "Click the help button (bottom-right) any time. Visit /help for full documentation.",
    route: "/help",
  },
];

export default function ProductTour() {
  const { user } = useAuth();
  const { org, refetch } = useOrganisation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  // Auto-start once after onboarding
  useEffect(() => {
    if (!org || !user) return;
    const seen = (org as any).org_settings?.tour_completed;
    if (org.onboarding_complete && !seen) {
      // Small delay so the dashboard mounts first
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [org, user]);

  // Manual trigger from Help button
  useEffect(() => {
    const handler = () => { setStep(0); setOpen(true); };
    window.addEventListener("gm:start-tour", handler);
    return () => window.removeEventListener("gm:start-tour", handler);
  }, []);

  const finish = async (markSeen: boolean) => {
    setOpen(false);
    if (markSeen && org?.id) {
      const merged = { ...((org as any).org_settings || {}), tour_completed: true };
      await supabase.from("organisations").update({ org_settings: merged } as any).eq("id", org.id);
      refetch();
    }
  };

  const next = () => {
    const nxt = step + 1;
    if (nxt >= STEPS.length) {
      finish(true);
      return;
    }
    setStep(nxt);
    if (STEPS[nxt].route) navigate(STEPS[nxt].route!);
  };

  if (!open) return null;
  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <button onClick={() => finish(true)} className="text-muted-foreground hover:text-foreground" aria-label="Close tour">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
        <p className="text-sm text-muted-foreground mt-1.5">{s.body}</p>

        <div className="flex justify-between items-center mt-5">
          <button onClick={() => finish(true)} className="text-xs text-muted-foreground hover:text-foreground">
            Skip tour
          </button>
          <Button onClick={next} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {step === STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <div className="flex gap-1 justify-center mt-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${
              i === step ? "w-6 bg-primary" : "w-2 bg-border"
            }`} />
          ))}
        </div>
      </div>
    </div>
  );
}
