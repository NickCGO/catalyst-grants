import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MatchScoreRing from "@/components/MatchScoreRing";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Globe, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

const FunderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [funder, setFunder] = useState<any>(null);
  const [windows, setWindows] = useState<any>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: f }, { data: w }] = await Promise.all([
        supabase.from("funders").select("*").eq("id", id).maybeSingle(),
        supabase.from("funder_windows").select("*").eq("funder_id", id).maybeSingle(),
      ]);
      setFunder(f);
      setWindows(w);

      if (user) {
        const { data: org } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
        if (org) {
          const { data: match } = await supabase.from("grant_matches").select("match_score").eq("org_id", org.id).eq("funder_id", id).maybeSingle();
          setMatchScore(match?.match_score || 0);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
      </div>
    </DashboardLayout>
  );

  if (!funder) return (
    <DashboardLayout>
      <div className="text-center py-12">
        <p className="text-muted-foreground">Funder not found</p>
        <Link to="/grants" className="text-primary text-sm mt-2 inline-block">← Back to Grants</Link>
      </div>
    </DashboardLayout>
  );

  const currentMonth = new Date().getMonth();
  const isOpen = windows ? windows[monthKeys[currentMonth]] : false;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/grants" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Grants
        </Link>

        <GlassCard hoverable={false}>
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="secondary" className="text-[10px] mb-2">{funder.category}</Badge>
              <h1 className="text-2xl font-bold text-foreground">{funder.donor_name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                {funder.geographical_area && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{funder.geographical_area}</span>}
                {funder.method_of_approach && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{funder.method_of_approach}</span>}
                {funder.application_period && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{funder.application_period}</span>}
              </div>
              {isOpen && <Badge className="bg-success/20 text-success mt-2">🟢 Open Now</Badge>}
            </div>
            <MatchScoreRing score={matchScore} size="lg" />
          </div>
        </GlassCard>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            {funder.funder_focus && (
              <GlassCard hoverable={false}>
                <h3 className="text-sm font-semibold text-foreground mb-2">What They Fund</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{funder.funder_focus}</p>
              </GlassCard>
            )}
            {windows && (
              <GlassCard hoverable={false}>
                <h3 className="text-sm font-semibold text-foreground mb-3">Application Windows</h3>
                <div className="grid grid-cols-12 gap-1">
                  {monthKeys.map((key, i) => (
                    <div key={key} className="text-center">
                      <span className="text-[9px] text-muted-foreground">{monthNames[i]}</span>
                      <div className={`h-6 rounded mt-1 ${windows[key] ? "bg-primary/60" : "bg-secondary/30"}`} />
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          <div className="space-y-4">
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-2">Contact</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                {funder.contact_person && <p className="flex items-center gap-2">{funder.contact_person}</p>}
                {funder.email && <p className="flex items-center gap-2"><Mail className="h-3 w-3" />{funder.email}</p>}
                {funder.telephone && <p className="flex items-center gap-2"><Phone className="h-3 w-3" />{funder.telephone}</p>}
                {funder.website && (
                  <a href={funder.website.startsWith("http") ? funder.website : `https://${funder.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <Globe className="h-3 w-3" /> Website
                  </a>
                )}
              </div>
            </GlassCard>
            <Button className="w-full bg-primary text-primary-foreground">Start Application</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FunderDetailPage;
