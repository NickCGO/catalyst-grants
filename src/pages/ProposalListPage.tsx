import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FileText, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ProposalListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      if (!org) { setLoading(false); return; }

      const { data } = await supabase
        .from("proposals")
        .select("*, applications(project_name, deadline, funder_id), funders(donor_name)")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });

      setProposals(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Proposal Writer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI-powered grant proposals tailored to each funder</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/writer/new")}>
            <Plus className="h-4 w-4 mr-1" /> New Proposal
          </Button>
        </div>

        {proposals.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No proposals yet. Find a grant and click "Apply" to start writing.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/grants")}>Browse Grants</Button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {proposals.map((p, i) => {
              const funderName = p.funders?.donor_name || "Unknown Funder";
              const project = p.applications?.project_name || "Proposal";
              const wordPct = p.target_word_count ? Math.min(100, Math.round(((p.word_count || 0) / p.target_word_count) * 100)) : 0;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <GlassCard className="p-4 hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/writer/${p.id}`)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground truncate">{funderName}</span>
                          <StatusBadge status={p.status || "draft"} />
                        </div>
                        <p className="text-xs text-muted-foreground">{project}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1 max-w-[200px]">
                            <Progress value={wordPct} className="h-1.5" />
                            <span className="text-[9px] text-muted-foreground">{p.word_count || 0}/{p.target_word_count || 2000} words</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      {p.ai_score && <MatchScoreRing score={p.ai_score} size="sm" />}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProposalListPage;
