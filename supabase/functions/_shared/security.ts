import { createClient } from "npm:@supabase/supabase-js@2";
import { hasGenerationAccess, isConfirmedAdmin } from "./accessRules.ts";

export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new AccessError(500, "Service unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function requireUser(req: Request) {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) throw new AccessError(401, "Please sign in");
  const admin = serviceClient();
  const { data, error } = await admin.auth.getUser(header.slice(7));
  if (error || !data.user) throw new AccessError(401, "Please sign in");
  return { user: data.user, admin };
}
export async function requireAdmin(req: Request) {
  const result = await requireUser(req);
  const { data, error } = await result.admin.from("user_roles").select("role").eq("user_id", result.user.id).eq("role", "admin").maybeSingle();
  if (error || !isConfirmedAdmin(result.user, data?.role ?? null)) throw new AccessError(403, "Staff access required");
  return result;
}
export async function requireOrgAccess(admin: ReturnType<typeof serviceClient>, userId: string, orgId: unknown, edit = false) {
  if (typeof orgId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) throw new AccessError(400, "Valid organisation required");
  const { data: org, error } = await admin.from("organisations").select("*").eq("id", orgId).maybeSingle();
  if (error || !org) throw new AccessError(403, "Organisation access denied");
  if (org.user_id !== userId) {
    const { data: member, error: memberError } = await admin.from("team_members").select("role").eq("org_id", orgId).eq("user_id", userId).eq("status", "active").maybeSingle();
    if (memberError || !member || (edit && !["owner", "admin", "editor"].includes(member.role))) throw new AccessError(403, "Organisation access denied");
  }
  return org;
}
export async function requireAI(admin: ReturnType<typeof serviceClient>, org: any) {
  const { data, error } = await admin.from("subscriptions").select("status,current_period_end").eq("user_id", org.user_id).in("environment", ["sandbox", "live"]);
  if (error || !hasGenerationAccess(org, data || [])) throw new AccessError(402, "An active plan or available trial is required");
  const { data: allowed, error: limitError } = await admin.rpc("reserve_ai_call", { _org_id: org.id });
  if (limitError || !allowed) throw new AccessError(429, "Daily AI limit reached. Please try tomorrow.");
}
export function accessResponse(error: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify({ error: error instanceof AccessError ? error.message : "Service unavailable" }), { status: error instanceof AccessError ? error.status : 500, headers: { ...headers, "Content-Type": "application/json" } });
}