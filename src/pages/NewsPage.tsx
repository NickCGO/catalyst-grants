import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, Bookmark, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation } from "@/hooks/useAuth";
import { callAI } from "@/lib/ai";

const categoryBadge: Record<string, string> = {
  "Funding Alert": "bg-success/15 text-success",
  "Policy Update": "bg-accent-amber/15 text-accent-amber",
  "Sector News": "bg-primary/15 text-primary",
  "Capacity Building": "bg-purple-500/15 text-purple-400",
  "Research": "bg-accent-teal/15 text-accent-teal",
};

const NewsPage = () => {
  const { org } = useOrganisation();
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [fundingAlerts, setFundingAlerts] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  // Load funding alerts from real data — funders open this month
  useEffect(() => {
    const loadAlerts = async () => {
      const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const currentMonth = months[new Date().getMonth()];
      const { data } = await supabase
        .from("funder_windows")
        .select("funder_id, donor_name")
        .eq(currentMonth, true)
        .limit(10);
      if (data && data.length > 0) {
        // Get match scores if org exists
        let matchMap: Record<string, number> = {};
        if (org) {
          const funderIds = data.map(d => d.funder_id).filter(Boolean);
          const { data: matches } = await supabase
            .from("grant_matches")
            .select("funder_id, match_score")
            .eq("org_id", org.id)
            .in("funder_id", funderIds);
          (matches || []).forEach(m => { matchMap[m.funder_id] = m.match_score || 0; });
        }
        // Get focus areas
        const funderIds = data.map(d => d.funder_id).filter(Boolean);
        const { data: focusData } = await supabase
          .from("funder_focus_areas")
          .select("funder_id, children, youth, education_ecd, women_gender_dv_girls, health_aids_sexual_reproductive, community_development")
          .in("funder_id", funderIds);
        const focusMap: Record<string, string[]> = {};
        (focusData || []).forEach(f => {
          const areas: string[] = [];
          if (f.children) areas.push("Children");
          if (f.youth) areas.push("Youth");
          if (f.education_ecd) areas.push("Education");
          if (f.women_gender_dv_girls) areas.push("Women");
          if (f.health_aids_sexual_reproductive) areas.push("Health");
          if (f.community_development) areas.push("Community");
          focusMap[f.funder_id!] = areas;
        });

        setFundingAlerts(data.map(d => ({
          funder: d.donor_name,
          funderId: d.funder_id,
          areas: focusMap[d.funder_id!] || [],
          score: matchMap[d.funder_id!] || 0,
        })));
      }
      setLoadingAlerts(false);
    };
    loadAlerts();
  }, [org]);

  // Generate AI news based on org focus
  useEffect(() => {
    const loadNews = async () => {
      try {
        const focusContext = org?.focus_areas?.join(", ") || "education, youth, community development";
        const result = await callAI([
          { role: "system", content: "Generate 6 realistic, current-sounding news items for African NGO professionals. Return ONLY a JSON array." },
          { role: "user", content: `Generate 6 news items relevant to an NGO focused on: ${focusContext}, based in ${org?.country || "South Africa"}. Categories: Funding Alert, Policy Update, Sector News, Capacity Building. Each item: {"title":"...","category":"...","summary":"Two sentences.","date":"Mar 2026","tags":["..."]}. Return JSON array only.` },
        ]);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          setNewsItems(JSON.parse(jsonMatch[0]));
        }
      } catch {
        // Fallback static news
        setNewsItems([
          { title: "New Funding Rounds Open for African NGOs", category: "Funding Alert", summary: "Multiple funders have opened their application windows for Q1 2026. Check the Grants page for matched opportunities.", date: "Mar 2026", tags: ["funding", "africa"] },
          { title: "South African NPO Compliance Updates", category: "Policy Update", summary: "New reporting requirements come into effect for registered NPOs. Ensure your organisation is compliant.", date: "Mar 2026", tags: ["policy", "south africa"] },
        ]);
      }
      setLoadingNews(false);
    };
    loadNews();
  }, [org]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" /> NGO News Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Funding alerts, policy updates, and sector news for African NGOs</p>
        </div>

        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1 space-y-4">
            {loadingNews ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : newsItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5 ${categoryBadge[item.category] || "bg-muted text-muted-foreground"}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                    </div>
                    <button onClick={() => setBookmarked(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                      className={`text-muted-foreground hover:text-primary transition-colors ${bookmarked.has(i) ? "text-primary" : ""}`}>
                      <Bookmark className={`h-4 w-4 ${bookmarked.has(i) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{item.summary}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(item.tags || []).map((tag: string) => (
                      <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                        (org?.focus_areas || []).some((f: string) => f.toLowerCase().includes(tag.toLowerCase()))
                          ? "bg-primary/10 border-primary/30 text-primary" : "border-border/30 text-muted-foreground"
                      }`}>{tag}</span>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Funding Alerts Sidebar */}
          <div className="w-72 hidden lg:block space-y-3">
            <h3 className="text-sm font-semibold text-foreground mb-2">🔔 Open This Month</h3>
            {loadingAlerts ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
            ) : fundingAlerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No funders open this month.</p>
            ) : fundingAlerts.map((alert, i) => (
              <GlassCard key={i} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-medium text-foreground line-clamp-2">{alert.funder}</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {alert.areas.slice(0, 2).map((a: string) => (
                        <span key={a} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{a}</span>
                      ))}
                    </div>
                  </div>
                  {alert.score > 0 && <MatchScoreRing score={alert.score} size="sm" />}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewsPage;
