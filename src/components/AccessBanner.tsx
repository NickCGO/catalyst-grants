import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";

export function AccessBanner() {
  const { access } = useAccess();

  if (access.state === 'paid' || access.state === 'loading' || access.state === 'anonymous') {
    if (access.state === 'paid' && access.cancel_at_period_end && access.current_period_end) {
      const end = new Date(access.current_period_end).toLocaleDateString();
      return (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-3 text-sm text-amber-900">
          <Clock className="h-4 w-4" />
          <span>Your subscription cancels on {end}.</span>
          <Button asChild size="sm" variant="outline"><Link to="/pricing">Resume plan</Link></Button>
        </div>
      );
    }
    return null;
  }

  if (access.state === 'trial') {
    const dl = access.trial_days_left;
    const pl = access.proposals_limit - access.proposals_used;
    return (
      <div className="w-full bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-3 text-sm">
        <Clock className="h-4 w-4 text-primary" />
        <span>
          Trial: <strong>{dl} day{dl === 1 ? '' : 's'}</strong> and <strong>{Math.max(0, pl)} proposal</strong> remaining
        </span>
        <Button asChild size="sm"><Link to="/pricing">Upgrade now</Link></Button>
      </div>
    );
  }

  // expired or monthly limit reached
  if (access.state === 'limit_reached') {
    return (
      <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-3 text-sm text-amber-900">
        <AlertTriangle className="h-4 w-4" />
        <span>
          You've used all {access.proposals_limit} proposals on your {String(access.tier).toUpperCase()} plan this cycle. Renews on{' '}
          {access.current_period_end ? new Date(access.current_period_end).toLocaleDateString() : 'next billing date'}.
        </span>
        <Button asChild size="sm" variant="outline"><Link to="/pricing">Upgrade plan</Link></Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 flex items-center justify-center gap-3 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4" />
      <span>
        {access.reason === 'time' ? 'Your 7-day trial has ended.' : "You've used your trial proposal."} Read-only mode is active.
      </span>
      <Button asChild size="sm" variant="destructive"><Link to="/pricing">Choose a plan</Link></Button>
    </div>
  );
}

export function ReadOnlyOverlay({ feature }: { feature: string }) {
  const { access } = useAccess();
  if (access.state !== 'expired') return null;

  return (
    <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center">
      <Lock className="h-8 w-8 text-destructive mx-auto mb-3" />
      <h3 className="font-semibold">{feature} is locked</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Your trial has ended. Upgrade to continue using this feature.
      </p>
      <Button asChild><Link to="/pricing">View plans</Link></Button>
    </div>
  );
}
