import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["founders@grantmatch.co.za", "admin@grantmatch.co.za"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "list_users": {
        const page = params.page || 1;
        const perPage = params.perPage || 50;
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "get_user": {
        const { data, error } = await supabase.auth.admin.getUserById(params.userId);
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_user_metadata": {
        const { data, error } = await supabase.auth.admin.updateUserById(params.userId, {
          user_metadata: params.metadata,
        });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete_user": {
        const { error } = await supabase.auth.admin.deleteUser(params.userId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "toggle_beta": {
        const { data: existing } = await supabase.auth.admin.getUserById(params.userId);
        const currentMeta = existing?.user?.user_metadata || {};
        const { data, error } = await supabase.auth.admin.updateUserById(params.userId, {
          user_metadata: { ...currentMeta, beta_tester: !currentMeta.beta_tester },
        });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "platform_stats": {
        const [users, waitlist, funders, orgs, proposals, applications] = await Promise.all([
          supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
          supabase.from("waitlist").select("id", { count: "exact", head: true }),
          supabase.from("funders").select("id", { count: "exact", head: true }),
          supabase.from("organisations").select("id", { count: "exact", head: true }),
          supabase.from("proposals").select("id", { count: "exact", head: true }),
          supabase.from("applications").select("id", { count: "exact", head: true }),
        ]);
        return new Response(JSON.stringify({
          totalUsers: users.data?.users?.length || 0,
          totalWaitlist: waitlist.count || 0,
          totalFunders: funders.count || 0,
          totalOrgs: orgs.count || 0,
          totalProposals: proposals.count || 0,
          totalApplications: applications.count || 0,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_funder": {
        const { funderId, updates } = params;
        const { data, error } = await supabase.from("funders").update(updates).eq("id", funderId).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete_funder": {
        const { error } = await supabase.from("funders").delete().eq("id", params.funderId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "add_funder": {
        const { data, error } = await supabase.from("funders").insert(params.funder).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list_waitlist": {
        const { data, error } = await supabase.from("waitlist").select("*").order("created_at", { ascending: false }).limit(500);
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete_waitlist_entry": {
        const { error } = await supabase.from("waitlist").delete().eq("id", params.entryId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "promote_to_beta": {
        // Find auth user by email, set beta_tester: true
        const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = users?.users?.find((u: any) => u.email === params.email);
        if (!found) {
          return new Response(JSON.stringify({ error: "User not found in auth. They need to create an account first." }), { status: 404, headers: corsHeaders });
        }
        const { data, error } = await supabase.auth.admin.updateUserById(found.id, {
          user_metadata: { ...found.user_metadata, beta_tester: true },
        });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
