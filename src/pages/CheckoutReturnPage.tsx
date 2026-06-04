import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAccess } from "@/hooks/useAccess";

export default function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { access, refresh } = useAccess();
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    // Webhook may take a moment — poll a few times
    if (access.state === 'paid') return;
    if (waited >= 6) return;
    const t = setTimeout(() => {
      refresh();
      setWaited((w) => w + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [access.state, waited, refresh]);

  const isPaid = access.state === 'paid';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full p-8 text-center">
        {isPaid ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Welcome to {access.tier?.toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Your subscription is active. You now have full access to Find The Grant.
            </p>
            <Button asChild className="mt-6 w-full"><Link to="/dashboard">Go to dashboard</Link></Button>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-lg font-semibold">Finalising your subscription…</h1>
            <p className="text-sm text-muted-foreground mt-2">
              We're activating your plan. This usually takes a few seconds.
            </p>
            {sessionId && <p className="text-[10px] text-muted-foreground mt-4 font-mono break-all">{sessionId}</p>}
          </>
        )}
      </Card>
    </div>
  );
}
