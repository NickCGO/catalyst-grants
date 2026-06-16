import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AuthSnapshot = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

let authSnapshot: AuthSnapshot = { user: null, session: null, loading: true };
let authInitialized = false;
const authSubscribers = new Set<() => void>();

const updateAuthSnapshot = (session: Session | null, loading = false) => {
  authSnapshot = {
    session,
    user: session?.user ?? null,
    loading,
  };
  authSubscribers.forEach((notify) => notify());
};

const ensureAuthInitialized = () => {
  if (authInitialized) return;
  authInitialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthSnapshot(session, false);
  });

  supabase.auth
    .getSession()
    .then(({ data: { session } }) => updateAuthSnapshot(session, false))
    .catch((error) => {
      console.error("Session restore error:", error);
      updateAuthSnapshot(null, false);
    });
};

export function useAuth() {
  const [state, setState] = useState<AuthSnapshot>(authSnapshot);

  useEffect(() => {
    ensureAuthInitialized();

    const notify = () => setState(authSnapshot);
    authSubscribers.add(notify);
    notify();

    return () => {
      authSubscribers.delete(notify);
    };
  }, []);

  const signUp = async (email: string, password: string, orgName: string, country: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { org_name: orgName, country },
      },
    });
    if (error) throw error;
    
    // Create organisation record if user was created
    if (data.user) {
      const { error: orgError } = await supabase.from("organisations").insert({
        user_id: data.user.id,
        name: orgName,
        country,
        onboarding_step: 0,
        onboarding_complete: false,
      });
      if (orgError) console.error("Org creation error:", orgError);
    }
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) throw error;
  };

  return { ...state, signUp, signIn, signOut, signInWithGoogle };
}

export function useRequireAuth() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      navigate("/login");
    }
  }, [auth.loading, auth.user, navigate]);

  return auth;
}

export function useOrganisation() {
  const { user, loading: authLoading } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let isActive = true;

    const loadOrganisation = async () => {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        setOrg(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("organisations")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!isActive) return;

        if (error) {
          console.error("Organisation load error:", error);
          setOrg(null);
        } else {
          setOrg(data ?? null);
        }
      } catch (error) {
        if (!isActive) return;
        console.error("Organisation load exception:", error);
        setOrg(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadOrganisation();

    return () => {
      isActive = false;
    };
  }, [authLoading, user?.id, refreshKey]);

  return { org, loading, refetch };
}
