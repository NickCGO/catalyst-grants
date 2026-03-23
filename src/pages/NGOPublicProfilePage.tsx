import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MatchScoreRing from "@/components/MatchScoreRing";
import { MapPin, Globe, Users, Shield, Send } from "lucide-react";

const NGOPublicProfilePage = () => {
  const { orgId } = useParams();

  const profile = {
    name: "Horizon Youth Foundation",
    tagline: "Empowering Cape Town's youth through education and sport",
    mission: "We empower young people aged 13-24 in the Cape Flats through structured after-school programmes, leadership development, and sports-based interventions to build resilience and life skills.",
    country: "South Africa",
    regions: ["Western Cape"],
    size: "small (6-20)",
    founded: 2014,
    focusAreas: ["Youth", "Education/ECD", "Sports", "Community Dev"],
    programmes: ["After School Programme", "Youth Leadership Academy", "Sports for Change"],
    website: "https://horizonyouth.org.za",
    appetite: "open",
    statement: "Looking for partners with health programming to submit joint applications. We bring strong community relationships in Cape Flats.",
    strengths: ["Community relationships", "Beneficiary networks", "Geographic reach"],
    verified: true,
    completeness: 92,
    totalApps: 14,
    successCount: 6,
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <GlassCard hoverable={false}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">HY</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-foreground">{profile.name}</h1>
                  {profile.verified && <Shield className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{profile.tagline}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.regions.join(", ")}, {profile.country}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{profile.size}</span>
                  <span>Est. {profile.founded}</span>
                </div>
              </div>
            </div>
            <Button className="gap-1"><Send className="h-3.5 w-3.5" /> Request Partnership</Button>
          </div>
        </GlassCard>

        <div className="grid grid-cols-3 gap-4">
          <GlassCard hoverable={false} className="text-center">
            <div className="text-2xl font-bold text-foreground">{profile.totalApps}</div>
            <div className="text-xs text-muted-foreground">Applications</div>
          </GlassCard>
          <GlassCard hoverable={false} className="text-center">
            <div className="text-2xl font-bold text-green-400">{profile.successCount}</div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </GlassCard>
          <GlassCard hoverable={false} className="text-center">
            <div className="text-2xl font-bold text-primary">{profile.completeness}%</div>
            <div className="text-xs text-muted-foreground">Profile Complete</div>
          </GlassCard>
        </div>

        <GlassCard hoverable={false}>
          <h3 className="text-sm font-semibold text-foreground mb-2">Mission</h3>
          <p className="text-xs text-muted-foreground">{profile.mission}</p>
        </GlassCard>

        <GlassCard hoverable={false}>
          <h3 className="text-sm font-semibold text-foreground mb-3">Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {profile.focusAreas.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}
          </div>
        </GlassCard>

        <GlassCard hoverable={false}>
          <h3 className="text-sm font-semibold text-foreground mb-3">Programmes</h3>
          <div className="space-y-2">
            {profile.programmes.map(p => (
              <div key={p} className="p-2.5 rounded-lg border border-border/30 text-xs text-foreground">{p}</div>
            ))}
          </div>
        </GlassCard>

        <GlassCard hoverable={false}>
          <h3 className="text-sm font-semibold text-foreground mb-2">Partnership Statement</h3>
          <p className="text-xs text-muted-foreground italic">"{profile.statement}"</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.strengths.map(s => (
              <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
            ))}
          </div>
        </GlassCard>

        {profile.website && (
          <GlassCard hoverable={false}>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{profile.website}</a>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NGOPublicProfilePage;
