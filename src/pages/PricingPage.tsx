import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Sparkles } from "lucide-react";
import { TIER_LIMITS, formatPrice, type Tier } from "@/lib/tierLimits";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useAccess } from "@/hooks/useAccess";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

type Cycle = 'monthly' | 'annual';

export default function PricingPage() {
  const { access } = useAccess();
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [checkoutPrice, setCheckoutPrice] = useState<string | null>(null);

  const tiers: Exclude<Tier, 'trial'>[] = ['bronze', 'silver', 'gold'];
  const currentTier = access.state === 'paid' ? access.tier : null;

  return (
    <DashboardLayout>
      <PaymentTestModeBanner />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">Choose your plan</h1>
          <p className="text-muted-foreground mt-2">
            {access.state === 'trial' && `${access.trial_days_left} day${access.trial_days_left === 1 ? '' : 's'} left on your trial`}
            {access.state === 'expired' && (access.reason === 'time'
              ? 'Your 7-day trial has ended. Choose a plan to continue.'
              : 'You\'ve used your trial proposal. Upgrade to keep building.')}
            {access.state === 'paid' && `You're on the ${access.tier?.toUpperCase()} plan`}
            {access.state === 'anonymous' && 'Pricing for grant-writing teams of every size.'}
          </p>

          <div className="inline-flex rounded-lg border border-border bg-card p-1 mt-6">
            {(['monthly','annual'] as Cycle[]).map(c => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${cycle === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {c === 'monthly' ? 'Monthly' : 'Annual'}
                {c === 'annual' && <span className="ml-2 text-xs opacity-80">save 17%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(tierKey => {
            const t = TIER_LIMITS[tierKey];
            const isFeatured = tierKey === 'silver';
            const priceId = cycle === 'monthly' ? t.monthlyPriceId : t.annualPriceId;
            const cents = cycle === 'monthly' ? t.monthlyPriceCents : t.annualPriceCents;
            const isCurrent = currentTier === tierKey;

            return (
              <Card key={tierKey} className={`p-6 relative ${isFeatured ? 'border-primary shadow-lg' : ''}`}>
                {isFeatured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2"><Sparkles className="h-3 w-3 mr-1" />Most popular</Badge>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{t.label}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{formatPrice(cents)}</span>
                    <span className="text-muted-foreground text-sm">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {cycle === 'annual' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPrice(Math.round(cents / 12))}/mo billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 text-sm">
                  {t.highlights.map(h => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isFeatured ? 'default' : 'outline'}
                  disabled={isCurrent}
                  onClick={() => setCheckoutPrice(priceId)}
                >
                  {isCurrent ? 'Current plan' : access.state === 'paid' ? 'Switch to ' + t.label : 'Choose ' + t.label}
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Cancel anytime. Plans renew automatically. By subscribing you agree to our{' '}
          <Link to="/help" className="underline">terms</Link>.
        </p>
      </div>

      <Dialog open={!!checkoutPrice} onOpenChange={(o) => !o && setCheckoutPrice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete your subscription</DialogTitle>
          </DialogHeader>
          {checkoutPrice && <StripeEmbeddedCheckout priceId={checkoutPrice} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
