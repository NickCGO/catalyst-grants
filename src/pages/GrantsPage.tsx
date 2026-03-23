import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Users } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import FunderCard from "@/components/FunderCard";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const categories = ["SACorp", "United Kingdom", "USA", "Europe Trusts/ Foundation", "SA Trusts/ Foundations", "Other", "Foreign Missions"];

const focusAreaLabels = [
  "Children", "Families/Parents", "Disability", "Health/HIV", "Aged/Elderly",
  "Women/Gender", "LGBTQI", "Youth", "Education/ECD", "Science/Research",
  "Capacity Building", "Entrepreneur/Skills", "Poverty/Livelihood", "Housing",
  "Welfare", "Displaced/Refugees", "Peace/Conflict", "Human Rights",
  "Religion", "Arts/Culture", "Sports", "Community Dev", "Environment",
  "Agriculture/Land", "Animals",
];

const sampleFunders = [
  { name: "Anglo American Chairman's Fund", category: "SACorp", focusAreas: ["Education", "Youth", "Community Dev", "Health/HIV"], applicationPeriod: "Monthly", geography: "National", method: "Proposal", matchScore: 91, isOpen: true, contact: "Grant Manager", email: "grants@angloamerican.com", funderFocus: "Supporting education, community development, and health initiatives across South Africa.", consortium: false },
  { name: "DG Murray Trust", category: "SA Trusts/ Foundations", focusAreas: ["Education", "Youth", "Capacity Building", "Research"], applicationPeriod: "Open year-round", geography: "National", method: "Concept Note", matchScore: 85, isOpen: true, funderFocus: "Investing in education innovation and leadership development to improve quality of life.", consortium: false },
  { name: "Ford Foundation", category: "USA", focusAreas: ["Human Rights", "Women/Gender", "Poverty/Livelihood"], applicationPeriod: "By invitation", geography: "International", method: "Letter of Enquiry", matchScore: 72, isOpen: false, funderFocus: "Working to reduce poverty and injustice. Prefers consortium and multi-org partnerships.", consortium: true },
  { name: "National Lotteries Commission", category: "SA Trusts/ Foundations", focusAreas: ["Community Dev", "Arts/Culture", "Sports", "Education"], applicationPeriod: "Monthly", geography: "National", method: "Application Form/Online", matchScore: 88, isOpen: true, funderFocus: "Distributing funds to support good causes in charities, arts and sport.", consortium: false },
  { name: "Comic Relief", category: "United Kingdom", focusAreas: ["Children", "Youth", "Women/Gender", "Health/HIV"], applicationPeriod: "Jan-May", geography: "International", method: "Application Form/Online", matchScore: 68, isOpen: false, funderFocus: "Fighting poverty through joint programme partnerships and consortium grants.", consortium: true },
  { name: "Nedbank Foundation", category: "SACorp", focusAreas: ["Education", "Community Dev", "Youth", "Environment"], applicationPeriod: "Monthly", geography: "National", method: "Proposal", matchScore: 78, isOpen: true, funderFocus: "Supporting community development, education and environmental sustainability.", consortium: false },
  { name: "Open Society Foundation", category: "USA", focusAreas: ["Human Rights", "Women/Gender", "LGBTQI", "Peace/Conflict"], applicationPeriod: "Varies", geography: "International", method: "Concept Note", matchScore: 65, isOpen: false, funderFocus: "Building vibrant democracies. Encourages multi-org consortium applications.", consortium: true },
  { name: "Irish Aid", category: "Foreign Missions", focusAreas: ["Poverty/Livelihood", "Education", "Health/HIV", "Women/Gender"], applicationPeriod: "Jan-Mar", geography: "International", method: "Proposal", matchScore: 74, isOpen: false, funderFocus: "Ireland's official overseas development programme.", consortium: false },
  { name: "ABSA Foundation", category: "SACorp", focusAreas: ["Education", "Entrepreneur/Skills", "Youth"], applicationPeriod: "Monthly", geography: "National", method: "Application Form/Online", matchScore: 82, isOpen: true, funderFocus: "Empowering communities through education and enterprise development.", consortium: false },
  { name: "Raith Foundation", category: "SA Trusts/ Foundations", focusAreas: ["Youth", "Education", "Human Rights"], applicationPeriod: "Monthly", geography: "National", method: "Short Proposal", matchScore: 69, isOpen: true, funderFocus: "Supporting innovative approaches to social justice and youth development.", consortium: false },
  { name: "European Commission - EuropeAid", category: "Europe Trusts/ Foundation", focusAreas: ["Human Rights", "Environment", "Education", "Health/HIV"], applicationPeriod: "Varies", geography: "International", method: "Proposal", matchScore: 76, isOpen: true, funderFocus: "Large-scale development funding requiring multi-partner consortium applications with local and international partners.", consortium: true },
  { name: "Hivos", category: "Europe Trusts/ Foundation", focusAreas: ["Human Rights", "Women/Gender", "Environment", "LGBTQI"], applicationPeriod: "Varies", geography: "International", method: "Concept Note", matchScore: 61, isOpen: false, funderFocus: "Seeking creative solutions through joint programme partnerships.", consortium: true },
];

const GrantsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [consortiumOnly, setConsortiumOnly] = useState(false);

  const filtered = sampleFunders
    .filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.funderFocus?.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(f.category)) return false;
      if (consortiumOnly && !f.consortium) return false;
      return true;
    })
    .sort((a, b) => sortBy === "score" ? b.matchScore - a.matchScore : a.name.localeCompare(b.name));

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Find Your Funding Match</h1>
          <p className="text-sm text-muted-foreground mt-1">
            2,448 funders · {filtered.length} matched to your profile
            {consortiumOnly && <span className="text-amber-400 ml-1">· Consortium filter active</span>}
          </p>
        </motion.div>

        <div className="flex gap-6">
          {/* Filters */}
          {showFilters && (
            <motion.aside
              className="w-64 shrink-0 hidden lg:block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard hoverable={false} className="sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => { setSelectedCategories([]); setConsortiumOnly(false); }}
                  >
                    Reset
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search funders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 text-sm bg-secondary/30 border-border/50"
                  />
                </div>

                {/* Consortium Filter */}
                <div className="mb-5 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-foreground">Consortium preferred</span>
                    </div>
                    <Switch
                      checked={consortiumOnly}
                      onCheckedChange={setConsortiumOnly}
                      className="scale-90"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Show only funders that prefer or require multi-org applications</p>
                  {consortiumOnly && (
                    <Link to="/partnerships/discover" className="text-[10px] text-primary hover:underline mt-1.5 block">
                      Find partners for these grants →
                    </Link>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <Checkbox
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Focus Areas</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {focusAreaLabels.slice(0, 10).map((area) => (
                      <label key={area} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox className="h-3.5 w-3.5" />
                        <span className="text-xs text-foreground">{area}</span>
                      </label>
                    ))}
                    <span className="text-xs text-muted-foreground">+15 more...</span>
                  </div>
                </div>
              </GlassCard>
            </motion.aside>
          )}

          {/* Grid */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-muted-foreground"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" /> Filters
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  variant={sortBy === "score" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSortBy("score")}
                >
                  Match Score
                </Button>
                <Button
                  variant={sortBy === "name" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSortBy("name")}
                >
                  Name A-Z
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((f, i) => (
                <motion.div
                  key={f.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  {f.consortium && (
                    <Badge className="absolute -top-2 right-3 z-10 bg-amber-500/90 text-white border-0 text-[9px] gap-1">
                      <Users className="h-2.5 w-2.5" /> Consortium
                    </Badge>
                  )}
                  <FunderCard {...f} />
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No funders match your filters.</p>
                <Button
                  variant="ghost"
                  className="mt-2 text-primary"
                  onClick={() => { setSearch(""); setSelectedCategories([]); setConsortiumOnly(false); }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GrantsPage;
