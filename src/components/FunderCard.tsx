import MatchScoreRing from "./MatchScoreRing";
import GlassCard from "./GlassCard";
import { Globe, Calendar, FileText, Mail, ExternalLink, Bookmark, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FunderCardProps {
  name: string;
  category: string;
  focusAreas: string[];
  applicationPeriod: string;
  geography: string;
  method: string;
  contact?: string;
  email?: string;
  funderFocus?: string;
  matchScore: number;
  isGeneral?: boolean;
  isOpen?: boolean;
  onSave?: () => void;
  onApply?: () => void;
  onView?: () => void;
}

const categoryColors: Record<string, string> = {
  "SACorp": "border-l-primary",
  "United Kingdom": "border-l-purple-500",
  "USA": "border-l-accent-teal",
  "Europe Trusts/ Foundation": "border-l-accent-amber",
  "SA Trusts/ Foundations": "border-l-primary",
  "Other": "border-l-muted-foreground",
  "Foreign Missions": "border-l-accent-teal",
};

const categoryBadgeStyles: Record<string, string> = {
  "SACorp": "bg-primary/15 text-primary",
  "United Kingdom": "bg-purple-500/15 text-purple-400",
  "USA": "bg-accent-teal/15 text-accent-teal",
  "Europe Trusts/ Foundation": "bg-accent-amber/15 text-accent-amber",
  "SA Trusts/ Foundations": "bg-primary/15 text-primary",
  "Other": "bg-muted/60 text-muted-foreground",
  "Foreign Missions": "bg-accent-teal/15 text-accent-teal",
};

const FunderCard = ({
  name,
  category,
  focusAreas,
  applicationPeriod,
  geography,
  method,
  contact,
  email,
  funderFocus,
  matchScore,
  isGeneral,
  isOpen,
  onSave,
  onApply,
  onView,
}: FunderCardProps) => {
  const displayAreas = focusAreas.slice(0, 3);
  const moreCount = focusAreas.length - 3;

  return (
    <GlassCard
      className={`border-l-4 ${categoryColors[category] || "border-l-muted-foreground"} relative`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span
            className={`inline-block text-[10px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5 mb-2 ${
              categoryBadgeStyles[category] || "bg-muted/60 text-muted-foreground"
            }`}
          >
            {category}
          </span>
          {isOpen && (
            <span className="inline-block ml-2 text-[10px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5 bg-success/15 text-success">
              Open Now
            </span>
          )}
          <h3 className="text-base font-semibold text-foreground leading-tight">{name}</h3>
        </div>
        {isGeneral ? (
          <span className="shrink-0 text-[10px] font-medium text-center leading-tight rounded-full px-2.5 py-1.5 bg-muted/60 text-muted-foreground" title="No focus-area information on file for this funder">
            General funder<br />no specific info
          </span>
        ) : (
          <MatchScoreRing score={matchScore} size="sm" />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {displayAreas.map((area) => (
          <span
            key={area}
            className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
          >
            {area}
          </span>
        ))}
        {moreCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            +{moreCount} more
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-primary" />
          <span>{applicationPeriod || "Not specified"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-3 w-3 text-primary" />
          <span>{geography || "Not specified"}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-primary" />
          <span>{method || "Not specified"}</span>
        </div>
        {contact && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-primary" />
            <span className="truncate">{contact}{email ? ` · ${email}` : ""}</span>
          </div>
        )}
      </div>

      {funderFocus && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{funderFocus}</p>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-primary"
          onClick={onSave}
        >
          <Bookmark className="h-3 w-3 mr-1" /> Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-primary"
          onClick={onApply}
        >
          <Send className="h-3 w-3 mr-1" /> Apply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs ml-auto text-muted-foreground hover:text-primary"
          onClick={onView}
        >
          View <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </GlassCard>
  );
};

export default FunderCard;
