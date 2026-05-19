import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import type { Tier } from "@/lib/tierLimits";

export type AccessState =
  | { state: 'loading' }
  | { state: 'anonymous' }
  | { state: 'trial'; trial_days_left: number; proposals_used: number; proposals_limit: number }
  | { state: 'expired'; reason: 'time' | 'proposals'; trial_days_left: number; proposals_used: number; proposals_limit: number }
  | { state: 'paid'; tier: Tier; price_id: string | null; status: string; current_period_end: string | null; cancel_at_period_end: boolean; proposals_used: number; proposals_limit: number }
  | { state: 'limit_reached'; tier: Tier; price_id: string | null; status: string; current_period_end: string | null; cancel_at_period_end: boolean; proposals_used: number; proposals_limit: number };

export function useAccess() {
  const [access, setAccess] = useState<AccessState>({ state: 'loading' });

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_access_state', { _env: getStripeEnvironment() });
    if (error || !data) {
      setAccess({ state: 'anonymous' });
      return;
    }
    setAccess(data as AccessState);
  }, []);

  useEffect(() => {
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => refresh());

    // Realtime: refresh on any subscriptions change for current user
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      channel = supabase
        .channel(`subscriptions-${data.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${data.user.id}` }, () => refresh())
        .subscribe();
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

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
