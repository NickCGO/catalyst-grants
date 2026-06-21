import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import AfricaSpinner from "@/components/AfricaSpinner";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingHash, setCheckingHash] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      setError("This reset link is invalid or has expired. Please request a new one.");
    }
    setCheckingHash(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  if (checkingHash) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <AfricaSpinner className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md w-full text-center"
        >
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Password updated</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
            Go to login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full">
        <button onClick={() => navigate("/login")} className="flex items-center text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3 mr-1" /> Back to login
        </button>
        <h1 className="text-xl font-bold text-foreground mb-2">Reset your password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter a new password below.</p>

        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 mb-4">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="new-password" className="text-xs text-muted-foreground">New password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
              <Input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-10 bg-secondary border-input text-foreground"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">Confirm password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="pl-10 bg-secondary border-input text-foreground"
                placeholder="••••••••"
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl border-0">
            {submitting ? <AfricaSpinner className="h-4 w-4 animate-spin mr-2" /> : null}
            Reset password
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
