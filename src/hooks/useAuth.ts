import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

  return { user, session, loading, signUp, signIn, signOut, signInWithGoogle };
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
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let isActive = true;

    const loadOrganisation = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!isActive) return;

      if (!user) {
        setOrg(null);
        setLoading(false);
        return;
      }

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

      setLoading(false);
    };

    loadOrganisation();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadOrganisation();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [refreshKey]);

  return { org, loading, refetch };
}
