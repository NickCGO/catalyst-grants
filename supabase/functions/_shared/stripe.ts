import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";

const getEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type StripeEnv = 'sandbox' | 'live';

export function getWebhookSecret(_env: StripeEnv): string {
  // BYOK: single signing secret for the project's registered endpoint
  return getEnv('STRIPE_WEBHOOK_SECRET');
}

export function createStripeClient(_env: StripeEnv = 'sandbox'): Stripe {
  return new Stripe(getEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2025-08-27.basil',
    httpClient: Stripe.createFetchHttpClient(),
  });
}
