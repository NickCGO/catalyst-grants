import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Mail, Lock, User, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ParticleBackground from "@/components/ParticleBackground";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const features = [
  "AI-powered funder matching from 2,400+ funders",
  "Smart proposal writing assistant",
  "Application pipeline tracking",
  "Deadline calendar & reminders",
];

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignup = location.pathname === "/signup";
  const { user, loading: authLoading, signUp, signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
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
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account, then log in.",
        });
        navigate("/login");
      } else {
        const data = await signIn(email, password);
        if (data.user) {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: org } = await supabase
            .from("organisations")
            .select("onboarding_complete")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (!org || !org.onboarding_complete) {
            navigate("/onboarding");
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch (error: any) {
      toast({
        title: isSignup ? "Signup failed" : "Login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative gradient-hero items-center justify-center p-12">
        <ParticleBackground />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GrantMatch</span>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4">
            {isSignup ? "Start finding grants in minutes" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isSignup
              ? "Join hundreds of African NGOs already using GrantMatch to discover funding opportunities."
              : "Log in to access your matched grants and application pipeline."}
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <ArrowRight className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm text-foreground">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 gradient-bg">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">GrantMatch</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isSignup ? "Create your account" : "Log in"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {isSignup
              ? "Get started with GrantMatch to discover your funding matches."
              : "Enter your credentials to continue."}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Organisation Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. Ubuntu Youth Foundation"
                      className="pl-10 bg-secondary/30 border-border/50"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground appearance-none"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    >
                      <option value="">Select country</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Zimbabwe">Zimbabwe</option>
                      <option value="Mozambique">Mozambique</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@organisation.org"
                  className="pl-10 bg-secondary/30 border-border/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-secondary/30 border-border/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
              ) : (
                <>{isSignup ? "Create account" : "Log in"} <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {isSignup ? (
              <>Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link></>
            ) : (
              <>Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
