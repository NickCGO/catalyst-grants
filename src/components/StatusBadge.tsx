import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-muted/60 text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  submitted: "bg-purple-500/15 text-purple-400",
  follow_up: "bg-accent-amber/15 text-accent-amber",
  denied: "bg-destructive/15 text-destructive",
  successful: "bg-success/15 text-success",
  report_due: "bg-orange-500/15 text-orange-400",
  draft: "bg-muted/60 text-muted-foreground",
  ai_review: "bg-primary/15 text-primary",
  human_review: "bg-accent-amber/15 text-accent-amber",
  approved: "bg-success/15 text-success",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  submitted: "Submitted",
  follow_up: "Follow Up",
  denied: "Denied",
  successful: "Successful",
  report_due: "Report Due",
  draft: "Draft",
  ai_review: "AI Review",
  human_review: "Review",
  approved: "Approved",
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] || "bg-muted/60 text-muted-foreground",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status] || status}
    </span>
  );
};

export default StatusBadge;
