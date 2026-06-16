export type Tier = 'trial' | 'founders' | 'starter' | 'growth';

export interface TierLimits {
  proposalsPerMonth: number;
  teamSeats: number;
  aiTokensPerMonth: number;
  label: string;
  monthlyPriceCents: number;
  monthlyPriceId: string;
  highlights: string[];
}

export const TIER_LIMITS: Record<Exclude<Tier, 'trial'>, TierLimits> = {
  founders: {
    label: 'Founders',
    proposalsPerMonth: 3,
    teamSeats: 3,
    aiTokensPerMonth: 100_000,
    monthlyPriceCents: 4700,
    monthlyPriceId: 'founders_monthly',
    highlights: [
      'Locked-in founding-member price for life',
      '3 AI grant proposals / month',
      '3 team seats',
      'Full funder database access',
      'Deadline tracking & reminders',
      'Email support',
    ],
  },
  starter: {
    label: 'Starter',
    proposalsPerMonth: 3,
    teamSeats: 3,
    aiTokensPerMonth: 100_000,
    monthlyPriceCents: 29700,
    monthlyPriceId: 'starter_monthly',
    highlights: [
      '3 AI grant proposals / month',
      '3 team seats',
      'Full funder database access',
      'Deadline tracking & reminders',
      'Email support',
    ],
  },
  growth: {
    label: 'Growth',
    proposalsPerMonth: 10,
    teamSeats: 10,
    aiTokensPerMonth: 500_000,
    monthlyPriceCents: 75000,
    monthlyPriceId: 'growth_monthly',
    highlights: [
      '10 AI grant proposals / month',
      '10 team seats',
      'Everything in Starter',
      'Partnership Hub & consortia tools',
      'Impact report generator',
      'Priority support',
    ],
  },
};

export const TRIAL_DAYS = 7;
export const TRIAL_PROPOSALS = 1;

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}
