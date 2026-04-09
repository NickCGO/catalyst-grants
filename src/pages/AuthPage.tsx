import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useOrganisation } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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

  useEffect(() => {
    if (!authLoading && user) {
      // Check if beta tester
      const isBeta = user.user_metadata?.beta_tester === true;
      if (isBeta) {
        navigate("/dashboard");
      } else {
        setWaitlistMessage(true);
      }
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
          const isBeta = data.user.user_metadata?.beta_tester === true;
          if (isBeta) {
            // Check onboarding
            const { supabase } = await import("@/integrations/supabase/client");
            const { data: org } = await supabase.from("organisations").select("onboarding_complete").eq("user_id", data.user.id).maybeSingle();
            if (!org || !org.onboarding_complete) {
              navigate("/onboarding");
            } else {
              navigate("/dashboard");
            }
          } else {
            setWaitlistMessage(true);
          }
        }
      }
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message || "Please try again.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (waitlistMessage) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">You're on the waitlist!</h2>
          <p className="text-sm text-[#94A3B8] mb-6">We will email you when access opens. Thank you for your patience.</p>
          <Link to="/">
            <Button variant="outline" className="border-white/20 text-[#F1F5F9]">
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
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xl font-bold text-[#F1F5F9]">Grant</span>
            <span className="text-xl font-bold text-[#0EA5E9]">Match</span>
          </div>
          <p className="text-sm font-semibold text-[#94A3B8] mb-4">Beta Access</p>
          <p className="text-xs text-[#64748B] mb-6">This portal is for beta testers only. If you are on the waitlist, you will receive access when we launch.</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label className="text-xs text-[#94A3B8]">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 bg-[#0F172A]/60 border-white/10 text-[#F1F5F9]" placeholder="you@organisation.org" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#94A3B8]">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 bg-[#0F172A]/60 border-white/10 text-[#F1F5F9]" placeholder="••••••••" />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white rounded-xl border-0">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign in to beta
            </Button>
          </form>
          <Link to="/" className="block text-center text-xs text-[#64748B] hover:text-[#94A3B8] mt-4">← Back to homepage</Link>
        </motion.div>
      </div>
    );
  }

  // Signup page (for beta testers who need accounts)
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-[#F1F5F9] mb-2">Create beta account</h1>
        <p className="text-xs text-[#64748B] mb-6">Only for invited beta testers.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label className="text-xs text-[#94A3B8]">Organisation Name</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required className="mt-1 bg-[#0F172A]/60 border-white/10 text-[#F1F5F9]" placeholder="e.g. Ubuntu Youth Foundation" />
          </div>
          <div>
            <Label className="text-xs text-[#94A3B8]">Country</Label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} required className="mt-1 w-full rounded-md bg-[#0F172A]/60 border border-white/10 text-[#F1F5F9] text-sm px-3 py-2">
              <option value="">Select country</option>
              {["South Africa", "Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda", "Ethiopia", "Rwanda"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-[#94A3B8]">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-[#0F172A]/60 border-white/10 text-[#F1F5F9]" />
          </div>
          <div>
            <Label className="text-xs text-[#94A3B8]">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 bg-[#0F172A]/60 border-white/10 text-[#F1F5F9]" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white rounded-xl border-0">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create account
          </Button>
        </form>
        <p className="text-center text-xs text-[#64748B] mt-4">Already have an account? <Link to="/login" className="text-[#0EA5E9] hover:underline">Log in</Link></p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
