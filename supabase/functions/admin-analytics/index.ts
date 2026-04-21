import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["founders@grantmatch.co.za", "admin@grantmatch.co.za", "info@nickfernandes.co.za", "hello@chantalehlen.com"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [sessionsRes, pagesRes] = await Promise.all([
      admin.from("analytics_sessions").select("*").gte("started_at", since).order("started_at", { ascending: false }).limit(5000),
      admin.from("analytics_page_views").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(10000),
    ]);

    const sessions = sessionsRes.data || [];
    const pageViews = pagesRes.data || [];

    // Derive a usable duration: prefer stored duration_seconds, fall back to (last_seen_at - started_at)
    const sessionDuration = (s: any): number => {
      const stored = Number(s.duration_seconds || 0);
      if (stored > 0) return stored;
      if (s.last_seen_at && s.started_at) {
        const diff = Math.round(
          (new Date(s.last_seen_at).getTime() - new Date(s.started_at).getTime()) / 1000
        );
        return diff > 0 ? diff : 0;
      }
      return 0;
    };

    const uniqueVisitors = new Set(sessions.map((s: any) => s.visitor_id)).size;
    const totalSessions = sessions.length;
    const totalPageViews = pageViews.length;
    const avgDuration = sessions.length
      ? Math.round(sessions.reduce((a: number, s: any) => a + sessionDuration(s), 0) / sessions.length)
      : 0;
    const bounces = sessions.filter((s: any) => {
      const pv = pageViews.filter((p: any) => p.session_id === s.id).length;
      return pv <= 1;
    }).length;
    const bounceRate = sessions.length ? Math.round((bounces / sessions.length) * 100) : 0;

    const tally = (arr: any[], key: string) => {
      const map = new Map<string, number>();
      arr.forEach((item) => {
        const k = item[key] || "Unknown";
        map.set(k, (map.get(k) || 0) + 1);
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    };

    const referrers = tally(
      sessions.map((s: any) => ({ ref: s.utm_source || (s.referrer ? new URL(s.referrer).hostname : "Direct") })),
      "ref"
    );
    const devices = tally(sessions, "device_type");
    const browsers = tally(sessions, "browser");
    const countries = tally(sessions, "country");
    const topPages = tally(pageViews, "path").slice(0, 20);

    // Daily series
    const daily = new Map<string, { date: string; sessions: number; pageViews: number; visitors: Set<string> }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      daily.set(d, { date: d, sessions: 0, pageViews: 0, visitors: new Set() });
    }
    sessions.forEach((s: any) => {
      const d = (s.started_at as string).slice(0, 10);
      const entry = daily.get(d);
      if (entry) { entry.sessions++; entry.visitors.add(s.visitor_id); }
    });
    pageViews.forEach((p: any) => {
      const d = (p.created_at as string).slice(0, 10);
      const entry = daily.get(d);
      if (entry) entry.pageViews++;
    });
    const dailySeries = Array.from(daily.values()).map((e) => ({
      date: e.date,
      sessions: e.sessions,
      pageViews: e.pageViews,
      visitors: e.visitors.size,
    }));

    // Avg engagement per (unique) visitor
    const totalDuration = sessions.reduce((a: number, s: any) => a + (s.duration_seconds || 0), 0);
    const avgEngagementPerVisitor = uniqueVisitors ? Math.round(totalDuration / uniqueVisitors) : 0;

    // Activity heatmap: day-of-week (0=Sun..6=Sat) x hour (0..23), based on page views (UTC)
    const heatmap: { day: number; hour: number; count: number }[] = [];
    const hmMap = new Map<string, number>();
    pageViews.forEach((p: any) => {
      const d = new Date(p.created_at);
      const key = `${d.getUTCDay()}-${d.getUTCHours()}`;
      hmMap.set(key, (hmMap.get(key) || 0) + 1);
    });
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmap.push({ day, hour, count: hmMap.get(`${day}-${hour}`) || 0 });
      }
    }

    return new Response(
      JSON.stringify({
        summary: { uniqueVisitors, totalSessions, totalPageViews, avgDuration, bounceRate, avgEngagementPerVisitor },
        dailySeries, referrers, devices, browsers, countries, topPages, heatmap,
        recentSessions: sessions.slice(0, 50),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
