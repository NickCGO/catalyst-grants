import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Mail, Lock, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ParticleBackground from "@/components/ParticleBackground";

const features = [
  "AI-powered funder matching from 2,400+ funders",
  "Smart proposal writing assistant",
  "Application pipeline tracking",
  "Deadline calendar & reminders",
];

const AuthPage = () => {
  const location = useLocation();
  const isSignup = location.pathname === "/signup";
  const [featureIndex, setFeatureIndex] = useState(0);

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
            {isSignup ? "Free forever. No credit card required." : "Enter your credentials to continue."}
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {isSignup && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Organisation Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g. Ubuntu Youth Foundation" className="pl-10 bg-secondary/30 border-border/50" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground appearance-none">
                      <option value="">Select country</option>
                      <option value="ZA">South Africa</option>
                      <option value="NG">Nigeria</option>
                      <option value="KE">Kenya</option>
                      <option value="GH">Ghana</option>
                      <option value="TZ">Tanzania</option>
                      <option value="UG">Uganda</option>
                      <option value="ET">Ethiopia</option>
                      <option value="RW">Rwanda</option>
                      <option value="ZW">Zimbabwe</option>
                      <option value="MZ">Mozambique</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="you@organisation.org" className="pl-10 bg-secondary/30 border-border/50" />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" className="pl-10 bg-secondary/30 border-border/50" />
              </div>
            </div>

            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" type="submit">
              {isSignup ? "Create account" : "Log in"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-muted-foreground">or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full border-border/50 text-foreground hover:bg-secondary/50" type="button">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {isSignup ? (
              <>Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link></>
            ) : (
              <>Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up free</Link></>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
