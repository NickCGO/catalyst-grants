import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth, useOrganisation } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import AfricaSpinner from "../components/AfricaSpinner";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isBetaLogin = location.pathname === "/login";
  const isSignup = location.pathname === "/signup";
  const { user, loading: authLoading, signUp, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignup) {
        if (!orgName || !country) {
          toast({ title: "Please fill in all fields", variant: "destructive" });
          setSubmitting(false);
          return;
        }
        await signUp(email, password, orgName, country);
        toast({ title: "Account created!", description: "Please check your email to verify your account, then log in." });
        navigate("/login");
      } else {
        const data = await signIn(email, password);
        if (data.user) {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: org } = await supabase.from("organisations").select("onboarding_complete").eq("user_id", data.user.id).maybeSingle();
          if (!org || !org.onboarding_complete) {
            navigate("/onboarding");
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch (error: any) {
      const msg = error?.message || "";
      if (isSignup) {
        toast({ title: "Sign up failed", description: msg || "Please try again.", variant: "destructive" });
      } else {
        let friendly = "We couldn't sign you in with those details. Double-check your email and password, and give it another go — you've got this.";
        if (/invalid login credentials/i.test(msg)) {
          friendly = "Those details don't quite match what we have on file. Take another look at your email and password and try again — we're rooting for you.";
        } else if (/email not confirmed/i.test(msg)) {
          friendly = "Almost there! Please confirm your email address from the link we sent you, then sign in again.";
        } else if (/network|fetch|timeout/i.test(msg)) {
          friendly = "We had trouble reaching the server. Check your connection and try once more.";
        }
        setLoginError(friendly);
      }
    }
    setSubmitting(false);
  };

  if (waitlistMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-foreground mb-2">You're on the waitlist!</h2>
          <p className="text-sm text-muted-foreground mb-6">We will email you when access opens. Thank you for your patience.</p>
          <Link to="/">
            <Button variant="outline" className="border-input text-foreground">
              <ArrowLeft className="h-3 w-3 mr-2" /> Back to homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Beta login page (hidden, clean, minimal)
  if (isBetaLogin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xl font-bold text-foreground">Find Your</span>
            <span className="text-xl font-bold text-primary">Grant</span>
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-4">Beta Access</p>
          <p className="text-xs text-muted-foreground/80 mb-6">This portal is for beta testers only. If you are on the waitlist, you will receive access when we launch.</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="login-email" className="text-xs text-muted-foreground">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
                <Input id="login-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 bg-secondary border-input text-foreground" placeholder="you@organisation.org" />
              </div>
            </div>
            <div>
              <Label htmlFor="login-password" className="text-xs text-muted-foreground">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
                <Input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 bg-secondary border-input text-foreground" placeholder="••••••••" />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl border-0">
              {submitting ? <AfricaSpinner className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign in to beta
            </Button>
          </form>
          <Link to="/" className="block text-center text-xs text-muted-foreground/80 hover:text-muted-foreground mt-4">← Back to homepage</Link>
        </motion.div>
        <Dialog open={!!loginError} onOpenChange={(o) => !o && setLoginError(null)}>
          <DialogContent className="max-w-md text-center border-border bg-card">
            <DialogHeader>
              <div className="mx-auto text-4xl mb-2">🌱</div>
              <DialogTitle className="text-center text-foreground">Let's try that again</DialogTitle>
              <DialogDescription className="text-center text-muted-foreground pt-2">
                {loginError}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => setLoginError(null)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                Try again
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Signup page (for beta testers who need accounts)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-foreground mb-2">Create beta account</h1>
        <p className="text-xs text-muted-foreground/80 mb-6">Only for invited beta testers.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="signup-org" className="text-xs text-muted-foreground">Organisation Name</Label>
            <Input id="signup-org" name="organization" autoComplete="organization" value={orgName} onChange={(e) => setOrgName(e.target.value)} required className="mt-1 bg-secondary border-input text-foreground" placeholder="e.g. Ubuntu Youth Foundation" />
          </div>
          <div>
            <Label htmlFor="signup-country" className="text-xs text-muted-foreground">Country</Label>
            <select id="signup-country" name="country" autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} required className="mt-1 w-full rounded-md bg-secondary border border-input text-foreground text-sm px-3 py-2">
              <option value="">Select country</option>
              {["South Africa", "Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda", "Ethiopia", "Rwanda"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="signup-email" className="text-xs text-muted-foreground">Email</Label>
            <Input id="signup-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-secondary border-input text-foreground" />
          </div>
          <div>
            <Label htmlFor="signup-password" className="text-xs text-muted-foreground">Password</Label>
            <Input id="signup-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 bg-secondary border-input text-foreground" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl border-0">
            {submitting ? <AfricaSpinner className="h-4 w-4 animate-spin mr-2" /> : null}
            Create account
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground/80 mt-4">Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link></p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
