export function isConfirmedAdmin(user: { email_confirmed_at?: string | null }, role: string | null) {
  return Boolean(user.email_confirmed_at) && role === "admin";
}

export function hasGenerationAccess(org: { trial_started_at?: string | null; created_at?: string | null; proposals_used?: number | null }, subscriptions: Array<{ status: string; current_period_end?: string | null }>, now = Date.now()) {
  if (subscriptions.some(s => ["active", "trialing", "past_due"].includes(s.status) && (!s.current_period_end || Date.parse(s.current_period_end) > now))) return true;
  const start = Date.parse(org.trial_started_at || org.created_at || "");
  return Number.isFinite(start) && now >= start && now - start < 7 * 86400000 && (org.proposals_used ?? 0) < 1;
}