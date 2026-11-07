import { describe, expect, it } from "vitest";
import { hasGenerationAccess, isConfirmedAdmin } from "../../supabase/functions/_shared/accessRules";
import { signState, verifyState, safeOrigin, safeReturnPath } from "../../supabase/functions/_shared/oauthState";
import { sanitizeDocument } from "../lib/sanitizeDocument";
import { webcrypto } from "node:crypto";

describe("critical security boundaries", () => {
  it("requires both confirmed email and a protected admin role", () => {
    expect(isConfirmedAdmin({}, "admin")).toBe(false);
    expect(isConfirmedAdmin({ email_confirmed_at: "2026-11-07" }, null)).toBe(false);
    expect(isConfirmedAdmin({ email_confirmed_at: "2026-11-07" }, "admin")).toBe(true);
  });
  it("preserves the seven-day, one-proposal trial and rejects expired plans", () => {
    const now = Date.parse("2026-11-07T00:00:00Z");
    expect(hasGenerationAccess({ created_at: "2026-11-01", proposals_used: 0 }, [], now)).toBe(true);
    expect(hasGenerationAccess({ created_at: "2026-10-31", proposals_used: 0 }, [], now)).toBe(false);
    expect(hasGenerationAccess({ created_at: "2026-11-01", proposals_used: 1 }, [], now)).toBe(false);
    expect(hasGenerationAccess({}, [{ status: "active", current_period_end: "2026-11-06" }], now)).toBe(false);
    expect(hasGenerationAccess({}, [{ status: "active", current_period_end: "2026-12-01" }], now)).toBe(true);
  });
  it("rejects tampered, expired, and cross-provider OAuth state", async () => {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
    const secret = "test-only-state-secret-with-at-least-32-characters";
    const now = Date.now();
    const state = { provider: "gmail", org_id: "00000000-0000-0000-0000-000000000001", user_id: "00000000-0000-0000-0000-000000000002", nonce: "00000000-0000-0000-0000-000000000003", exp: now + 600000, origin: "https://www.findthegrant.com", return_to: "/settings" };
    const signed = await signState(state, secret);
    expect(await verifyState(signed, "gmail", secret, now)).toEqual(state);
    await expect(verifyState(`x${signed}`, "gmail", secret, now)).rejects.toThrow();
    await expect(verifyState(signed, "outlook", secret, now)).rejects.toThrow();
    await expect(verifyState(signed, "gmail", secret, now + 600001)).rejects.toThrow();
  });
  it("rejects outside callback destinations", () => {
    expect(() => safeOrigin("https://attacker.example")).toThrow();
    expect(safeReturnPath("//attacker.example")).toBe("/settings");
    expect(safeReturnPath("/settings?tab=inboxes")).toBe("/settings?tab=inboxes");
  });
  it("strips executable content while retaining document structure", () => {
    const html = sanitizeDocument('<h2>Report</h2><script>alert(1)</script><img src=x onerror=alert(1)><svg onload=alert(1)></svg><a href="javascript:alert(1)">click</a><p onclick="alert(1)">Outcome</p><table><tr><td>42</td></tr></table>');
    expect(html).not.toMatch(/script|onerror|onload|onclick|javascript|<svg|<img/i);
    expect(html).toContain("<h2>Report</h2>");
    expect(html).toContain("<td>42</td>");
  });
});