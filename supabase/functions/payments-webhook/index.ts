import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, getWebhookSecret } from "../_shared/stripe.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Map our human-readable price IDs to tier names
const PRICE_TO_TIER: Record<string, string> = {
  bronze_monthly: 'bronze',
  bronze_annual: 'bronze',
  silver_monthly: 'silver',
  silver_annual: 'silver',
  gold_monthly: 'gold',
  gold_annual: 'gold',
};

async function upsertSubscription(env: StripeEnv, stripe: ReturnType<typeof createStripeClient>, subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to get from customer
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      const cUserId = (customer as any)?.metadata?.userId;
      if (!cUserId) {
        console.warn('No userId on subscription/customer', subscription.id);
        return;
      }
      subscription.metadata = { ...subscription.metadata, userId: cUserId };
    } else {
      console.warn('No customer on subscription', subscription.id);
      return;
    }
  }

  const finalUserId = subscription.metadata.userId;
  const item = subscription.items?.data?.[0];
  const stripePriceId = item?.price?.id;
  const stripeProductId = item?.price?.product;
  const lookupKey = item?.price?.lookup_key || subscription.metadata?.lovable_price_id;
  const tier = lookupKey ? PRICE_TO_TIER[lookupKey] ?? null : null;
  const periodEnd = item?.current_period_end || subscription.current_period_end;

  await supabaseAdmin.from('subscriptions').upsert({
    user_id: finalUserId,
    environment: env,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    stripe_subscription_id: subscription.id,
    price_id: lookupKey || null,
    product_id: typeof stripeProductId === 'string' ? stripeProductId : null,
    tier,
    status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: !!subscription.cancel_at_period_end,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });

  // Reflect tier on org
  if (tier) {
    await supabaseAdmin
      .from('organisations')
      .update({ plan_tier: tier })
      .eq('user_id', finalUserId);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const url = new URL(req.url);
  const env: StripeEnv = url.searchParams.get('env') === 'live' ? 'live' : 'sandbox';

  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const rawBody = await req.text();
  const stripe = createStripeClient(env);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, getWebhookSecret(env));
  } catch (e) {
    console.error('Webhook signature verification failed:', e);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertSubscription(env, stripe, event.data.object);
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await upsertSubscription(env, stripe, sub);
        }
        break;
      }
      default:
        console.log('Unhandled event:', event.type);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Webhook handler error:', e);
    return new Response('Webhook error', { status: 500 });
  }
});
