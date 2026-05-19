import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";

type StripeEnv = 'sandbox' | 'live';

let configPromise: Promise<{ publishableKey: string; environment: StripeEnv }> | null = null;
let stripePromise: Promise<Stripe | null> | null = null;
let cachedEnv: StripeEnv = 'sandbox';

async function fetchConfig() {
  if (!configPromise) {
    configPromise = supabase.functions.invoke('get-stripe-config').then(({ data, error }) => {
      if (error || !data?.publishableKey) throw new Error(error?.message || 'Stripe not configured');
      cachedEnv = data.environment === 'live' ? 'live' : 'sandbox';
      return data as { publishableKey: string; environment: StripeEnv };
    });
  }
  return configPromise;
}

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = fetchConfig().then((cfg) => loadStripe(cfg.publishableKey));
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  void fetchConfig().catch(() => {});
  return cachedEnv;
}

export function isTestMode(): boolean {
  return cachedEnv === 'sandbox';
}

void fetchConfig().catch(() => {});
