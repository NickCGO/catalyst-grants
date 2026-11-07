import { describe, expect, it } from "vitest";
import { canExplore, needsApplicationProfile, profileCompletionUrl, safeProfileReturn } from "@/lib/onboardingAccess";

describe("quick-start onboarding", () => {
  it("allows quick-start NGOs to explore while their profile stays incomplete", () => {
    const org = { onboarding_complete: false, org_settings: { quick_start: true } };
    expect(canExplore(org)).toBe(true);
    expect(needsApplicationProfile(org)).toBe(true);
  });
  it("keeps normal incomplete onboarding mandatory until explicitly skipped", () => {
    expect(canExplore({ onboarding_complete: false, org_settings: {} })).toBe(false);
  });
  it("allows completed NGOs to apply without repeating onboarding", () => {
    expect(needsApplicationProfile({ onboarding_complete: true })).toBe(false);
  });
  it("retains the chosen funder and application intent through completion", () => {
    const destination = "/grants/funder-123?apply=1";
    expect(safeProfileReturn(new URL(profileCompletionUrl(destination), "https://example.com").searchParams.get("returnTo"))).toBe(destination);
  });
  it("rejects external return destinations", () => {
    expect(safeProfileReturn("//example.com")).toBe("/dashboard");
  });
});