// One-off seed function to create test users. Disabled after seeding by checking SEED_TOKEN.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "chantal@test.com", password: "234567", name: "Chantal", country: "South Africa" },
  { email: "nick@test.com", password: "123456", name: "Nick", country: "South Africa" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results: any[] = [];
  for (const u of TEST_USERS) {
    // Check if user exists
    const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = existing?.users?.find((x: any) => x.email === u.email);

    let userId: string;
    if (found) {
      // Update password + metadata
      const { data: updated, error: updErr } = await supabase.auth.admin.updateUserById(found.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: { ...found.user_metadata, beta_tester: true, test_user: true },
      });
      if (updErr) {
        results.push({ email: u.email, status: "update_failed", error: updErr.message });
        continue;
      }
      userId = updated.user!.id;
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { beta_tester: true, test_user: true, name: u.name },
      });
      if (createErr) {
        results.push({ email: u.email, status: "create_failed", error: createErr.message });
        continue;
      }
      userId = created.user!.id;
    }

    // Ensure organisation row exists, fresh onboarding state
    const { data: existingOrg } = await supabase
      .from("organisations")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingOrg) {
      await supabase.from("organisations").insert({
        user_id: userId,
        name: `${u.name} Test Org`,
        country: u.country,
        onboarding_step: 0,
        onboarding_complete: false,
      });
    } else {
      await supabase
        .from("organisations")
        .update({ onboarding_step: 0, onboarding_complete: false })
        .eq("id", existingOrg.id);
    }

    results.push({ email: u.email, status: "ok", user_id: userId });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
