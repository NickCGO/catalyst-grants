import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["founders@grantmatch.co.za", "admin@grantmatch.co.za", "info@nickfernandes.co.za", "hello@chantalehlen.com"];

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

      case "create_user": {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: params.email,
          password: params.password,
          email_confirm: true,
          user_metadata: params.metadata || {},
        });
        if (createErr) throw createErr;
        return new Response(JSON.stringify(newUser), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

      case "org_activity": {
        const days = Number(params.days) || 30;
        const since = new Date(Date.now() - days * 86400000).toISOString();

        const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (usersErr) throw usersErr;
        const users = usersData?.users || [];

        const { data: orgs, error: orgsErr } = await supabase
          .from("organisations")
          .select("id, name, user_id, created_at, proposals_used, trial_started_at, country, focus_areas");
        if (orgsErr) throw orgsErr;

        const { data: sessions, error: sessErr } = await supabase
          .from("analytics_sessions")
          .select("id, user_id, visitor_id, started_at, last_seen_at, duration_seconds, landing_path, device_type, browser, country, referrer, utm_source")
          .gte("started_at", since)
          .order("started_at", { ascending: false })
          .limit(10000);
        if (sessErr) throw sessErr;

        const { data: views, error: viewsErr } = await supabase
          .from("analytics_page_views")
          .select("id, session_id, path, created_at")
          .gte("created_at", since)
          .limit(20000);
        if (viewsErr) throw viewsErr;

        const orgIds = (orgs || []).map((o: any) => o.id);
        const placeholder = ["00000000-0000-0000-0000-000000000000"];
        const [propsRes, appsRes] = await Promise.all([
          supabase.from("proposals").select("id, org_id").in("org_id", orgIds.length ? orgIds : placeholder),
          supabase.from("applications").select("id, org_id").in("org_id", orgIds.length ? orgIds : placeholder),
        ]);
        const proposals = propsRes.data || [];
        const applications = appsRes.data || [];

        const sessionUser = new Map<string, string | null>();
        (sessions || []).forEach((s: any) => sessionUser.set(s.id, s.user_id));

        const userSessions = new Map<string, any[]>();
        (sessions || []).forEach((s: any) => {
          if (!s.user_id) return;
          if (!userSessions.has(s.user_id)) userSessions.set(s.user_id, []);
          userSessions.get(s.user_id)!.push(s);
        });
        const userViews = new Map<string, any[]>();
        (views || []).forEach((v: any) => {
          const uid = sessionUser.get(v.session_id);
          if (!uid) return;
          if (!userViews.has(uid)) userViews.set(uid, []);
          userViews.get(uid)!.push(v);
        });

        const orgByUser = new Map<string, any>();
        (orgs || []).forEach((o: any) => { if (o.user_id) orgByUser.set(o.user_id, o); });

        const rows = users.map((u: any) => {
          const org = orgByUser.get(u.id);
          const uSessions = userSessions.get(u.id) || [];
          const uViews = userViews.get(u.id) || [];
          const orgProposals = org ? proposals.filter((p: any) => p.org_id === org.id) : [];
          const orgApplications = org ? applications.filter((a: any) => a.org_id === org.id) : [];

          const pathCount = new Map<string, number>();
          uViews.forEach((v: any) => pathCount.set(v.path, (pathCount.get(v.path) || 0) + 1));
          const topPaths = Array.from(pathCount.entries())
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

          const lastSeenAt = uSessions.reduce((m: string | null, s: any) => {
            const t = s.last_seen_at || s.started_at;
            return !m || (t && t > m) ? t : m;
          }, null);

          const daysSinceSignIn = u.last_sign_in_at
            ? Math.floor((Date.now() - new Date(u.last_sign_in_at).getTime()) / 86400000)
            : null;

          let activity_status: string;
          if (!u.last_sign_in_at) activity_status = "never_signed_in";
          else if (daysSinceSignIn !== null && daysSinceSignIn <= 7) activity_status = "active";
          else if (daysSinceSignIn !== null && daysSinceSignIn <= 30) activity_status = "recent";
          else activity_status = "dormant";

          return {
            user_id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            days_since_sign_in: daysSinceSignIn,
            activity_status,
            beta_tester: !!u.user_metadata?.beta_tester,
            org: org ? {
              id: org.id,
              name: org.name,
              created_at: org.created_at,
              country: org.country,
              sector: org.sector,
              proposals_used: org.proposals_used,
            } : null,
            sessions_count: uSessions.length,
            page_views_count: uViews.length,
            last_seen_at: lastSeenAt,
            total_duration_seconds: uSessions.reduce((a: number, s: any) => a + (Number(s.duration_seconds) || 0), 0),
            proposals_count: orgProposals.length,
            applications_count: orgApplications.length,
            top_paths: topPaths,
            recent_sessions: uSessions.slice(0, 10).map((s: any) => ({
              started_at: s.started_at,
              last_seen_at: s.last_seen_at,
              duration_seconds: s.duration_seconds,
              landing_path: s.landing_path,
              device_type: s.device_type,
              browser: s.browser,
              country: s.country,
              source: s.utm_source || (s.referrer ? (() => { try { return new URL(s.referrer).hostname; } catch { return "Direct"; } })() : "Direct"),
            })),
          };
        });

        const summary = {
          window_days: days,
          total_users: users.length,
          total_orgs: orgs?.length || 0,
          never_signed_in: rows.filter((r: any) => r.activity_status === "never_signed_in").length,
          active_7d: rows.filter((r: any) => r.activity_status === "active").length,
          recent_30d: rows.filter((r: any) => r.activity_status === "recent").length,
          dormant: rows.filter((r: any) => r.activity_status === "dormant").length,
          orgs_with_activity: rows.filter((r: any) => r.org && r.sessions_count > 0).length,
          orgs_no_activity: rows.filter((r: any) => r.org && r.sessions_count === 0).length,
        };

        return new Response(JSON.stringify({ summary, rows }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
