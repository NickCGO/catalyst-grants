export type OnboardingOrganisation = {
  onboarding_complete?: boolean | null;
  org_settings?: unknown;
};

export function canExplore(org: OnboardingOrganisation | null | undefined): boolean {
  if (org?.onboarding_complete) return true;
  const settings = org?.org_settings;
  return typeof settings === "object" && settings !== null &&
    "quick_start" in settings && settings.quick_start === true;
}

export function needsApplicationProfile(org: OnboardingOrganisation | null | undefined): boolean {
  return org?.onboarding_complete !== true;
}

export function profileCompletionUrl(returnTo: string): string {
  return `/onboarding?returnTo=${encodeURIComponent(returnTo)}`;
}

export function safeProfileReturn(value: string | null): string {
  if (!value || !/^\/(grants|applications|writer)(\/|\?|$)/.test(value) || value.includes("\\")) return "/dashboard";
  return value;
}