export type Tier = 'trial' | 'bronze' | 'silver' | 'gold';

export interface TierLimits {
  proposalsPerMonth: number | 'unlimited';
  teamSeats: number;
  aiTokensPerMonth: number;
  label: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  monthlyPriceId: string;
  annualPriceId: string;
  highlights: string[];
}

export const TIER_LIMITS: Record<Exclude<Tier, 'trial'>, TierLimits> = {
  bronze: {
    label: 'Bronze',
    proposalsPerMonth: 5,
    teamSeats: 2,
    aiTokensPerMonth: 50_000,
    monthlyPriceCents: 4900,
    annualPriceCents: 49000,
    monthlyPriceId: 'bronze_monthly',
    annualPriceId: 'bronze_annual',
    highlights: ['5 AI proposals / month', '2 team seats', '50,000 AI tokens / month', 'Email support'],
  },
  silver: {
    label: 'Silver',
    proposalsPerMonth: 10,
    teamSeats: 5,
    aiTokensPerMonth: 200_000,
    monthlyPriceCents: 12900,
    annualPriceCents: 129000,
    monthlyPriceId: 'silver_monthly',
    annualPriceId: 'silver_annual',
    highlights: ['10 AI proposals / month', '5 team seats', '200,000 AI tokens / month', 'Priority support', 'Advanced analytics'],
  },
  gold: {
    label: 'Gold',
    proposalsPerMonth: 'unlimited',
    teamSeats: 15,
    aiTokensPerMonth: 1_000_000,
    monthlyPriceCents: 34900,
    annualPriceCents: 349000,
    monthlyPriceId: 'gold_monthly',
    annualPriceId: 'gold_annual',
    highlights: ['Unlimited proposals', '15 team seats', '1,000,000 AI tokens / month', 'Dedicated success manager', 'Custom integrations'],
  },
};

export const TRIAL_DAYS = 7;
export const TRIAL_PROPOSALS = 1;

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}
