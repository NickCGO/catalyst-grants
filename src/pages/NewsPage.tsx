import { useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, TrendingUp, AlertCircle, Globe, Bookmark, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Button } from "@/components/ui/button";

const newsItems = [
  { title: "National Lotteries Commission Opens New Funding Round", summary: "The NLC has announced a new round of grant funding for community development and arts organisations. Applications are open until May 2026.", category: "Funding Alert", date: "Mar 22, 2026", tags: ["community", "arts", "south africa"] },
  { title: "South African NPO Act Amendment Takes Effect", summary: "New compliance requirements for NPOs come into effect in April 2026, including stricter reporting standards and governance requirements.", category: "Policy Update", date: "Mar 20, 2026", tags: ["policy", "south africa", "compliance"] },
  { title: "EU Announces €50M Fund for African Climate Resilience", summary: "The European Union has launched a new climate fund targeting community-based organisations working in climate adaptation and food security.", category: "Funding Alert", date: "Mar 18, 2026", tags: ["environment", "agriculture", "international"] },
  { title: "USAID Shifts Focus to Youth-Led Organisations", summary: "USAID's new strategy prioritises direct funding to youth-led organisations in sub-Saharan Africa, with simplified application processes.", category: "Sector News", date: "Mar 15, 2026", tags: ["youth", "international", "education"] },
  { title: "DG Murray Trust Publishes Impact Report 2025", summary: "The annual report highlights R180M in grants distributed and announces expanded focus on early childhood development for 2026.", category: "Sector News", date: "Mar 12, 2026", tags: ["education", "ecd", "south africa"] },
  { title: "New Tax Benefits for Corporate Donors in South Africa", summary: "Treasury has announced enhanced Section 18A benefits, encouraging increased corporate social investment spending for 2026/27.", category: "Policy Update", date: "Mar 10, 2026", tags: ["policy", "corporate", "south africa"] },
  { title: "African Union Grant Portal Launches for Civil Society", summary: "A new centralised portal enables CSOs across Africa to discover and apply for AU-backed funding opportunities.", category: "Capacity Building", date: "Mar 8, 2026", tags: ["capacity", "international", "technology"] },
  { title: "World Bank Increases Sub-Saharan Africa Education Budget", summary: "An additional $2.1B has been allocated for education infrastructure and teacher training programmes across 15 African countries.", category: "Funding Alert", date: "Mar 5, 2026", tags: ["education", "international", "youth"] },
];

const fundingAlerts = [
  { funder: "Anglo American Chairman's Fund", areas: ["Education", "Health"], score: 91 },
  { funder: "Nedbank Foundation", areas: ["Education", "Youth"], score: 78 },
  { funder: "National Lotteries Commission", areas: ["Community Dev", "Arts"], score: 88 },
  { funder: "ABSA Foundation", areas: ["Education", "Skills"], score: 82 },
  { funder: "Standard Bank Foundation", areas: ["Education", "Youth"], score: 80 },
];

const categoryBadge: Record<string, string> = {
  "Funding Alert": "bg-success/15 text-success",
  "Policy Update": "bg-accent-amber/15 text-accent-amber",
  "Sector News": "bg-primary/15 text-primary",
  "Capacity Building": "bg-purple-500/15 text-purple-400",
  "Research": "bg-accent-teal/15 text-accent-teal",
};

const orgFocusTags = ["education", "youth", "community", "south africa", "health"];

const NewsPage = () => {
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" /> NGO News Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Funding alerts, policy updates, and sector news for African NGOs
          </p>
        </div>

        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1 space-y-4">
            {newsItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5 ${categoryBadge[item.category] || "bg-muted text-muted-foreground"}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                    </div>
                    <button
                      onClick={() => setBookmarked(prev => {
                        const s = new Set(prev);
                        s.has(i) ? s.delete(i) : s.add(i);
                        return s;
                      })}
                      className={`text-muted-foreground hover:text-primary transition-colors ${bookmarked.has(i) ? "text-primary" : ""}`}
                    >
                      <Bookmark className={`h-4 w-4 ${bookmarked.has(i) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{item.summary}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className={`text-[9px] px-2 py-0.5 rounded-full ${
                          orgFocusTags.includes(tag)
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Funding Alerts Sidebar */}
          <div className="w-72 shrink-0 hidden lg:block">
            <GlassCard hoverable={false} className="sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-success" />
                <h3 className="text-sm font-semibold text-foreground">Open This Month</h3>
              </div>
              <div className="space-y-3">
                {fundingAlerts.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer">
                    <MatchScoreRing score={f.score} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{f.funder}</div>
                      <div className="flex gap-1 mt-0.5">
                        {f.areas.map(a => (
                          <span key={a} className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-3 text-xs text-primary">View all grants →</Button>
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewsPage;
