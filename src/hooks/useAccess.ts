import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import type { Tier } from "@/lib/tierLimits";
import { useAuth } from "@/hooks/useAuth";

const ACCESS_TIMEOUT_MS = 8000;

const withTimeout = async <T,>(task: PromiseLike<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(task),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Access check timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export type AccessState =
  | { state: 'loading' }
  | { state: 'anonymous' }
  | { state: 'trial'; trial_days_left: number; proposals_used: number; proposals_limit: number }
  | { state: 'expired'; reason: 'time' | 'proposals'; trial_days_left: number; proposals_used: number; proposals_limit: number }
  | { state: 'paid'; tier: Tier; price_id: string | null; status: string; current_period_end: string | null; cancel_at_period_end: boolean; proposals_used: number; proposals_limit: number }
  | { state: 'limit_reached'; tier: Tier; price_id: string | null; status: string; current_period_end: string | null; cancel_at_period_end: boolean; proposals_used: number; proposals_limit: number };

export function useAccess() {
  const { user, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<AccessState>({ state: 'loading' });

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setAccess({ state: 'anonymous' });
      return;
    }
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('get_access_state', { _env: getStripeEnvironment() }),
        ACCESS_TIMEOUT_MS
      );
      if (error || !data) {
        setAccess({ state: 'anonymous' });
        return;
      }
      setAccess(data as AccessState);
    } catch (error) {
      console.error("Access state load error:", error);
      setAccess({ state: 'anonymous' });
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
    if (!user) return;

    // Realtime: refresh on any subscriptions change for current user
    const channel = supabase
      .channel(`subscriptions-${user.id}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, user, refresh]);

  return { access, refresh };
}

export function canWrite(access: AccessState): boolean {
  return access.state === 'trial' || access.state === 'paid';
}

export function canCreateProposal(access: AccessState): boolean {
  if (access.state === 'paid') return access.proposals_used < access.proposals_limit;
  if (access.state === 'trial') return access.proposals_used < access.proposals_limit;
  return false;
}
