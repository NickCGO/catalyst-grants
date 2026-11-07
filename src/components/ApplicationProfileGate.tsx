import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, useOrganisation } from "@/hooks/useAuth";
import { needsApplicationProfile, profileCompletionUrl } from "@/lib/onboardingAccess";
import AfricaSpinner from "@/components/AfricaSpinner";

export default function ApplicationProfileGate({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { org, loading } = useOrganisation();
  const location = useLocation();
  if (loading || authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><AfricaSpinner className="h-12 w-12 text-primary animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (needsApplicationProfile(org)) return <Navigate to={profileCompletionUrl(location.pathname + location.search)} replace />;
  return <>{children}</>;
}