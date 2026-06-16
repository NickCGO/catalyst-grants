import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AfricaSpinner from "../components/AfricaSpinner";

const AcceptInvitePage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus("error");
      setMessage("Missing invitation token.");
      return;
    }
    if (!user) {
      // Stash token & send to login
      sessionStorage.setItem("pendingInviteToken", token);
      navigate(`/login?redirect=/accept-invite?token=${token}`, { replace: true });
      return;
    }

    const accept = async () => {
      setStatus("working");
      const { data, error } = await supabase.rpc("accept_team_invite", { _token: token });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      const result = data as any;
      if (result?.error) {
        setStatus("error");
        setMessage(
          result.error === "expired" ? "This invitation has expired. Ask your admin to resend it." :
          result.error === "email_mismatch" ? `This invite was sent to ${result.expected}. Sign in with that email.` :
          result.error === "invalid_or_used" ? "This invitation is invalid or has already been used." :
          result.error
        );
        return;
      }
      sessionStorage.removeItem("pendingInviteToken");
      setStatus("ok");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
    };
    accept();
  }, [token, user, authLoading, navigate]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <GlassCard hoverable={false} className="max-w-md w-full p-8 text-center">
        {status === "working" || status === "idle" ? (
          <>
            <AfricaSpinner className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Accepting your invitation…</p>
          </>
        ) : status === "ok" ? (
          <>
            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mt-3">You're in!</h2>
            <p className="text-sm text-muted-foreground mt-1">Taking you to the dashboard…</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mt-3">Couldn't accept invitation</h2>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
            <Button className="mt-4" onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
          </>
        )}
      </GlassCard>
    </div>
  );
};

export default AcceptInvitePage;
