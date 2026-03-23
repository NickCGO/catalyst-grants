import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FileText, Sparkles, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import MatchScoreRing from "@/components/MatchScoreRing";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ProposalItem {
  id: string;
  funder: string;
  project: string;
  status: string;
  aiScore: number | null;
  wordCount: number;
  targetWordCount: number;
  lastEdited: string;
  deadline: string;
}

const sampleProposals: ProposalItem[] = [
  { id: "1", funder: "DG Murray Trust", project: "Youth Education Initiative", status: "draft", aiScore: null, wordCount: 450, targetWordCount: 2000, lastEdited: "2 hours ago", deadline: "Apr 1, 2026" },
  { id: "2", funder: "Anglo American Chairman's Fund", project: "Community Health Programme", status: "ai_review", aiScore: 72, wordCount: 1800, targetWordCount: 2000, lastEdited: "1 day ago", deadline: "Apr 15, 2026" },
  { id: "3", funder: "Ford Foundation", project: "Gender Justice Project", status: "human_review", aiScore: 85, wordCount: 2100, targetWordCount: 2000, lastEdited: "3 days ago", deadline: "Jun 30, 2026" },
  { id: "4", funder: "National Lotteries Commission", project: "Sports for Change", status: "approved", aiScore: 91, wordCount: 2000, targetWordCount: 2000, lastEdited: "5 days ago", deadline: "Mar 15, 2026" },
];

const ProposalListPage = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Proposal Writer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered grant proposals tailored to each funder
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate("/writer/new")}
          >
            <Plus className="h-4 w-4 mr-1" /> New Proposal
          </Button>
        </div>

        {sampleProposals.length === 0 ? (
          <GlassCard className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No proposals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Find a grant and click "Apply" to start writing your first proposal.
            </p>
            <Button onClick={() => navigate("/grants")} className="bg-primary text-primary-foreground">
              Browse Grants <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {sampleProposals.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/writer/${p.id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{p.funder}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.project}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex-1 max-w-[200px]">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{p.wordCount.toLocaleString()} / {p.targetWordCount.toLocaleString()} words</span>
                          <span>{Math.round((p.wordCount / p.targetWordCount) * 100)}%</span>
                        </div>
                        <Progress value={(p.wordCount / p.targetWordCount) * 100} className="h-1.5" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Edited {p.lastEdited}</span>
                      <span className="text-[10px] text-muted-foreground">Due {p.deadline}</span>
                    </div>
                  </div>
                  {p.aiScore !== null && <MatchScoreRing score={p.aiScore} size="md" />}
                  <Button variant="ghost" size="sm" className="text-xs text-primary shrink-0">
                    Continue →
                  </Button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProposalListPage;
