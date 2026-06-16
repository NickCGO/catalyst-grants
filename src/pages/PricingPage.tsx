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

export default function PricingPage() {
  const { access } = useAccess();
  const [checkoutPrice, setCheckoutPrice] = useState<string | null>(null);

  const tiers: Exclude<Tier, 'trial'>[] = ['founders', 'starter', 'growth'];
  const a = access as any;
  const currentTier = access.state === 'paid' ? a.tier : null;

  return (
    <DashboardLayout>
      <PaymentTestModeBanner />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">Choose your plan</h1>
          <p className="text-muted-foreground mt-2">
            {access.state === 'trial' && `${a.trial_days_left} day${a.trial_days_left === 1 ? '' : 's'} left on your trial`}
            {access.state === 'expired' && (a.reason === 'time'
              ? 'Your 7-day trial has ended. Choose a plan to continue.'
              : "You've used your trial proposal. Upgrade to keep building.")}
            {access.state === 'paid' && `You're on the ${String(a.tier || '').toUpperCase()} plan`}
            {access.state === 'anonymous' && 'Monthly grant-writing plans for serious teams.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map(tierKey => {
            const t = TIER_LIMITS[tierKey];
            const isFounders = tierKey === 'founders';
            const isFeatured = tierKey === 'growth';
            const isCurrent = currentTier === tierKey;

            return (
              <Card key={tierKey} className={`p-6 relative ${isFeatured ? 'border-primary shadow-lg' : ''} ${isFounders ? 'border-accent-amber shadow-lg' : ''}`}>
                {isFounders && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-amber text-foreground"><Sparkles className="h-3 w-3 mr-1" />Founders discount</Badge>
                )}
                {isFeatured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2"><Sparkles className="h-3 w-3 mr-1" />Best value</Badge>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{t.label}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{formatPrice(t.monthlyPriceCents)}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.proposalsPerMonth} AI grant proposals per month
                  </p>
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
                  onClick={() => setCheckoutPrice(t.monthlyPriceId)}
                >
                  {isCurrent ? 'Current plan' : access.state === 'paid' ? `Switch to ${t.label}` : `Choose ${t.label}`}
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Cancel anytime. Plans renew monthly. Your proposal counter resets each billing cycle. By subscribing you agree to our{' '}
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
