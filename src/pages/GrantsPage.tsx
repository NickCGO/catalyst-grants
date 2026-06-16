import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Users, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import FunderCard from "@/components/FunderCard";
import StartApplicationModal, { type ApplicationRoute } from "@/components/StartApplicationModal";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation } from "@/hooks/useAuth";
import { toast } from "sonner";
import { computeMatchScores } from "@/lib/matchingEngine";
import AfricaSpinner from "../components/AfricaSpinner";

const categories = ["SACorp", "United Kingdom", "USA", "Europe Trusts/ Foundation", "SA Trusts/ Foundations", "Other", "Foreign Missions"];

const focusAreaColumns = [
  { key: "children", label: "Children" },
  { key: "families_parents", label: "Families/Parents" },
  { key: "disability", label: "Disability" },
  { key: "health_aids_sexual_reproductive", label: "Health/HIV" },
  { key: "aged_elderly", label: "Aged/Elderly" },
  { key: "women_gender_dv_girls", label: "Women/Gender" },
  { key: "lgbtqi_gender_equality", label: "LGBTQI" },
  { key: "youth", label: "Youth" },
  { key: "education_ecd", label: "Education/ECD" },
  { key: "science_research", label: "Science/Research" },
  { key: "capacity_building_governance", label: "Capacity Building" },
  { key: "entrepreneur_skills_vocational", label: "Entrepreneur/Skills" },
  { key: "poverty_livelihood", label: "Poverty/Livelihood" },
  { key: "housing_homeless", label: "Housing" },
  { key: "welfare", label: "Welfare" },
  { key: "displaced_refugees", label: "Displaced/Refugees" },
  { key: "peace_conflict_resolution", label: "Peace/Conflict" },
  { key: "human_rights_advocacy", label: "Human Rights" },
  { key: "religion", label: "Religion" },
  { key: "arts_culture", label: "Arts/Culture" },
  { key: "sports", label: "Sports" },
  { key: "community_development", label: "Community Dev" },
  { key: "environment_conservation", label: "Environment" },
  { key: "agriculture_land", label: "Agriculture/Land" },
  { key: "animals", label: "Animals" },
] as const;

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
const PAGE_SIZE = 24;

type FunderRow = {
  id: string;
  donor_name: string;
  category: string | null;
  funder_focus: string | null;
  application_period: string | null;
  geographical_area: string | null;
  method_of_approach: string | null;
  contact_person: string | null;
  email: string | null;
  website: string | null;
};

function getFocusLabels(focusRow: Record<string, any> | null): string[] {
  if (!focusRow) return [];
  return focusAreaColumns.filter(c => focusRow[c.key] === true).map(c => c.label);
}

function isOpenNow(windowRow: Record<string, any> | null): boolean {
  if (!windowRow) return false;
  const monthKey = MONTH_KEYS[new Date().getMonth()];
  return windowRow[monthKey] === true;
}

function isConsortium(funder: FunderRow): boolean {
  const text = `${funder.funder_focus || ""} ${funder.method_of_approach || ""}`.toLowerCase();
  return /consortium|partnership|joint|multi-org/.test(text);
}

const GrantsPage = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "name">("name");
  const [consortiumOnly, setConsortiumOnly] = useState(false);
  const [funders, setFunders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [generalFunderIds, setGeneralFunderIds] = useState<Set<string>>(new Set());
  const [applyModal, setApplyModal] = useState<any>(null);
  const [computing, setComputing] = useState(false);
  const { org } = useOrganisation();
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [selectedCategories, selectedFocusAreas, consortiumOnly, sortBy]);

  // Load match scores for user's org — compute if none exist
  useEffect(() => {
    if (!org?.id) return;
    const loadScores = async () => {
      const { data, count } = await supabase
        .from("grant_matches")
        .select("funder_id, match_score", { count: "exact" })
        .eq("org_id", org.id);

      if (data && data.length > 0) {
        const map: Record<string, number> = {};
        const general = new Set<string>();
        data.forEach(r => {
          if (!r.funder_id) return;
          if (r.match_score != null) map[r.funder_id] = r.match_score;
          else general.add(r.funder_id);
        });
        setMatchScores(map);
        setGeneralFunderIds(general);
        setSortBy("score");
      } else if (org.focus_areas && org.focus_areas.length > 0) {
        // Auto-compute matches on first visit
        runMatching();
      }
    };
    loadScores();
  }, [org?.id]);

  const runMatching = async () => {
    if (!org?.id || computing) return;
    setComputing(true);
    try {
      const count = await computeMatchScores({
        id: org.id,
        focus_areas: org.focus_areas,
        country: org.country,
        region: org.region,
        regions_of_operation: org.regions_of_operation,
        works_rural: org.works_rural,
        works_urban: org.works_urban,
        works_internationally: org.works_internationally,
        works_other_african: org.works_other_african,
      });
      toast.success(`Matched against ${count} funders!`);
      // Reload scores
      const { data } = await supabase
        .from("grant_matches")
        .select("funder_id, match_score")
        .eq("org_id", org.id);
      if (data) {
        const map: Record<string, number> = {};
        const general = new Set<string>();
        data.forEach(r => {
          if (!r.funder_id) return;
          if (r.match_score != null) map[r.funder_id] = r.match_score;
          else general.add(r.funder_id);
        });
        setMatchScores(map);
        setGeneralFunderIds(general);
        setSortBy("score");
      }
    } catch (err) {
      toast.error("Matching failed — try again");
      console.error(err);
    }
    setComputing(false);
  };

  // Fetch funders
  const fetchFunders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("funders")
        .select("id, donor_name, category, funder_focus, application_period, geographical_area, method_of_approach, contact_person, email, website", { count: "exact" });

      if (debouncedSearch) {
        query = query.or(`donor_name.ilike.%${debouncedSearch}%,funder_focus.ilike.%${debouncedSearch}%`);
      }
      if (selectedCategories.length > 0) {
        query = query.in("category", selectedCategories);
      }

      query = query.order(sortBy === "name" ? "donor_name" : "donor_name", { ascending: sortBy === "name" });
      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data: funderRows, count, error } = await query;
      if (error) throw error;

      const funderIds = (funderRows || []).map(f => f.id);
      if (funderIds.length === 0) {
        setFunders([]);
        setTotalCount(count || 0);
        setLoading(false);
        return;
      }

      // Fetch focus areas and windows in parallel
      const [focusRes, windowsRes] = await Promise.all([
        supabase.from("funder_focus_areas").select("*").in("funder_id", funderIds),
        supabase.from("funder_windows").select("*").in("funder_id", funderIds),
      ]);

      const focusMap: Record<string, any> = {};
      (focusRes.data || []).forEach(r => { if (r.funder_id) focusMap[r.funder_id] = r; });
      const windowMap: Record<string, any> = {};
      (windowsRes.data || []).forEach(r => { if (r.funder_id) windowMap[r.funder_id] = r; });

      let combined = (funderRows || []).map(f => ({
        id: f.id,
        name: f.donor_name,
        category: f.category || "Other",
        focusAreas: getFocusLabels(focusMap[f.id] || null),
        applicationPeriod: f.application_period || "",
        geography: f.geographical_area || "",
        method: f.method_of_approach || "",
        contact: f.contact_person || undefined,
        email: f.email || undefined,
        funderFocus: f.funder_focus || undefined,
        matchScore: matchScores[f.id] || 0,
        isGeneral: generalFunderIds.has(f.id),
        isOpen: isOpenNow(windowMap[f.id] || null),
        consortium: isConsortium(f as FunderRow),
        website: f.website,
      }));

      // Client-side focus area filter — match either structured tags OR fall back to funder_focus text
      if (selectedFocusAreas.length > 0) {
        const needles = selectedFocusAreas.map(a => a.toLowerCase());
        combined = combined.filter(f => {
          if (selectedFocusAreas.some(a => f.focusAreas.includes(a))) return true;
          const haystack = (f.funderFocus || "").toLowerCase();
          return needles.some(n => {
            // Try each token in the label, e.g. "Health/HIV" -> ["health", "hiv"]
            const tokens = n.split(/[\/\s]+/).filter(t => t.length >= 3);
            return tokens.some(t => haystack.includes(t));
          });
        });
      }
      // Client-side consortium filter
      if (consortiumOnly) {
        combined = combined.filter(f => f.consortium);
      }
      // Sort by match score client-side if needed
      if (sortBy === "score") {
        combined.sort((a, b) => b.matchScore - a.matchScore);
      }

      setFunders(combined);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error("Error fetching funders:", err);
      toast.error("Failed to load funders");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategories, selectedFocusAreas, consortiumOnly, sortBy, page, matchScores, generalFunderIds]);

  useEffect(() => { fetchFunders(); }, [fetchFunders]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSave = async (funderId: string) => {
    if (!org?.id) { toast.error("Complete onboarding first"); return; }
    const { error } = await supabase.from("grant_matches").upsert({
      org_id: org.id, funder_id: funderId, is_saved: true, match_score: matchScores[funderId] || 0,
    }, { onConflict: "org_id,funder_id" });
    if (error) {
      await supabase.from("grant_matches").insert({
        org_id: org.id, funder_id: funderId, is_saved: true, match_score: matchScores[funderId] || 0,
      });
    }
    toast.success("Funder saved!");
  };

  const handleApply = (funder: any) => {
    if (!org?.id) { toast.error("Complete onboarding first"); return; }
    setApplyModal(funder);
  };

  const handleApplicationCreated = (proposalId: string, route: ApplicationRoute) => {
    setApplyModal(null);
    const formatParam = route === "full_proposal" ? "" : `?format=${route}`;
    navigate(`/writer/${proposalId}${formatParam}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-6 flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Find Your Funding Match</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount.toLocaleString()} funders
              {Object.keys(matchScores).length > 0 && <span className="text-primary ml-1">· {Object.keys(matchScores).length} scored</span>}
              {consortiumOnly && <span className="text-amber-400 ml-1">· Consortium filter active</span>}
            </p>
          </div>
          <Button
            onClick={runMatching}
            disabled={computing || !org?.id}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {computing ? <AfricaSpinner className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {computing ? "Computing..." : "Recalculate Matches"}
          </Button>
        </motion.div>

        <div className="flex gap-6">
          {showFilters && (
            <motion.aside className="w-64 shrink-0 hidden lg:block" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <GlassCard hoverable={false} className="sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground"
                    onClick={() => { setSelectedCategories([]); setSelectedFocusAreas([]); setConsortiumOnly(false); setSearch(""); }}>
                    Reset
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search funders..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 text-sm bg-secondary/30 border-border/50" />
                </div>

                <div className="mb-5 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-foreground">Consortium preferred</span>
                    </div>
                    <Switch checked={consortiumOnly} onCheckedChange={setConsortiumOnly} className="scale-90" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Show only funders that prefer multi-org applications</p>
                  {consortiumOnly && (
                    <Link to="/partnerships/discover" className="text-[10px] text-primary hover:underline mt-1.5 block">
                      Find partners for these grants →
                    </Link>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <Checkbox checked={selectedCategories.includes(cat)} onCheckedChange={() => toggleCategory(cat)} className="h-3.5 w-3.5" />
                        <span className="text-xs">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Focus Areas</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {focusAreaColumns.map(area => (
                      <label key={area.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={selectedFocusAreas.includes(area.label)} onCheckedChange={() => toggleFocusArea(area.label)} className="h-3.5 w-3.5" />
                        <span className="text-xs text-foreground">{area.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.aside>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="sm" className="lg:hidden text-muted-foreground" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="h-4 w-4 mr-1" /> Filters
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant={sortBy === "score" ? "secondary" : "ghost"} size="sm" className="text-xs h-7" onClick={() => setSortBy("score")}>
                  Match Score
                </Button>
                <Button variant={sortBy === "name" ? "secondary" : "ghost"} size="sm" className="text-xs h-7" onClick={() => setSortBy("name")}>
                  Name A-Z
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {funders.map((f, i) => (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }} className="relative">
                      {f.consortium && (
                        <Badge className="absolute -top-2 right-3 z-10 bg-amber-500/90 text-white border-0 text-[9px] gap-1">
                          <Users className="h-2.5 w-2.5" /> Consortium
                        </Badge>
                      )}
                      <FunderCard {...f}
                        onSave={() => handleSave(f.id)}
                        onApply={() => handleApply({ id: f.id, donor_name: f.name, category: f.category, method_of_approach: f.method, geographical_area: f.geography, application_period: f.applicationPeriod, funder_focus: f.funderFocus, website: f.website, contact_person: f.contact, email: f.email })}
                        onView={() => navigate(`/grants/${f.id}`)} />
                    </motion.div>
                  ))}
                </div>

                {funders.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground">No funders match your filters.</p>
                    <Button variant="ghost" className="mt-2 text-primary"
                      onClick={() => { setSearch(""); setSelectedCategories([]); setSelectedFocusAreas([]); setConsortiumOnly(false); }}>
                      Clear all filters
                    </Button>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {applyModal && org && (
        <StartApplicationModal
          open={!!applyModal}
          onClose={() => setApplyModal(null)}
          funder={applyModal}
          matchScore={matchScores[applyModal.id] || 0}
          isOpen={funders.find(f => f.id === applyModal.id)?.isOpen}
          orgId={org.id}
          programmes={org.programmes || []}
          onCreated={handleApplicationCreated}
        />
      )}
    </DashboardLayout>
  );
};

export default GrantsPage;
