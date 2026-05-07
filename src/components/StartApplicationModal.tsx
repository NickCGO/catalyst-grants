import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MatchScoreRing from "./MatchScoreRing";
import { Calendar, Globe, FileText, DollarSign, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hints } from "@/lib/formHints";

type ApplicationRoute = "full_proposal" | "loe" | "concept_note" | "online_form" | "guided";

function getApplicationRoute(method: string): ApplicationRoute {
  const m = method?.toLowerCase() || "";
  if (m.includes("application form") || m.includes("online") || m.includes("download") ||
      m.includes("prescribed format") || m.includes("online-must register") || m.includes("individual and project")) return "online_form";
  if (m.includes("loe") || m.includes("letter of enquiry") || m.includes("letter of inquiry") ||
      m.includes("letter of intent") || m.includes("loi") || m.includes("not unsolicited")) return "loe";
  if (m.includes("concept note") || m.includes("one page") || m.includes("3 pages") ||
      m.includes("short proposal") || m.includes("profile submission")) return "concept_note";
  if (m.includes("proposal")) return "full_proposal";
  return "guided";
}

const routeLabels: Record<ApplicationRoute, { label: string; color: string }> = {
  full_proposal: { label: "Full Proposal", color: "bg-primary/15 text-primary" },
  loe: { label: "Letter of Enquiry", color: "bg-accent-amber/15 text-accent-amber" },
  concept_note: { label: "Concept Note", color: "bg-purple-500/15 text-purple-400" },
  online_form: { label: "Online Form", color: "bg-success/15 text-success" },
  guided: { label: "Guided", color: "bg-muted/60 text-muted-foreground" },
};

const MONTH_NAMES = ["january","february","march","april","may","june","july","august","september","october","november","december"];

/**
 * Suggest a deadline (YYYY-MM-DD) from a funder's application_period string.
 * Returns the LAST day of the next occurring month mentioned, or null if not parseable.
 * Examples:
 *   "January"        -> last day of next January
 *   "Oct-Feb"        -> last day of next February
 *   "Monthly" / ""   -> null (no auto deadline)
 */
function suggestDeadline(period?: string | null): string | null {
  if (!period) return null;
  const lower = period.toLowerCase();
  if (lower.includes("monthly") || lower.includes("ongoing") || lower.includes("rolling") || lower.includes("any time") || lower.includes("anytime")) return null;

  // Find all months mentioned
  const found: number[] = [];
  MONTH_NAMES.forEach((m, i) => {
    if (lower.includes(m.slice(0, 3))) found.push(i);
  });
  if (found.length === 0) return null;

  // Use the LAST month in a range as the deadline cue
  const targetMonth = found[found.length - 1];
  const today = new Date();
  let year = today.getFullYear();
  if (targetMonth < today.getMonth()) year += 1;
  // Last day of that month
  const lastDay = new Date(year, targetMonth + 1, 0);
  const yyyy = lastDay.getFullYear();
  const mm = String(lastDay.getMonth() + 1).padStart(2, "0");
  const dd = String(lastDay.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  funder: { id: string; donor_name: string; category?: string; method_of_approach?: string; geographical_area?: string; application_period?: string; funder_focus?: string; website?: string; contact_person?: string; email?: string };
  matchScore: number;
  isOpen?: boolean;
  orgId: string;
  programmes?: string[];
  onCreated: (proposalId: string, route: ApplicationRoute) => void;
}

export default function StartApplicationModal({ open, onClose, funder, matchScore, isOpen, orgId, programmes = [], onCreated }: Props) {
  const [projectName, setProjectName] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [amountRequested, setAmountRequested] = useState("");
  const [deadline, setDeadline] = useState("");
  const [creating, setCreating] = useState(false);

  const route = getApplicationRoute(funder.method_of_approach || "");
  const routeInfo = routeLabels[route];

  useEffect(() => {
    if (open) {
      setProjectName("");
      setSelectedProgramme(programmes[0] || "");
      setAmountRequested("");
      setDeadline(suggestDeadline(funder.application_period) || "");
    }
  }, [open, programmes, funder.application_period]);

  const handleStart = async () => {
    setCreating(true);
    try {
      // Create application
      const { data: app, error: appErr } = await supabase.from("applications").insert({
        org_id: orgId,
        funder_id: funder.id,
        project_name: projectName || `Application to ${funder.donor_name}`,
        amount_requested: amountRequested ? parseFloat(amountRequested) : null,
        deadline: deadline || null,
        status: "pending",
        kanban_column: "backlog",
        application_route: route,
        activity_category: selectedProgramme || null,
      }).select("id").single();
      if (appErr) throw appErr;

      // Create proposal
      const { data: proposal, error: propErr } = await supabase.from("proposals").insert({
        org_id: orgId,
        funder_id: funder.id,
        application_id: app.id,
        status: "draft",
        format: route === "online_form" ? "form_prep" : route,
        funder_requirements: funder.funder_focus || null,
      }).select("id").single();
      if (propErr) throw propErr;

      toast.success("Application created!");
      onCreated(proposal.id, route);
    } catch (err: any) {
      toast.error(err.message || "Failed to create application");
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-background border-border/50">
        <DialogHeader>
          <DialogTitle className="text-base">Start Application</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-border/20">
            <div>
              <p className="text-xs text-muted-foreground">Applying to</p>
              <p className="text-sm font-semibold text-foreground">{funder.donor_name}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-primary" /><Badge className={`text-[9px] h-5 border-0 ${routeInfo.color}`}>{routeInfo.label}</Badge></span>
                {funder.application_period && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{funder.application_period}</span>}
                {funder.geographical_area && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{funder.geographical_area}</span>}
              </div>
              {isOpen && <Badge className="bg-success/20 text-success border-0 text-[9px] mt-1.5">● Open Now</Badge>}
            </div>
            <MatchScoreRing score={matchScore} size="sm" />
          </div>

          {programmes.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Which programme is this for?</Label>
              <select value={selectedProgramme} onChange={e => setSelectedProgramme(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                <option value="">Select programme</option>
                {programmes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">{hints.application.activityCategory}</p>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Project name (optional)</Label>
            <Input value={projectName} onChange={e => setProjectName(e.target.value)}
              placeholder={`Application to ${funder.donor_name}`} className="mt-1 bg-secondary/30 border-border/50" />
            <p className="text-[10px] text-muted-foreground mt-1">{hints.application.projectName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Amount (USD)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="number" value={amountRequested} onChange={e => setAmountRequested(e.target.value)}
                  placeholder="e.g. 50000" className="pl-8 bg-secondary/30 border-border/50" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{hints.application.amountRequested}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Deadline (if known)</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="mt-1 bg-secondary/30 border-border/50" />
              {funder.application_period && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Auto-filled from funder window: <span className="text-foreground">{funder.application_period}</span>. Adjust if you have a more accurate date.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleStart} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Start Application →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { getApplicationRoute, routeLabels };
export type { ApplicationRoute };
