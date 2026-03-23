import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MatchScoreRing from "@/components/MatchScoreRing";
import StatusBadge from "@/components/StatusBadge";
import { ArrowLeft, Globe, Mail, Phone, MapPin, Calendar, FileText, Users, ExternalLink } from "lucide-react";

const FunderDetailPage = () => {
  const { id } = useParams();

  const funder = {
    name: "DG Murray Trust",
    category: "SA Trusts/ Foundations",
    matchScore: 85,
    focusAreas: ["Education", "Youth", "Capacity Building", "Research"],
    applicationPeriod: "Open year-round",
    geography: "National",
    method: "Concept Note",
    funderFocus: "The DG Murray Trust invests in education innovation and leadership development. They fund programmes that improve the quality of life for South Africans through systemic change in education, justice and governance. Priority areas include Early Childhood Development, education quality improvement, leadership pipelines and innovation ecosystems.",
    contact: "Grants Manager",
    email: "grants@dgmt.co.za",
    telephone: "+27 21 000 0000",
    website: "https://dgmt.co.za",
    address: "Cape Town, Western Cape, South Africa",
    openMonths: [true, true, true, true, true, true, true, true, true, true, true, true],
    isOpen: true,
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
              <h1 className="text-2xl font-bold text-foreground">{funder.name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{funder.geography}</span>
                <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{funder.method}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{funder.applicationPeriod}</span>
              </div>
            </div>
            <MatchScoreRing score={funder.matchScore} size="lg" />
          </div>
        </GlassCard>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-2">What They Fund</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{funder.funderFocus}</p>
            </GlassCard>

            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-3">Focus Areas</h3>
              <div className="flex flex-wrap gap-2">
                {funder.focusAreas.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}
              </div>
            </GlassCard>

            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-3">Application Calendar</h3>
              <div className="grid grid-cols-12 gap-1">
                {monthNames.map((m, i) => (
                  <div key={m} className={`p-2 rounded text-center text-[10px] border ${funder.openMonths[i] ? "bg-primary/10 border-primary/30 text-primary" : "border-border/30 text-muted-foreground"}`}>
                    {m}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-4">
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-3">Contact</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-3 w-3" />{funder.contact}</div>
                {funder.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" />{funder.email}</div>}
                {funder.telephone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" />{funder.telephone}</div>}
                {funder.website && (
                  <a href={funder.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <Globe className="h-3 w-3" /> Visit Website <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" />{funder.address}</div>
              </div>
            </GlassCard>

            <Button className="w-full gap-1">Start Application →</Button>
            <Button variant="outline" className="w-full gap-1"><Users className="h-3.5 w-3.5" /> Find Partners</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FunderDetailPage;
