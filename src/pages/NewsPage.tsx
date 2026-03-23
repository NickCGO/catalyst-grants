import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Newspaper, TrendingUp, AlertCircle, Globe } from "lucide-react";

const newsItems = [
  {
    title: "National Lotteries Commission Opens New Funding Round",
    summary: "The NLC has announced a new round of grant funding for community development and arts organisations. Applications are open until May 2026.",
    category: "Funding Alert",
    date: "Mar 22, 2026",
    icon: TrendingUp,
    color: "text-success",
  },
  {
    title: "South African NPO Act Amendment Takes Effect",
    summary: "New compliance requirements for NPOs come into effect in April 2026, including stricter reporting standards and governance requirements.",
    category: "Policy Update",
    date: "Mar 20, 2026",
    icon: AlertCircle,
    color: "text-accent-amber",
  },
  {
    title: "EU Announces €50M Fund for African Climate Resilience",
    summary: "The European Union has launched a new climate fund targeting community-based organisations working in climate adaptation and food security.",
    category: "Funding Alert",
    date: "Mar 18, 2026",
    icon: TrendingUp,
    color: "text-success",
  },
  {
    title: "USAID Shifts Focus to Youth-Led Organisations",
    summary: "USAID's new strategy prioritises direct funding to youth-led organisations in sub-Saharan Africa, with simplified application processes.",
    category: "Sector News",
    date: "Mar 15, 2026",
    icon: Globe,
    color: "text-primary",
  },
  {
    title: "DG Murray Trust Publishes Impact Report 2025",
    summary: "The annual report highlights R180M in grants distributed and announces expanded focus on early childhood development for 2026.",
    category: "Sector News",
    date: "Mar 12, 2026",
    icon: Globe,
    color: "text-primary",
  },
  {
    title: "New Tax Benefits for Corporate Donors in South Africa",
    summary: "Treasury has announced enhanced Section 18A benefits, encouraging increased corporate social investment spending for 2026/27.",
    category: "Policy Update",
    date: "Mar 10, 2026",
    icon: AlertCircle,
    color: "text-accent-amber",
  },
];

const categoryBadge: Record<string, string> = {
  "Funding Alert": "bg-success/15 text-success",
  "Policy Update": "bg-accent-amber/15 text-accent-amber",
  "Sector News": "bg-primary/15 text-primary",
};

const NewsPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" /> NGO News Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay informed about funding opportunities and sector updates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsItems.map((item, i) => (
            <GlassCard key={i} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5 ${categoryBadge[item.category]}`}>
                  {item.category}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">{item.date}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground flex-1">{item.summary}</p>
              <button className="text-xs text-primary mt-3 text-left hover:underline">Read more →</button>
            </GlassCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewsPage;
