import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Sparkles, Check, Building2, Heart, Target,
  MapPin, BarChart3, History, Globe, Info, Save, Users, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import GlassCard from "@/components/GlassCard";
import { callAI } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const focusAreas = [
  { key: "children", label: "Children", icon: "👶", desc: "Programmes for children aged 0-12" },
  { key: "families_parents", label: "Families/Parents", icon: "👨‍👩‍👧", desc: "Family strengthening & parenting" },
  { key: "disability", label: "Disability", icon: "♿", desc: "Disability rights & inclusion" },
  { key: "health_aids_sexual_reproductive", label: "Health/HIV/AIDS", icon: "🏥", desc: "Health, HIV/AIDS, sexual & reproductive health" },
  { key: "aged_elderly", label: "Aged/Elderly", icon: "👴", desc: "Elderly care & support" },
  { key: "women_gender_dv_girls", label: "Women/Gender/DV", icon: "👩", desc: "Women empowerment, GBV, girls" },
  { key: "lgbtqi_gender_equality", label: "LGBTQI+", icon: "🏳️‍🌈", desc: "LGBTQI rights & equality" },
  { key: "youth", label: "Youth", icon: "🧑", desc: "Youth development (13-24)" },
  { key: "education_ecd", label: "Education/ECD", icon: "📚", desc: "Education & early childhood development" },
  { key: "science_research", label: "Science/Research", icon: "🔬", desc: "Scientific research & innovation" },
  { key: "capacity_building_governance", label: "Capacity Building", icon: "📈", desc: "Governance & organisational development" },
  { key: "entrepreneur_skills_vocational", label: "Entrepreneur/Skills", icon: "💼", desc: "Skills training & entrepreneurship" },
  { key: "poverty_livelihood", label: "Poverty/Livelihood", icon: "🏠", desc: "Poverty alleviation & livelihoods" },
  { key: "housing_homeless", label: "Housing/Homeless", icon: "🏗️", desc: "Housing & homelessness" },
  { key: "welfare", label: "Welfare", icon: "🤝", desc: "Social welfare & safety nets" },
  { key: "displaced_refugees", label: "Displaced/Refugees", icon: "🌍", desc: "Refugees, migrants & displaced people" },
  { key: "peace_conflict_resolution", label: "Peace/Conflict", icon: "☮️", desc: "Peace building & conflict resolution" },
  { key: "human_rights_advocacy", label: "Human Rights", icon: "⚖️", desc: "Human rights & advocacy" },
  { key: "religion", label: "Religion", icon: "🙏", desc: "Faith-based programmes" },
  { key: "arts_culture", label: "Arts/Culture", icon: "🎨", desc: "Arts, culture & heritage" },
  { key: "sports", label: "Sports", icon: "⚽", desc: "Sports & recreation" },
  { key: "community_development", label: "Community Dev", icon: "🏘️", desc: "Community development & empowerment" },
  { key: "environment_conservation", label: "Environment", icon: "🌿", desc: "Environment & conservation" },
  { key: "agriculture_land", label: "Agriculture/Land", icon: "🌾", desc: "Agriculture & land reform" },
  { key: "animals", label: "Animals", icon: "🐾", desc: "Animal welfare & wildlife" },
];

const sdgGoals = [
  "No Poverty", "Zero Hunger", "Good Health", "Quality Education", "Gender Equality",
  "Clean Water", "Affordable Energy", "Decent Work", "Industry & Innovation",
  "Reduced Inequalities", "Sustainable Cities", "Responsible Consumption",
  "Climate Action", "Life Below Water", "Life on Land", "Peace & Justice", "Partnerships",
];

const africanCountries = [
  "South Africa", "Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda", "Ethiopia",
  "Rwanda", "Mozambique", "Zimbabwe", "Zambia", "Malawi", "Botswana", "Namibia",
  "Lesotho", "Eswatini", "DRC", "Cameroon", "Senegal", "Mali", "Burkina Faso",
  "Niger", "Chad", "Somalia", "Sudan", "South Sudan", "Egypt", "Morocco", "Tunisia",
  "Algeria", "Libya", "Mauritius", "Madagascar", "Angola", "Gabon", "Congo",
  "Central African Republic", "Eritrea", "Djibouti", "Comoros", "Seychelles",
  "Cabo Verde", "Guinea", "Guinea-Bissau", "Sierra Leone", "Liberia",
  "Côte d'Ivoire", "Togo", "Benin", "Equatorial Guinea", "São Tomé and Príncipe",
  "Mauritania", "Gambia",
];

const saProvinces = [
  "Western Cape", "Eastern Cape", "Northern Cape", "North West", "Limpopo",
  "Mpumalanga", "Free State", "KwaZulu-Natal", "Gauteng",
];

const beneficiaryGroups = [
  { key: "children_0_12", label: "Children (0-12)", icon: "👶" },
  { key: "youth_13_24", label: "Youth (13-24)", icon: "🧑" },
  { key: "women_girls", label: "Women & Girls", icon: "👩" },
  { key: "elderly", label: "Elderly", icon: "👴" },
  { key: "pwd", label: "People with Disabilities", icon: "♿" },
  { key: "refugees", label: "Refugees & Migrants", icon: "🌍" },
  { key: "lgbtqi", label: "LGBTQI+", icon: "🏳️‍🌈" },
  { key: "community", label: "General Community", icon: "🏘️" },
  { key: "animals", label: "Animals/Wildlife", icon: "🐾" },
  { key: "environment", label: "Environment", icon: "🌿" },
];

const coreValueOptions = [
  "Integrity", "Community-led", "Transparency", "Ubuntu", "Empowerment",
  "Dignity", "Innovation", "Accountability",
];

const steps = [
  { title: "Legal Identity", icon: Building2, time: "~2 min" },
  { title: "Mission & Vision", icon: Heart, time: "~5 min" },
  { title: "Focus Areas", icon: Target, time: "~3 min" },
  { title: "Programmes", icon: Briefcase, time: "~5 min" },
  { title: "Geographic Footprint", icon: MapPin, time: "~2 min" },
  { title: "Capacity & Financials", icon: BarChart3, time: "~5 min" },
  { title: "Funding History", icon: History, time: "~3 min" },
];

const WhyTooltip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button className="inline-flex items-center text-primary/60 hover:text-primary ml-1">
        <Info className="h-3 w-3" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs bg-card border-border">
      {text}
    </TooltipContent>
  </Tooltip>
);

const OnboardingPage = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  // Step 1: Legal Identity
  const [orgName, setOrgName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [country, setCountry] = useState("South Africa");
  const [region, setRegion] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [taxStatus, setTaxStatus] = useState("");
  const [pboNumber, setPboNumber] = useState("");
  const [isAudited, setIsAudited] = useState(false);
  const [lastAuditYear, setLastAuditYear] = useState("");

  // Step 2: Mission & Vision
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [theoryOfChange, setTheoryOfChange] = useState("");
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [beneficiaryReach, setBeneficiaryReach] = useState("");
  const [impactStatement, setImpactStatement] = useState("");
  const [generatingMission, setGeneratingMission] = useState(false);

  // Step 3: Focus Areas
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [focusPriority, setFocusPriority] = useState<Record<string, string>>({});
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);

  // Step 4: Programmes
  const [programmes, setProgrammes] = useState<Array<{
    name: string; description: string; focusArea: string;
    beneficiaries: string; areas: string; status: string; yearStarted: string; budget: string;
  }>>([{ name: "", description: "", focusArea: "", beneficiaries: "", areas: "", status: "Active", yearStarted: "", budget: "" }]);
  const [annualBudget, setAnnualBudget] = useState("");
  const [operationalExpenses, setOperationalExpenses] = useState("");
  const [fundingGap, setFundingGap] = useState("");

  // Step 5: Geographic Footprint
  const [regionsOfOperation, setRegionsOfOperation] = useState<string[]>([]);
  const [cities, setCities] = useState("");
  const [worksRural, setWorksRural] = useState(false);
  const [worksUrban, setWorksUrban] = useState(false);
  const [worksOtherAfrican, setWorksOtherAfrican] = useState(false);
  const [otherAfricanCountries, setOtherAfricanCountries] = useState<string[]>([]);
  const [worksInternationally, setWorksInternationally] = useState(false);

  // Step 6: Capacity
  const [fteCount, setFteCount] = useState("");
  const [parttimeCount, setParttimeCount] = useState("");
  const [volunteerCount, setVolunteerCount] = useState("");
  const [boardCount, setBoardCount] = useState("");
  const [hasGrantWriter, setHasGrantWriter] = useState(false);
  const [ceoName, setCeoName] = useState("");
  const [financeContact, setFinanceContact] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [pctGrants, setPctGrants] = useState(50);
  const [pctGovernment, setPctGovernment] = useState(20);
  const [pctCorporate, setPctCorporate] = useState(20);
  const [hasStrategicPlan, setHasStrategicPlan] = useState(false);
  const [hasMEFramework, setHasMEFramework] = useState(false);
  const [hasBBBEE, setHasBBBEE] = useState(false);
  const [bbbeeLevel, setBbbeeLevel] = useState("");

  // Step 7: Funding History
  const [hasReceivedGrants, setHasReceivedGrants] = useState(false);
  const [pastFunders, setPastFunders] = useState("");
  const [largestGrant, setLargestGrant] = useState("");
  const [totalFunding3yr, setTotalFunding3yr] = useState("");
  const [fundingAchievement, setFundingAchievement] = useState("");
  const [partnershipOpen, setPartnershipOpen] = useState<boolean | null>(null);
  const [partnershipRole, setPartnershipRole] = useState("");
  const [partnerTypes, setPartnerTypes] = useState<string[]>([]);
  const [partnershipStrengths, setPartnershipStrengths] = useState<string[]>([]);
  const [partnershipStatement, setPartnershipStatement] = useState("");
  const [isDiscoverable, setIsDiscoverable] = useState(false);

  // Calculate completeness
  const completeness = (() => {
    let filled = 0;
    let total = 14;
    if (orgName) filled++;
    if (country) filled++;
    if (mission) filled++;
    if (selectedFocus.length >= 2) filled++;
    if (programmes[0]?.name) filled++;
    if (regionsOfOperation.length > 0) filled++;
    if (fteCount) filled++;
    if (annualIncome) filled++;
    if (regNumber) filled++;
    if (orgType) filled++;
    if (theoryOfChange) filled++;
    if (selectedBeneficiaries.length > 0) filled++;
    if (selectedSDGs.length > 0) filled++;
    if (ceoName) filled++;
    return Math.round((filled / total) * 100);
  })();

  const generateMission = useCallback(async () => {
    setGeneratingMission(true);
    try {
      const keywords = prompt("Enter 3-5 keywords about your work (e.g. youth, education, Western Cape):");
      if (!keywords) { setGeneratingMission(false); return; }
      const result = await callAI([
        { role: "system", content: "You are a professional NGO consultant. Generate a compelling 3-sentence mission statement for an African NGO. Be specific and inspiring." },
        { role: "user", content: `Generate a mission statement for an NGO with these keywords: ${keywords}. Country: ${country}. Return only the mission statement text, no quotes.` },
      ]);
      setMission(result);
      toast({ title: "Mission statement generated!", description: "Feel free to edit it." });
    } catch {
      toast({ title: "AI unavailable", variant: "destructive" });
    }
    setGeneratingMission(false);
  }, [country]);

  const toggleFocus = (key: string) => {
    setSelectedFocus(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const addProgramme = () => {
    if (programmes.length < 8) {
      setProgrammes(prev => [...prev, { name: "", description: "", focusArea: "", beneficiaries: "", areas: "", status: "Active", yearStarted: "", budget: "" }]);
    }
  };

  const updateProgramme = (idx: number, field: string, value: string) => {
    setProgrammes(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removeProgramme = (idx: number) => {
    if (programmes.length > 1) setProgrammes(prev => prev.filter((_, i) => i !== idx));
  };

  const next = () => {
    if (step < 6) setStep(step + 1);
    else {
      toast({ title: "🎉 Onboarding complete!", description: "Calculating your matches..." });
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

  const inputClass = "mt-1 bg-secondary/30 border-border/50 text-foreground";
  const labelClass = "text-xs text-muted-foreground";
  const selectClass = "w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground";

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">GrantMatch</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Profile: {completeness}%</span>
          <Progress value={completeness} className="w-24 h-1.5" />
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => toast({ title: "Progress saved!" })}>
            <Save className="h-3 w-3 mr-1" /> Save & exit
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-3xl">
          {/* Progress Stepper */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setStep(i)}
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                    i < step ? "bg-success text-success-foreground" :
                    i === step ? "bg-primary text-primary-foreground" :
                    "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </button>
                {i < 6 && (
                  <div className={`w-6 sm:w-10 h-0.5 rounded-full ${i < step ? "bg-success" : "bg-secondary"}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GlassCard hoverable={false} className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {(() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
                    {steps[step].title}
                  </h2>
                  <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{steps[step].time}</span>
                </div>

                {/* STEP 0: Legal Identity */}
                {step === 0 && (
                  <div className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground">Let's start with the basics. This ensures we find funders who can actually work with your organisation.
                      <WhyTooltip text="Many funders require NPO registration, audited financials, or specific legal structures. This prevents wasting time on ineligible funders." />
                    </p>
                    <div>
                      <Label className={labelClass}>Organisation Full Legal Name *</Label>
                      <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Elizayo Youth Foundation NPC" className={inputClass} />
                    </div>
                    <div>
                      <Label className={labelClass}>Trading/Common Name (if different)</Label>
                      <Input value={tradingName} onChange={e => setTradingName(e.target.value)} placeholder="e.g. Elizayo Foundation" className={inputClass} />
                    </div>
                    <div>
                      <Label className={labelClass}>Organisation Type *</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {["NPO", "NPC", "CBO", "Trust", "Section 21", "International NGO", "Other"].map(t => (
                          <button key={t} onClick={() => setOrgType(t)}
                            className={`p-2 rounded-lg text-xs border transition-colors ${orgType === t ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={labelClass}>Registration Number *</Label>
                        <Input value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="NPO-123456" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Country of Registration *</Label>
                        <select value={country} onChange={e => setCountry(e.target.value)} className={selectClass}>
                          {africanCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={labelClass}>Province/Region</Label>
                        {country === "South Africa" ? (
                          <select value={region} onChange={e => setRegion(e.target.value)} className={selectClass}>
                            <option value="">Select province</option>
                            {saProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        ) : (
                          <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="Region" className={inputClass} />
                        )}
                      </div>
                      <div>
                        <Label className={labelClass}>Year Established</Label>
                        <Input type="number" value={yearEstablished} onChange={e => setYearEstablished(e.target.value)} placeholder="2015" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <Label className={labelClass}>Tax Status</Label>
                      <div className="flex gap-2 mt-1">
                        {["Tax exempt", "Not tax exempt", "Unknown"].map(t => (
                          <button key={t} onClick={() => setTaxStatus(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs border ${taxStatus === t ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    {taxStatus === "Tax exempt" && (
                      <div>
                        <Label className={labelClass}>PBO Number</Label>
                        <Input value={pboNumber} onChange={e => setPboNumber(e.target.value)} placeholder="PBO 123456789" className={inputClass} />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                      <div>
                        <div className="text-xs text-foreground">Is your organisation audited?</div>
                        <div className="text-[10px] text-muted-foreground">Many funders require audited financials</div>
                      </div>
                      <Switch checked={isAudited} onCheckedChange={setIsAudited} />
                    </div>
                    {isAudited && (
                      <div>
                        <Label className={labelClass}>Last Audit Year</Label>
                        <Input type="number" value={lastAuditYear} onChange={e => setLastAuditYear(e.target.value)} placeholder="2025" className={inputClass} />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 1: Mission & Vision */}
                {step === 1 && (
                  <div className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground">This is the most important section — it's what we use to write your proposals and match you to funders.
                      <WhyTooltip text="Your mission and Theory of Change directly inform every AI-generated proposal section. The more specific you are, the more compelling your proposals." />
                    </p>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className={labelClass}>Mission Statement *</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={generateMission} disabled={generatingMission}>
                          <Sparkles className="h-3 w-3 mr-1" /> {generatingMission ? "Writing..." : "AI Assist"}
                        </Button>
                      </div>
                      <Textarea value={mission} onChange={e => setMission(e.target.value.slice(0, 500))}
                        placeholder="Describe your organisation's mission in 2-3 sentences..."
                        className="bg-secondary/30 border-border/50 min-h-[100px] text-foreground" />
                      <span className="text-[10px] text-muted-foreground">{mission.length}/500</span>
                    </div>
                    <div>
                      <Label className={labelClass}>Vision Statement (optional)</Label>
                      <Textarea value={vision} onChange={e => setVision(e.target.value.slice(0, 300))}
                        placeholder="What does the future look like when your mission succeeds?"
                        className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground" />
                      <span className="text-[10px] text-muted-foreground">{vision.length}/300</span>
                    </div>
                    <div>
                      <Label className={labelClass}>Core Values (pick up to 6)</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {coreValueOptions.map(v => (
                          <button key={v} onClick={() => setCoreValues(prev => prev.includes(v) ? prev.filter(x => x !== v) : prev.length < 6 ? [...prev, v] : prev)}
                            className={`text-[10px] px-2.5 py-1 rounded-full border ${coreValues.includes(v) ? "bg-primary/15 border-primary/40 text-primary" : "border-border/30 text-muted-foreground hover:bg-secondary/30"}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className={labelClass}>Theory of Change</Label>
                      <Textarea value={theoryOfChange} onChange={e => setTheoryOfChange(e.target.value.slice(0, 1000))}
                        placeholder="If we [activity], then [population] will [outcome], leading to [long-term impact]..."
                        className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground" />
                      <span className="text-[10px] text-muted-foreground">{theoryOfChange.length}/1000</span>
                    </div>
                    <div>
                      <Label className={labelClass}>Primary Beneficiary Groups</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {beneficiaryGroups.map(b => (
                          <button key={b.key} onClick={() => setSelectedBeneficiaries(prev => prev.includes(b.key) ? prev.filter(x => x !== b.key) : [...prev, b.key])}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${selectedBeneficiaries.includes(b.key) ? "bg-primary/10 border-primary/40 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"}`}>
                            <span>{b.icon}</span><span>{b.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={labelClass}>Annual Beneficiary Reach</Label>
                        <Input type="number" value={beneficiaryReach} onChange={e => setBeneficiaryReach(e.target.value)} placeholder="e.g. 12000" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Key Impact Statement</Label>
                        <Input value={impactStatement} onChange={e => setImpactStatement(e.target.value.slice(0, 200))} placeholder="We have supported 12,000 young people..." className={inputClass} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Focus Areas */}
                {step === 2 && (
                  <div className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground">Select everything that applies. More selections = better matches.
                      <WhyTooltip text="The 25 focus areas map directly to our funder database. Each selection narrows and improves your match scores." />
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {focusAreas.map(area => (
                        <button key={area.key} onClick={() => toggleFocus(area.key)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs text-left transition-all ${
                            selectedFocus.includes(area.key) ? "bg-primary/15 border border-primary/40 text-foreground" : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
                          }`}>
                          <span>{area.icon}</span>
                          <div>
                            <div>{area.label}</div>
                            {selectedFocus.includes(area.key) && (
                              <select className="text-[9px] bg-transparent text-primary mt-0.5" onClick={e => e.stopPropagation()}
                                value={focusPriority[area.key] || "primary"}
                                onChange={e => setFocusPriority(prev => ({ ...prev, [area.key]: e.target.value }))}>
                                <option value="primary">Primary</option>
                                <option value="secondary">Secondary</option>
                              </select>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{selectedFocus.length} selected · Minimum 2 required</p>

                    <div className="pt-4 border-t border-border/30">
                      <Label className={labelClass}>Sustainable Development Goals (pick up to 3)</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2">
                        {sdgGoals.map((sdg, i) => (
                          <button key={i} onClick={() => setSelectedSDGs(prev => prev.includes(i + 1) ? prev.filter(x => x !== i + 1) : prev.length < 3 ? [...prev, i + 1] : prev)}
                            className={`p-1.5 rounded text-[9px] border text-center ${selectedSDGs.includes(i + 1) ? "bg-primary/15 border-primary/40 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"}`}>
                            SDG {i + 1}: {sdg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Programmes */}
                {step === 3 && (
                  <div className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground">Tell us about the work you actually do. This powers the proposal writer.
                      <WhyTooltip text="We use your programme details to generate section-specific proposal content. When AI writes your Methodology section, it draws from your actual programme descriptions." />
                    </p>
                    {programmes.map((prog, idx) => (
                      <div key={idx} className="p-4 rounded-lg border border-border/30 bg-secondary/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">Programme {idx + 1}</span>
                          {programmes.length > 1 && (
                            <button onClick={() => removeProgramme(idx)} className="text-[10px] text-destructive hover:underline">Remove</button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className={labelClass}>Name *</Label>
                            <Input value={prog.name} onChange={e => updateProgramme(idx, "name", e.target.value)} placeholder="e.g. AfterSchool Programme" className={inputClass} />
                          </div>
                          <div>
                            <Label className={labelClass}>Status</Label>
                            <select value={prog.status} onChange={e => updateProgramme(idx, "status", e.target.value)} className={selectClass}>
                              <option>Active</option><option>Planned</option><option>Completed</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className={labelClass}>Brief Description</Label>
                          <Input value={prog.description} onChange={e => updateProgramme(idx, "description", e.target.value.slice(0, 200))} placeholder="What does this programme do?" className={inputClass} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className={labelClass}>Target Beneficiaries</Label>
                            <Input type="number" value={prog.beneficiaries} onChange={e => updateProgramme(idx, "beneficiaries", e.target.value)} placeholder="500" className={inputClass} />
                          </div>
                          <div>
                            <Label className={labelClass}>Year Started</Label>
                            <Input type="number" value={prog.yearStarted} onChange={e => updateProgramme(idx, "yearStarted", e.target.value)} placeholder="2020" className={inputClass} />
                          </div>
                          <div>
                            <Label className={labelClass}>Annual Budget</Label>
                            <select value={prog.budget} onChange={e => updateProgramme(idx, "budget", e.target.value)} className={selectClass}>
                              <option value="">Select</option>
                              <option>Under R100k</option><option>R100k-R500k</option><option>R500k-R2M</option><option>R2M+</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    {programmes.length < 8 && (
                      <Button variant="outline" size="sm" className="border-border/50 text-xs" onClick={addProgramme}>
                        + Add Programme
                      </Button>
                    )}
                    <div className="pt-4 border-t border-border/30 grid grid-cols-3 gap-4">
                      <div>
                        <Label className={labelClass}>Annual Programme Budget (ZAR)</Label>
                        <Input type="number" value={annualBudget} onChange={e => setAnnualBudget(e.target.value)} placeholder="e.g. 2500000" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Monthly Operational Costs (ZAR)</Label>
                        <Input type="number" value={operationalExpenses} onChange={e => setOperationalExpenses(e.target.value)} placeholder="e.g. 85000" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Current Funding Gap (ZAR)</Label>
                        <Input type="number" value={fundingGap} onChange={e => setFundingGap(e.target.value)} placeholder="e.g. 500000" className={inputClass} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Geographic Footprint */}
                {step === 4 && (
                  <div className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground">Where does your work happen? This dramatically affects which funders match you.
                      <WhyTooltip text="Funders in our database are tagged by Geographical Area (National, WC, KZN, GTG, etc.). Your footprint determines eligibility for location-specific grants." />
                    </p>
                    <div>
                      <Label className={labelClass}>Primary Country: <span className="text-foreground">{country}</span></Label>
                    </div>
                    {country === "South Africa" && (
                      <div>
                        <Label className={labelClass}>Provinces of Operation</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          {saProvinces.map(p => (
                            <button key={p} onClick={() => setRegionsOfOperation(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                              className={`p-2 rounded-lg text-xs border ${regionsOfOperation.includes(p) ? "bg-primary/10 border-primary/40 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"}`}>
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className={labelClass}>Specific Cities/Communities (optional)</Label>
                      <Input value={cities} onChange={e => setCities(e.target.value)} placeholder="e.g. Cape Town, Khayelitsha, Stellenbosch" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <span className="text-xs text-foreground">Work in rural areas?</span>
                        <Switch checked={worksRural} onCheckedChange={setWorksRural} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <span className="text-xs text-foreground">Work in urban/township areas?</span>
                        <Switch checked={worksUrban} onCheckedChange={setWorksUrban} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                      <span className="text-xs text-foreground">Work in other African countries?</span>
                      <Switch checked={worksOtherAfrican} onCheckedChange={setWorksOtherAfrican} />
                    </div>
                    {worksOtherAfrican && (
                      <div>
                        <Label className={labelClass}>Select countries</Label>
                        <div className="grid grid-cols-3 gap-1.5 mt-1 max-h-40 overflow-y-auto">
                          {africanCountries.filter(c => c !== country).map(c => (
                            <button key={c} onClick={() => setOtherAfricanCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                              className={`p-1.5 rounded text-[10px] border ${otherAfricanCountries.includes(c) ? "bg-primary/10 border-primary/40 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                      <span className="text-xs text-foreground">Work internationally (outside Africa)?</span>
                      <Switch checked={worksInternationally} onCheckedChange={setWorksInternationally} />
                    </div>
                  </div>
                )}

                {/* STEP 5: Capacity & Financials */}
                {step === 5 && (
                  <div className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground">This helps us match you to funders who fund at the right scale.
                      <WhyTooltip text="Knowing your capacity means AI can write truthful, credible capacity sections. It also prevents you applying to funders who require scale you don't yet have." />
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <Label className={labelClass}>Full-time Staff</Label>
                        <Input type="number" value={fteCount} onChange={e => setFteCount(e.target.value)} placeholder="12" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Part-time Staff</Label>
                        <Input type="number" value={parttimeCount} onChange={e => setParttimeCount(e.target.value)} placeholder="5" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Volunteers</Label>
                        <Input type="number" value={volunteerCount} onChange={e => setVolunteerCount(e.target.value)} placeholder="20" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Board Members</Label>
                        <Input type="number" value={boardCount} onChange={e => setBoardCount(e.target.value)} placeholder="7" className={inputClass} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                      <span className="text-xs text-foreground">Dedicated grant writer on staff?</span>
                      <Switch checked={hasGrantWriter} onCheckedChange={setHasGrantWriter} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={labelClass}>CEO/Executive Director</Label>
                        <Input value={ceoName} onChange={e => setCeoName(e.target.value)} placeholder="Full name" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Finance Contact (optional)</Label>
                        <Input value={financeContact} onChange={e => setFinanceContact(e.target.value)} placeholder="Full name" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <Label className={labelClass}>Annual Income (last year, ZAR)</Label>
                      <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} placeholder="e.g. 3500000" className={inputClass} />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>Income Sources (%)</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-20">Grants</span>
                          <Slider value={[pctGrants]} max={100} step={5} onValueChange={v => setPctGrants(v[0])} className="flex-1" />
                          <span className="text-xs text-foreground w-8 text-right">{pctGrants}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-20">Government</span>
                          <Slider value={[pctGovernment]} max={100} step={5} onValueChange={v => setPctGovernment(v[0])} className="flex-1" />
                          <span className="text-xs text-foreground w-8 text-right">{pctGovernment}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-20">Corporate CSR</span>
                          <Slider value={[pctCorporate]} max={100} step={5} onValueChange={v => setPctCorporate(v[0])} className="flex-1" />
                          <span className="text-xs text-foreground w-8 text-right">{pctCorporate}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-20">Other</span>
                          <span className="text-xs text-foreground">{Math.max(0, 100 - pctGrants - pctGovernment - pctCorporate)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <span className="text-[10px] text-foreground">3-year strategic plan?</span>
                        <Switch checked={hasStrategicPlan} onCheckedChange={setHasStrategicPlan} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <span className="text-[10px] text-foreground">M&E framework?</span>
                        <Switch checked={hasMEFramework} onCheckedChange={setHasMEFramework} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <span className="text-[10px] text-foreground">BBBEE certificate?</span>
                        <Switch checked={hasBBBEE} onCheckedChange={setHasBBBEE} />
                      </div>
                    </div>
                    {hasBBBEE && (
                      <div>
                        <Label className={labelClass}>BBBEE Level</Label>
                        <select value={bbbeeLevel} onChange={e => setBbbeeLevel(e.target.value)} className={selectClass}>
                          <option value="">Select level</option>
                          {[1,2,3,4,5,6,7,8].map(l => <option key={l} value={l}>Level {l}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 6: Funding History & Partnerships */}
                {step === 6 && (
                  <div className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground">Almost done! This significantly improves match quality and unlocks partnership features.
                      <WhyTooltip text="Funding history helps us calibrate your match scores. Partnership preferences unlock our NGO consortium matching system." />
                    </p>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                      <span className="text-xs text-foreground">Have you received grants before?</span>
                      <Switch checked={hasReceivedGrants} onCheckedChange={setHasReceivedGrants} />
                    </div>

                    {hasReceivedGrants && (
                      <div className="space-y-3 p-4 rounded-lg border border-border/30 bg-secondary/10">
                        <div>
                          <Label className={labelClass}>Past Funders (comma-separated)</Label>
                          <Input value={pastFunders} onChange={e => setPastFunders(e.target.value)} placeholder="e.g. DG Murray Trust, NLC, Anglo American" className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className={labelClass}>Largest Grant Received</Label>
                            <select value={largestGrant} onChange={e => setLargestGrant(e.target.value)} className={selectClass}>
                              <option value="">Select range</option>
                              <option>Under R50k</option><option>R50k-R250k</option><option>R250k-R1M</option><option>R1M-R5M</option><option>R5M+</option>
                            </select>
                          </div>
                          <div>
                            <Label className={labelClass}>Total Funding (last 3 years)</Label>
                            <select value={totalFunding3yr} onChange={e => setTotalFunding3yr(e.target.value)} className={selectClass}>
                              <option value="">Select range</option>
                              <option>Under R50k</option><option>R50k-R250k</option><option>R250k-R1M</option><option>R1M-R5M</option><option>R5M+</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className={labelClass}>What are you most proud of achieving with past funding?</Label>
                          <Textarea value={fundingAchievement} onChange={e => setFundingAchievement(e.target.value.slice(0, 300))}
                            placeholder="e.g. Supported 12,000 youth to complete secondary school..."
                            className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground" />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border/30">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-accent-amber" /> Partnership Appetite
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <Label className={labelClass}>Open to partnering with other NGOs?</Label>
                          <div className="flex gap-2 mt-1">
                            {[{ val: true, label: "Yes" }, { val: false, label: "No" }, { val: null, label: "Maybe" }].map(opt => (
                              <button key={String(opt.val)} onClick={() => setPartnershipOpen(opt.val)}
                                className={`px-4 py-1.5 rounded-lg text-xs border ${partnershipOpen === opt.val ? "bg-accent-amber/15 border-accent-amber/40 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {partnershipOpen !== false && (
                          <>
                            <div>
                              <Label className={labelClass}>Partnership Role Preference</Label>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                {["Lead organisation", "Sub-grantee", "Equal partners", "Open to any"].map(r => (
                                  <button key={r} onClick={() => setPartnershipRole(r)}
                                    className={`p-2 rounded-lg text-xs border ${partnershipRole === r ? "bg-accent-amber/15 border-accent-amber/40 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className={labelClass}>What do you bring to a partnership?</Label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {["Community relationships", "Technical expertise", "Geographic reach", "Beneficiary networks", "Research capability", "Finance management", "M&E", "Advocacy"].map(s => (
                                  <button key={s} onClick={() => setPartnershipStrengths(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                    className={`text-[10px] px-2.5 py-1 rounded-full border ${partnershipStrengths.includes(s) ? "bg-accent-amber/15 border-accent-amber/40 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className={labelClass}>Partnership Statement (shown on your public profile)</Label>
                              <Textarea value={partnershipStatement} onChange={e => setPartnershipStatement(e.target.value.slice(0, 300))}
                                placeholder="We bring strong community relationships in Cape Flats townships and are looking to partner with..."
                                className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-accent-amber/30 bg-accent-amber/5">
                              <div>
                                <div className="text-xs text-foreground">Make your organisation discoverable?</div>
                                <div className="text-[10px] text-muted-foreground">Other GrantMatch NGOs can find and message you</div>
                              </div>
                              <Switch checked={isDiscoverable} onCheckedChange={setIsDiscoverable} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/30">
                  <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="text-muted-foreground">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={next} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {step === 6 ? "Finish & see my matches ✨" : "Continue"} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
