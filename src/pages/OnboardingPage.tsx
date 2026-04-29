import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, ArrowLeft, Sparkles, Check, Building2, Heart, Target,
  MapPin, BarChart3, History, Globe, Info, Save, Users, Briefcase,
  AlertTriangle, Plus, X, FileText, Upload, Shield, DollarSign
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
import { callAI, callAIJSON } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Constants ──
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
  { key: "elderly", label: "Elderly (60+)", icon: "👴" },
  { key: "pwd", label: "People with Disabilities", icon: "♿" },
  { key: "refugees", label: "Refugees & Migrants", icon: "🌍" },
  { key: "lgbtqi", label: "LGBTQI+", icon: "🏳️‍🌈" },
  { key: "community", label: "General Community", icon: "🏘️" },
  { key: "animals", label: "Animals/Wildlife", icon: "🐾" },
  { key: "environment", label: "Environment", icon: "🌿" },
];

const coreValueOptions = [
  "Ubuntu", "Dignity", "Community-led", "Transparency", "Accountability",
  "Integrity", "Empowerment", "Inclusion", "Innovation", "Compassion",
  "Respect", "Justice", "Sustainability",
];

const interventionApproaches = [
  "Direct service delivery", "Capacity building / training", "Advocacy & awareness",
  "Community mobilisation", "Referral & case management", "Research & evidence generation",
  "Systems change", "Peer education", "Digital / technology-based",
];

const dataCollectionOptions = [
  "Pre/post surveys or assessments", "School or institution records", "Case files and case notes",
  "Attendance registers", "Focus group discussions", "Individual interviews",
  "Observation checklists", "Baseline and endline surveys", "Project activity registers",
  "Partner organisation reports", "Community feedback sessions", "Digital data collection (KoBoToolbox, ODK, Google Forms)",
];

const policyOptions = [
  "Child protection / safeguarding", "Financial management", "HR / employment",
  "Anti-fraud and corruption", "Data protection (POPIA)", "Health & safety", "Gender equality",
];

const boardSpecialities = [
  "Legal", "Finance", "Education", "Health", "Social work",
  "Corporate / Business", "Community representative", "Academic / Research", "Government / Policy",
];

const steps = [
  { title: "Legal Identity", icon: Building2, time: "~3 min", sidebar: "This step powers: Cover page, Eligibility statements, Organisational capacity section." },
  { title: "Mission & Theory of Change", icon: Heart, time: "~8 min", sidebar: "This step powers: Executive summary (entire), Problem statement (framing), All 8 proposal sections." },
  { title: "The Problem You Solve", icon: AlertTriangle, time: "~8 min", sidebar: "This step powers: Problem statement, Needs analysis, Situation analysis, Justification." },
  { title: "Your Programmes", icon: Briefcase, time: "~10 min", sidebar: "This step powers: Methodology (entire), Activities plan, Work plan, Budget narrative." },
  { title: "Your Beneficiaries", icon: Users, time: "~5 min", sidebar: "This step powers: Target groups section, Beneficiary numbers, Gender mainstreaming paragraphs." },
  { title: "Impact & Monitoring", icon: Target, time: "~8 min", sidebar: "This step powers: Monitoring & Evaluation section (entire), Logframe indicators, Reporting framework." },
  { title: "Budget & Finance", icon: DollarSign, time: "~5 min", sidebar: "This step powers: Budget narrative, Financial sustainability, Co-funding sections." },
  { title: "Team & Capacity", icon: Shield, time: "~5 min", sidebar: "This step powers: Organisational capacity (entire), Staff profiles, Governance, Track record." },
  { title: "Past Funding & Partnerships", icon: History, time: "~5 min", sidebar: "This step powers: Track record statements, Sustainability section, Partnership paragraphs." },
];

// ── Helper components ──
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

const AIButton = ({ onClick, loading, label = "AI Assist" }: { onClick: () => void; loading?: boolean; label?: string }) => (
  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={onClick} disabled={loading}>
    <Sparkles className="h-3 w-3 mr-1" /> {loading ? "Writing..." : label}
  </Button>
);

const DynamicListInput = ({
  items, setItems, placeholder, label, max = 8, minEncouraged = 2,
}: {
  items: string[]; setItems: (v: string[]) => void; placeholder: string; label: string; max?: number; minEncouraged?: number;
}) => (
  <div>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="space-y-2 mt-1">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; setItems(n); }}
            placeholder={placeholder} className="bg-secondary/30 border-border/50 text-foreground text-sm" />
          {items.length > 1 && (
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground" onClick={() => setItems(items.filter((_, j) => j !== i))}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
    {items.length < max && (
      <Button variant="ghost" size="sm" className="mt-1 text-xs text-primary" onClick={() => setItems([...items, ""])}>
        <Plus className="h-3 w-3 mr-1" /> Add another
      </Button>
    )}
    {items.filter(Boolean).length < minEncouraged && (
      <p className="text-[10px] text-amber-400 mt-1">At least {minEncouraged} recommended</p>
    )}
  </div>
);

// ── Main component ──
const ADMIN_EMAILS = ["info@nickfernandes.co.za"];

const OnboardingPage = () => {
  const [step, setStep] = useState(0);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(!!data.user?.email && ADMIN_EMAILS.includes(data.user.email));
    });
  }, []);
  const inputClass = "mt-1 bg-secondary/30 border-border/50 text-foreground text-sm placeholder:text-muted-foreground/60";
  const labelClass = "text-sm font-semibold text-foreground";
  const selectClass = "w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground";

  // ── Step 1: Legal Identity ──
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
  const [physicalAddress, setPhysicalAddress] = useState("");

  // ── Step 2: Mission & ToC ──
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [tocAction, setTocAction] = useState("");
  const [tocPopulation, setTocPopulation] = useState("");
  const [tocChange, setTocChange] = useState("");
  const [tocMechanism, setTocMechanism] = useState("");
  const [theoryOfChange, setTheoryOfChange] = useState("");
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [beneficiaryReach, setBeneficiaryReach] = useState("");
  const [beneficiaryReachUnit, setBeneficiaryReachUnit] = useState("individuals");
  const [impactStatement, setImpactStatement] = useState("");
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  const [primarySDGs, setPrimarySDGs] = useState<string[]>([]);

  // ── Step 3: Problem ──
  const [problemStatement, setProblemStatement] = useState("");
  const [problemEvidence, setProblemEvidence] = useState<string[]>([""]);
  const [problemRootCauses, setProblemRootCauses] = useState("");
  const [problemGeoContext, setProblemGeoContext] = useState("");
  const [communityVoice, setCommunityVoice] = useState("");
  const [gapInServices, setGapInServices] = useState("");
  const [whyYourOrg, setWhyYourOrg] = useState("");

  // ── Step 4: Programmes ──
  const [programmes, setProgrammes] = useState<Array<{
    name: string; shortDesc: string; fullDesc: string; approaches: string[];
    activities: string[]; outputs: string[]; outcomes: string[]; impactStory: string;
    areas: string; reach: string; reachUnit: string; budget: string; status: string; yearStarted: string; partners: string;
  }>>([{
    name: "", shortDesc: "", fullDesc: "", approaches: [], activities: ["", "", ""],
    outputs: ["", ""], outcomes: ["", ""], impactStory: "", areas: "", reach: "",
    reachUnit: "individuals", budget: "", status: "Active", yearStarted: "", partners: "",
  }]);
  const [innovationFactor, setInnovationFactor] = useState("");

  // ── Step 5: Beneficiaries ──
  const [primaryTargetGroup, setPrimaryTargetGroup] = useState("");
  const [beneficiarySelection, setBeneficiarySelection] = useState("");
  const [genderFemale, setGenderFemale] = useState(50);
  const [directBeneficiaries, setDirectBeneficiaries] = useState("");
  const [indirectBeneficiaries, setIndirectBeneficiaries] = useState("");
  const [beneficiaryParticipation, setBeneficiaryParticipation] = useState("");
  const [vulnerabilityFactors, setVulnerabilityFactors] = useState<string[]>([]);

  // ── Step 6: Impact & M&E ──
  const [keyOutcomes, setKeyOutcomes] = useState<string[]>(["", "", ""]);
  const [indicators, setIndicators] = useState<Array<{
    name: string; type: string; baseline: string; target: string; method: string; frequency: string;
  }>>([{ name: "", type: "outcome", baseline: "", target: "", method: "", frequency: "quarterly" }]);
  const [dataCollectionMethods, setDataCollectionMethods] = useState<string[]>([]);
  const [hasMEFramework, setHasMEFramework] = useState("");
  const [mneDescription, setMneDescription] = useState("");
  const [reportingFrequency, setReportingFrequency] = useState("");
  const [baselineData, setBaselineData] = useState("");
  const [pastImpactAchievements, setPastImpactAchievements] = useState<string[]>(["", "", ""]);

  // ── Step 7: Budget & Finance ──
  const [annualBudget, setAnnualBudget] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("USD");
  const [staffPercent, setStaffPercent] = useState(40);
  const [programmesPercent, setProgrammesPercent] = useState(40);
  const [overheadsPercent, setOverheadsPercent] = useState(20);
  const [pctGrants, setPctGrants] = useState(50);
  const [pctGovernment, setPctGovernment] = useState(20);
  const [pctCorporate, setPctCorporate] = useState(20);
  const [pctSelfGenerated, setPctSelfGenerated] = useState(10);
  const [fundingGap, setFundingGap] = useState("");
  const [typicalGrantSize, setTypicalGrantSize] = useState("");
  const [financialSystem, setFinancialSystem] = useState("");
  const [hasDedicatedBank, setHasDedicatedBank] = useState(false);
  const [cofundingAvailable, setCofundingAvailable] = useState(false);
  const [cofundingDescription, setCofundingDescription] = useState("");

  // ── Step 8: Team & Capacity ──
  const [fteCount, setFteCount] = useState("");
  const [parttimeCount, setParttimeCount] = useState("");
  const [volunteerCount, setVolunteerCount] = useState("");
  const [boardCount, setBoardCount] = useState("");
  const [hasGrantWriter, setHasGrantWriter] = useState(false);
  const [ceoName, setCeoName] = useState("");
  const [ceoBio, setCeoBio] = useState("");
  const [keyStaff, setKeyStaff] = useState<Array<{ name: string; title: string; qualification: string; experience: string }>>([]);
  const [hasBBBEE, setHasBBBEE] = useState(false);
  const [bbbeeLevel, setBbbeeLevel] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [hasStrategicPlan, setHasStrategicPlan] = useState("");
  const [strategicPlanPeriod, setStrategicPlanPeriod] = useState("");
  const [orgAchievements, setOrgAchievements] = useState<string[]>(["", "", ""]);
  const [governanceStructure, setGovernanceStructure] = useState("");

  // ── Step 9: Past Funding & Partnerships ──
  const [hasReceivedGrants, setHasReceivedGrants] = useState(false);
  const [pastFundersDetailed, setPastFundersDetailed] = useState<Array<{
    name: string; amount: string; year: string; project: string; outcome: string;
  }>>([]);
  const [largestGrant, setLargestGrant] = useState("");
  const [totalFunding3yr, setTotalFunding3yr] = useState("");
  const [grantManagement, setGrantManagement] = useState("");
  const [proudAchievement, setProudAchievement] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [partnershipAppetite, setPartnershipAppetite] = useState("");
  const [partnershipRole, setPartnershipRole] = useState("");
  const [partnershipBrings, setPartnershipBrings] = useState<string[]>([]);
  const [partnershipSeeks, setPartnershipSeeks] = useState<string[]>([]);
  const [partnershipStatement, setPartnershipStatement] = useState("");
  const [isDiscoverable, setIsDiscoverable] = useState(true);

  // ── Focus areas (used in Step 2 context) ──
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [focusPriority, setFocusPriority] = useState<Record<string, string>>({});

  // ── Document uploads ──
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // ── AI loading states ──
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // ── Saving ──
  const [saving, setSaving] = useState(false);

  // ── Completeness ──
  const completeness = (() => {
    let score = 0;
    // Step 1: 10 pts
    if (orgName) score += 2.5; if (orgType) score += 2.5; if (regNumber) score += 2.5; if (isAudited || lastAuditYear) score += 2.5;
    // Step 2: 20 pts
    if (mission) score += 5; if (theoryOfChange || tocAction) score += 5; if (selectedBeneficiaries.length > 0) score += 5; if (impactStatement) score += 5;
    // Step 3: 15 pts
    if (problemStatement) score += 5; if (problemEvidence.filter(Boolean).length >= 2) score += 5; if (whyYourOrg) score += 5;
    // Step 4: 20 pts
    const p = programmes[0]; if (p?.name) score += 5; if (p?.fullDesc) score += 5;
    if (p?.activities?.filter(Boolean).length >= 3) score += 5; if (p?.outputs?.filter(Boolean).length >= 2) score += 5;
    // Step 5: 10 pts
    if (primaryTargetGroup) score += 3.3; if (beneficiarySelection) score += 3.3; if (directBeneficiaries) score += 3.4;
    // Step 6: 15 pts
    if (keyOutcomes.filter(Boolean).length >= 3) score += 5; if (indicators.filter(i => i.name).length >= 3) score += 5;
    if (dataCollectionMethods.length > 0) score += 5;
    // Step 7: 10 pts — normalised from 120 → 100
    if (annualBudget) score += 3.3; if (fundingGap) score += 3.3; if (pctGrants > 0) score += 3.4;
    // Step 8: legacy from 120
    // Step 9: legacy from 120
    return Math.min(100, Math.round(score * (100 / 120) * (120 / 100)));
  })();

  // ── Load existing org ──
  useEffect(() => {
    const loadOrg = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: org } = await supabase.from("organisations").select("*").eq("user_id", user.id).maybeSingle();
      if (org) {
        setOrgId(org.id);
        if (org.onboarding_complete) { navigate("/dashboard"); return; }
        // Pre-fill from existing data
        if (org.name) setOrgName(org.name);
        if (org.trading_name) setTradingName(org.trading_name);
        if (org.org_type) setOrgType(org.org_type);
        if (org.registration_number) setRegNumber(org.registration_number);
        if (org.country) setCountry(org.country);
        if (org.region) setRegion(org.region);
        if (org.founded_year) setYearEstablished(String(org.founded_year));
        if (org.tax_status) setTaxStatus(org.tax_status);
        if (org.pbo_number) setPboNumber(org.pbo_number);
        if (org.is_audited) setIsAudited(org.is_audited);
        if (org.last_audit_year) setLastAuditYear(String(org.last_audit_year));
        if (org.mission_statement) setMission(org.mission_statement);
        if (org.vision_statement) setVision(org.vision_statement);
        if (org.core_values) setCoreValues(org.core_values);
        if (org.theory_of_change) setTheoryOfChange(org.theory_of_change);
        if (org.beneficiary_groups) setSelectedBeneficiaries(org.beneficiary_groups);
        if (org.annual_beneficiary_reach) setBeneficiaryReach(String(org.annual_beneficiary_reach));
        if (org.impact_statement) setImpactStatement(org.impact_statement);
        if (org.focus_areas) setSelectedFocus(org.focus_areas);
        if (org.sdgs) setSelectedSDGs(org.sdgs);
        if (org.onboarding_step) setStep(Math.min(org.onboarding_step, 8));
        if ((org as any).problem_statement) setProblemStatement((org as any).problem_statement);
        if ((org as any).problem_root_causes) setProblemRootCauses((org as any).problem_root_causes);
        if ((org as any).why_your_org) setWhyYourOrg((org as any).why_your_org);
        if ((org as any).primary_target_group) setPrimaryTargetGroup((org as any).primary_target_group);
        if ((org as any).beneficiary_selection_criteria) setBeneficiarySelection((org as any).beneficiary_selection_criteria);
        if ((org as any).direct_beneficiaries_annual) setDirectBeneficiaries(String((org as any).direct_beneficiaries_annual));
        if ((org as any).indirect_beneficiaries_annual) setIndirectBeneficiaries(String((org as any).indirect_beneficiaries_annual));
        if (org.fte_count) setFteCount(String(org.fte_count));
        if (org.parttime_count) setParttimeCount(String(org.parttime_count));
        if (org.volunteer_count) setVolunteerCount(String(org.volunteer_count));
        if (org.board_count) setBoardCount(String(org.board_count));
        if (org.ceo_name) setCeoName(org.ceo_name);
        if (org.has_grant_writer) setHasGrantWriter(org.has_grant_writer);
        if (org.annual_budget) setAnnualBudget(String(org.annual_budget));
        if (org.funding_gap) setFundingGap(String(org.funding_gap));
        if (org.pct_grants) setPctGrants(org.pct_grants);
        if (org.pct_government) setPctGovernment(org.pct_government);
        if (org.pct_corporate) setPctCorporate(org.pct_corporate);
        if (org.has_bbbee) setHasBBBEE(org.has_bbbee);
        if (org.bbbee_level) setBbbeeLevel(String(org.bbbee_level));
        if (org.has_strategic_plan) setHasStrategicPlan(org.has_strategic_plan ? "yes" : "no");
        if (org.has_me_framework) setHasMEFramework(org.has_me_framework ? "yes" : "no");
        if (org.partnership_open !== null) setPartnershipAppetite(org.partnership_open ? "open" : "not_looking");
        if (org.partnership_role) setPartnershipRole(org.partnership_role);
        if (org.partnership_statement) setPartnershipStatement(org.partnership_statement);
        if (org.is_discoverable) setIsDiscoverable(org.is_discoverable);
        if (org.largest_grant_range) setLargestGrant(org.largest_grant_range);
        if (org.total_funding_3yr) setTotalFunding3yr(org.total_funding_3yr);
        if (org.funding_achievement) setProudAchievement(org.funding_achievement);
      }
    };
    loadOrg();
  }, [navigate]);

  // ── AI Assist functions ──
  const generateMission = useCallback(async () => {
    setAiLoading("mission");
    try {
      const keywords = prompt("Enter 5-8 keywords about your work (e.g. youth, education, Western Cape, after school):");
      if (!keywords) { setAiLoading(null); return; }
      const result = await callAI([
        { role: "system", content: "You are helping an African NGO write a concise, compelling mission statement. Write 1 option: 2 sentences, present tense, active voice, specific about WHO you serve and WHAT you do. No jargon." },
        { role: "user", content: `Keywords: ${keywords}. Country: ${country}. Org type: ${orgType}. Return only the mission statement text.` },
      ]);
      setMission(result);
      toast({ title: "Mission generated!", description: "Edit it to make it yours." });
    } catch { toast({ title: "AI unavailable", variant: "destructive" }); }
    setAiLoading(null);
  }, [country, orgType]);

  const generateToC = useCallback(async () => {
    if (!tocAction || !tocPopulation || !tocChange) {
      toast({ title: "Fill in the If-Then fields first", variant: "destructive" }); return;
    }
    setAiLoading("toc");
    try {
      const result = await callAI([
        { role: "system", content: "You are helping an African NGO articulate their Theory of Change. Write a 200-word paragraph that opens with the problem, describes the intervention, explains the mechanism of change, and states outcomes. First person plural. Professional but not bureaucratic." },
        { role: "user", content: `Mission: ${mission}\nIf we: ${tocAction}\nWith/for: ${tocPopulation}\nThen: ${tocChange}\nBecause: ${tocMechanism}\nCountry: ${country}` },
      ]);
      setTheoryOfChange(result);
      toast({ title: "Theory of Change generated!" });
    } catch { toast({ title: "AI unavailable", variant: "destructive" }); }
    setAiLoading(null);
  }, [tocAction, tocPopulation, tocChange, tocMechanism, mission, country]);

  const generateProblemStatement = useCallback(async () => {
    setAiLoading("problem");
    try {
      const result = await callAI([
        { role: "system", content: "Write a compelling 200-word problem statement for a grant proposal. Open with a striking fact, name specific geography and population, explain root causes, cite evidence patterns. First person plural." },
        { role: "user", content: `Focus: ${selectedFocus.join(", ")}\nGeography: ${country}, ${region}\nMission: ${mission}\nBeneficiaries: ${selectedBeneficiaries.join(", ")}` },
      ]);
      setProblemStatement(result);
      toast({ title: "Problem statement generated!" });
    } catch { toast({ title: "AI unavailable", variant: "destructive" }); }
    setAiLoading(null);
  }, [selectedFocus, country, region, mission, selectedBeneficiaries]);

  const generateIndicators = useCallback(async () => {
    setAiLoading("indicators");
    try {
      const result = await callAIJSON<Array<{ indicator: string; type: string; example_baseline: string; example_target: string; measurement_method: string; measurement_frequency: string }>>(
        [
          { role: "system", content: "You are an M&E specialist. Generate 3 SMART indicators. Return JSON array with objects having: indicator, type (output|outcome), example_baseline, example_target, measurement_method, measurement_frequency." },
          { role: "user", content: `Outcomes: ${keyOutcomes.filter(Boolean).join("; ")}\nProgrammes: ${programmes.map(p => p.name).filter(Boolean).join(", ")}\nBeneficiaries: ${primaryTargetGroup}\nCountry: ${country}` },
        ]
      );
      if (Array.isArray(result)) {
        setIndicators(result.map(r => ({
          name: r.indicator, type: r.type, baseline: r.example_baseline,
          target: r.example_target, method: r.measurement_method, frequency: r.measurement_frequency,
        })));
        toast({ title: "Indicators generated!" });
      }
    } catch { toast({ title: "AI unavailable", variant: "destructive" }); }
    setAiLoading(null);
  }, [keyOutcomes, programmes, primaryTargetGroup, country]);

  const generateCeoBio = useCallback(async () => {
    setAiLoading("bio");
    try {
      const result = await callAI([
        { role: "system", content: "Write a professional 80-word biography for a grant proposal. Third person. Highlight credibility for managing grants." },
        { role: "user", content: `Name: ${ceoName}\nOrganisation: ${orgName}\nCountry: ${country}` },
      ]);
      setCeoBio(result);
      toast({ title: "Bio generated!" });
    } catch { toast({ title: "AI unavailable", variant: "destructive" }); }
    setAiLoading(null);
  }, [ceoName, orgName, country]);

  // ── Document upload ──
  const handleDocUpload = async (docKey: string, file: File | undefined) => {
    if (!file || !orgId) return;
    setUploadingDoc(docKey);
    try {
      const filePath = `${orgId}/${docKey}_${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("org-documents").upload(filePath, file, { upsert: true });
      if (error) throw error;
      setUploadedDocs(prev => ({ ...prev, [docKey]: filePath }));
      toast({ title: "Uploaded!", description: file.name });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    setUploadingDoc(null);
  };

  // ── Programme helpers ──
  const addProgramme = () => {
    if (programmes.length < 8) {
      setProgrammes(prev => [...prev, {
        name: "", shortDesc: "", fullDesc: "", approaches: [], activities: ["", "", ""],
        outputs: ["", ""], outcomes: ["", ""], impactStory: "", areas: "", reach: "",
        reachUnit: "individuals", budget: "", status: "Active", yearStarted: "", partners: "",
      }]);
    }
  };
  const updateProgramme = (idx: number, field: string, value: any) => {
    setProgrammes(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // ── Save & Navigate ──
  const saveProgress = async (currentStep: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const baseData: any = {
        onboarding_step: currentStep,
        profile_completeness: completeness,
        name: orgName || "My Organisation",
      };
      if (orgId) {
        await supabase.from("organisations").update(baseData).eq("id", orgId);
      }
    } catch { /* silent */ }
  };

  const saveToSupabase = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const orgData: any = {
        name: orgName,
        trading_name: tradingName || null,
        org_type: orgType || null,
        registration_number: regNumber || null,
        country,
        region: region || null,
        founded_year: yearEstablished ? parseInt(yearEstablished) : null,
        tax_status: taxStatus || null,
        pbo_number: pboNumber || null,
        is_audited: isAudited,
        last_audit_year: lastAuditYear ? parseInt(lastAuditYear) : null,
        physical_address: physicalAddress || null,
        mission_statement: mission || null,
        vision_statement: vision || null,
        core_values: coreValues.length > 0 ? coreValues : null,
        theory_of_change: theoryOfChange || null,
        toc_if_then: tocAction ? `If we ${tocAction} with ${tocPopulation}, then ${tocChange} because ${tocMechanism}` : null,
        beneficiary_groups: selectedBeneficiaries.length > 0 ? selectedBeneficiaries : null,
        annual_beneficiary_reach: beneficiaryReach ? parseInt(beneficiaryReach) : null,
        beneficiary_reach_unit: beneficiaryReachUnit,
        impact_statement: impactStatement || null,
        focus_areas: selectedFocus.length > 0 ? selectedFocus : null,
        focus_priority: Object.keys(focusPriority).length > 0 ? focusPriority : null,
        sdgs: selectedSDGs.length > 0 ? selectedSDGs : null,
        primary_sdgs: primarySDGs.length > 0 ? primarySDGs : null,
        problem_statement: problemStatement || null,
        problem_evidence: problemEvidence.filter(Boolean).join("\n---\n") || null,
        problem_root_causes: problemRootCauses || null,
        problem_geographic_context: problemGeoContext || null,
        community_voice_quote: communityVoice || null,
        gap_in_services: gapInServices || null,
        why_your_org: whyYourOrg || null,
        programmes: programmes.filter(p => p.name).map(p => p.name),
        programme_details: programmes.filter(p => p.name),
        intervention_approach: programmes[0]?.approaches?.join(", ") || null,
        innovation_factor: innovationFactor || null,
        primary_target_group: primaryTargetGroup || null,
        beneficiary_selection_criteria: beneficiarySelection || null,
        beneficiary_demographics: { gender_female_pct: genderFemale, vulnerability_factors: vulnerabilityFactors },
        direct_beneficiaries_annual: directBeneficiaries ? parseInt(directBeneficiaries) : null,
        indirect_beneficiaries_annual: indirectBeneficiaries ? parseInt(indirectBeneficiaries) : null,
        beneficiary_participation: beneficiaryParticipation || null,
        key_outcomes: keyOutcomes.filter(Boolean),
        impact_indicators: indicators.filter(i => i.name),
        data_collection_methods: dataCollectionMethods,
        reporting_frequency: reportingFrequency || null,
        has_me_framework: hasMEFramework === "yes",
        mne_framework_description: mneDescription || null,
        baseline_data: baselineData || null,
        past_impact_achievements: pastImpactAchievements.filter(Boolean).join("\n---\n") || null,
        annual_budget: annualBudget ? parseFloat(annualBudget) : null,
        annual_budget_currency: budgetCurrency,
        budget_breakdown: { staff: staffPercent, programmes: programmesPercent, overheads: overheadsPercent },
        funding_sources_detail: { grants: pctGrants, government: pctGovernment, corporate: pctCorporate, self_generated: pctSelfGenerated },
        funding_gap: fundingGap ? parseFloat(fundingGap) : null,
        typical_grant_size_range: typicalGrantSize || null,
        financial_management_system: financialSystem || null,
        has_dedicated_bank_account: hasDedicatedBank,
        cofunding_available: cofundingAvailable,
        cofunding_description: cofundingDescription || null,
        pct_grants: pctGrants,
        pct_government: pctGovernment,
        pct_corporate: pctCorporate,
        fte_count: fteCount ? parseInt(fteCount) : null,
        parttime_count: parttimeCount ? parseInt(parttimeCount) : null,
        volunteer_count: volunteerCount ? parseInt(volunteerCount) : null,
        board_count: boardCount ? parseInt(boardCount) : null,
        has_grant_writer: hasGrantWriter,
        ceo_name: ceoName || null,
        executive_director_bio: ceoBio || null,
        key_staff: keyStaff.length > 0 ? keyStaff : null,
        has_bbbee: hasBBBEE,
        bbbee_level: bbbeeLevel ? parseInt(bbbeeLevel) : null,
        has_policies: selectedPolicies.length > 0,
        policies_list: selectedPolicies.length > 0 ? selectedPolicies : null,
        has_strategic_plan: hasStrategicPlan === "yes",
        strategic_plan_period: strategicPlanPeriod || null,
        governance_structure: governanceStructure || null,
        organisational_achievements: orgAchievements.filter(Boolean).join("\n---\n") || null,
        past_funders_detailed: pastFundersDetailed.length > 0 ? pastFundersDetailed : null,
        largest_grant_range: largestGrant || null,
        total_funding_3yr: totalFunding3yr || null,
        grant_management_experience: grantManagement || null,
        funding_achievement: proudAchievement || null,
        lessons_learned: lessonsLearned || null,
        partnership_open: partnershipAppetite === "open" || partnershipAppetite === "selective",
        partnership_role: partnershipRole || null,
        partnership_strengths: partnershipBrings.length > 0 ? partnershipBrings : null,
        partnership_seeks: partnershipSeeks.length > 0 ? partnershipSeeks : null,
        partnership_statement: partnershipStatement || null,
        is_discoverable: isDiscoverable,
        onboarding_complete: true,
        onboarding_step: 9,
        profile_completeness: completeness,
      };

      if (orgId) {
        const { error: updateErr } = await supabase.from("organisations").update(orgData).eq("id", orgId);
        if (updateErr) throw updateErr;
      } else {
        const { data, error: insertErr } = await supabase.from("organisations").insert({ ...orgData, user_id: user.id }).select("id").single();
        if (insertErr) throw insertErr;
        if (data) setOrgId(data.id);
      }

      // Save programme details to separate table
      if (orgId) {
        for (const prog of programmes.filter(p => p.name)) {
          await supabase.from("programme_details").upsert({
            org_id: orgId,
            programme_name: prog.name,
            description: prog.shortDesc,
            detailed_description: prog.fullDesc,
            activities: prog.activities.filter(Boolean),
            key_outputs: prog.outputs.filter(Boolean),
            key_outcomes: prog.outcomes.filter(Boolean),
            success_story: prog.impactStory,
            geographic_areas: prog.areas ? prog.areas.split(",").map(s => s.trim()) : [],
            annual_reach: prog.reach ? parseInt(prog.reach) : null,
            annual_budget_range: prog.budget,
            status: prog.status.toLowerCase(),
            year_started: prog.yearStarted ? parseInt(prog.yearStarted) : null,
            intervention_approaches: prog.approaches,
            partner_organisations: prog.partners ? prog.partners.split(",").map(s => s.trim()) : [],
          }, { onConflict: "id" });
        }
      }

      toast({ title: "🎉 Onboarding complete!", description: "Welcome to your dashboard!" });
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const next = () => {
    if (step < 8) { setStep(step + 1); saveProgress(step + 1); }
    else saveToSupabase();
  };

  const toggleFocus = (key: string) => {
    setSelectedFocus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const fillDummyData = () => {
    // Step 1: Legal Identity
    setOrgName("Bright Futures Foundation");
    setTradingName("BFF");
    setOrgType("NPC");
    setRegNumber("2018/123456/08");
    setCountry("South Africa");
    setRegion("Western Cape");
    setYearEstablished("2018");
    setTaxStatus("Tax exempt - Section 18A");
    setPboNumber("930067890");
    setIsAudited(true);
    setLastAuditYear("2025");
    setPhysicalAddress("42 Hope Street, Woodstock, Cape Town, 7925");
    // Step 2: Mission & ToC
    setMission("Bright Futures Foundation empowers vulnerable youth in under-resourced communities through quality education, life skills training, and mentorship programmes. We build resilient young leaders who break cycles of poverty and contribute positively to their communities.");
    setVision("A South Africa where every young person has the opportunity and support to reach their full potential, regardless of their background.");
    setCoreValues(["Ubuntu", "Dignity", "Empowerment", "Accountability", "Innovation"]);
    setTocAction("provide after-school education, mentorship and life skills programmes");
    setTocPopulation("youth aged 13-24 in under-resourced communities in Cape Town");
    setTocChange("they will complete school, gain employable skills, and become community leaders");
    setTocMechanism("consistent support, safe spaces, and positive role models build confidence and capability");
    setTheoryOfChange("In the Western Cape, youth unemployment exceeds 55% and school dropout rates in township communities are alarmingly high. We believe that if we provide consistent after-school academic support, life skills training, and mentorship to youth aged 13-24 in under-resourced communities, then they will complete their schooling, develop employable skills, and become active community leaders. This is because consistent engagement with caring adults in safe spaces builds self-confidence, academic competence, and social-emotional resilience — the foundations needed to break intergenerational cycles of poverty.");
    setSelectedBeneficiaries(["youth_13_24", "children_0_12", "women_girls", "community"]);
    setBeneficiaryReach("2500");
    setBeneficiaryReachUnit("individuals");
    setImpactStatement("Since 2018, we have supported over 8,000 young people, achieving a 92% school retention rate and placing 340 youth in employment or further education.");
    setSelectedSDGs([1, 4, 5, 8, 10, 11]);
    setPrimarySDGs(["Quality Education", "No Poverty", "Decent Work"]);
    setSelectedFocus(["youth", "education_ecd", "poverty_livelihood", "entrepreneur_skills_vocational", "community_development"]);
    setFocusPriority({ youth: "primary", education_ecd: "primary", poverty_livelihood: "secondary", entrepreneur_skills_vocational: "secondary", community_development: "tertiary" });
    // Step 3: Problem
    setProblemStatement("In the Cape Flats and surrounding township communities, over 60% of young people are not in education, employment, or training (NEET). Gang violence, substance abuse, and a lack of safe recreational spaces leave youth vulnerable to exploitation. Schools are under-resourced with learner-to-teacher ratios exceeding 45:1, and fewer than 40% of Grade 12 learners achieve a Bachelor's pass. Without targeted intervention, these young people face a future of unemployment and social exclusion.");
    setProblemEvidence([
      "Western Cape Education Department data shows only 38.2% Bachelor pass rate in quintile 1-3 schools (2024).",
      "Stats SA Q4 2024 reports 55.3% youth unemployment rate for 15-24 age group in Western Cape.",
      "SAPS crime statistics show 47% of violent crime in Cape Town involves youth under 25.",
    ]);
    setProblemRootCauses("Structural inequality rooted in apartheid-era spatial planning continues to concentrate poverty. Under-resourced schools, absent parents due to shift work, gang recruitment from age 10, lack of safe after-school spaces, and limited exposure to career opportunities create a cycle of hopelessness.");
    setProblemGeoContext("We operate in Khayelitsha, Nyanga, Gugulethu, Mitchells Plain, and Manenberg — five of Cape Town's most underserved communities with the highest crime and unemployment rates.");
    setCommunityVoice("\"Before BFF, I had nowhere to go after school. Now I have a second family and I'm going to university.\" — Thandi, 19, Khayelitsha");
    setGapInServices("Most existing youth programmes operate only during school hours or focus on a single intervention. There is no integrated model combining academic support, psychosocial services, and career pathways in these communities.");
    setWhyYourOrg("We are trusted community insiders with 6 years of proven track record. Our staff come from the communities we serve, and our integrated model addresses academic, social, and economic barriers simultaneously.");
    // Step 4: Programmes
    setProgrammes([
      {
        name: "After-School Academy", shortDesc: "Daily academic support and homework assistance for grades 7-12",
        fullDesc: "Our flagship programme provides structured after-school academic support 5 days a week across 8 community centres. Trained facilitators offer homework help, exam preparation, and supplementary lessons in Maths, English, and Science. Each learner receives an individualised learning plan.",
        approaches: ["Direct service delivery", "Peer education"], activities: ["Daily homework sessions", "Weekly tutoring in Maths & Science", "Monthly career talks"],
        outputs: ["1,200 learners supported annually", "4,800 tutoring sessions delivered"], outcomes: ["85% of participants pass all subjects", "92% school retention rate"],
        impactStory: "Sipho joined our programme in Grade 9 struggling with Maths. After 2 years of consistent support, he achieved 78% in Matric Maths and is now studying Engineering at UCT on a bursary.",
        areas: "Khayelitsha, Nyanga, Gugulethu", reach: "1200", reachUnit: "individuals", budget: "R1,800,000", status: "Active", yearStarted: "2018", partners: "WCED, Teach SA",
      },
      {
        name: "Youth Leadership Accelerator", shortDesc: "18-month leadership and employability programme for 18-24 year olds",
        fullDesc: "An intensive programme that combines life skills workshops, digital literacy training, entrepreneurship modules, and workplace readiness. Participants complete a community project and receive mentorship from industry professionals.",
        approaches: ["Capacity building / training", "Community mobilisation"], activities: ["Weekly life skills workshops", "Monthly entrepreneurship masterclasses", "Quarterly community projects"],
        outputs: ["200 youth trained annually", "40 community projects completed"], outcomes: ["70% employment or further education within 6 months", "50 micro-enterprises launched"],
        impactStory: "Ayanda completed our accelerator and started a mobile car wash business employing 3 other youth from her community.",
        areas: "Mitchells Plain, Manenberg", reach: "200", reachUnit: "individuals", budget: "R950,000", status: "Active", yearStarted: "2020", partners: "Harambee, Youth Employment Service",
      },
    ]);
    setInnovationFactor("We use a peer-education model where graduated participants become facilitators, creating a self-sustaining pipeline of community leaders who understand local challenges firsthand.");
    // Step 5: Beneficiaries
    setPrimaryTargetGroup("Youth aged 13-24 from low-income households in Cape Town's township communities, with priority given to orphans, child-headed households, and those at risk of gang recruitment.");
    setBeneficiarySelection("Referrals from schools, social workers, and community leaders. Selection criteria include household income below R5,000/month, school attendance challenges, and geographic location within our operational areas.");
    setGenderFemale(58);
    setDirectBeneficiaries("2500");
    setIndirectBeneficiaries("7500");
    setBeneficiaryParticipation("Youth Advisory Council meets monthly to shape programme design. Annual satisfaction surveys. Participant representatives sit on our programme committee.");
    setVulnerabilityFactors(["Orphans & vulnerable children", "Child-headed households", "Gang-affected youth", "School dropouts", "GBV survivors"]);
    // Step 6: Impact & M&E
    setKeyOutcomes(["Improved academic performance (average 15% grade increase)", "Increased school retention to 92%", "70% of graduates employed or in further education within 12 months"]);
    setIndicators([
      { name: "School retention rate", type: "outcome", baseline: "72%", target: "92%", method: "School records tracking", frequency: "quarterly" },
      { name: "Grade improvement", type: "outcome", baseline: "Average 45%", target: "Average 60%", method: "Pre/post assessments", frequency: "quarterly" },
      { name: "Youth employed/studying post-programme", type: "outcome", baseline: "30%", target: "70%", method: "6-month follow-up surveys", frequency: "biannually" },
    ]);
    setDataCollectionMethods(["Pre/post surveys or assessments", "Attendance registers", "School or institution records", "Individual interviews", "Digital data collection (KoBoToolbox, ODK, Google Forms)"]);
    setHasMEFramework("yes");
    setMneDescription("We use a custom outcomes framework aligned to the National Youth Policy. Data is collected via KoBoToolbox, analysed quarterly, and reported to stakeholders. An independent evaluation was conducted in 2024 by UCT's Development Policy Research Unit.");
    setReportingFrequency("quarterly");
    setBaselineData("Baseline assessments conducted at enrolment capture academic levels, socio-economic status, psychosocial wellbeing (using the SDQ), and digital literacy. Community baselines updated biennially using Stats SA ward-level data.");
    setPastImpactAchievements(["92% school retention rate vs 72% community average", "340 youth placed in employment or further education since 2020", "Named Best Youth Programme by Western Cape Department of Social Development 2024"]);
    // Step 7: Budget & Finance
    setAnnualBudget("4200000");
    setBudgetCurrency("USD");
    setStaffPercent(35);
    setProgrammesPercent(50);
    setOverheadsPercent(15);
    setPctGrants(60);
    setPctGovernment(15);
    setPctCorporate(20);
    setPctSelfGenerated(5);
    setFundingGap("1200000");
    setTypicalGrantSize("R200,000 - R500,000");
    setFinancialSystem("Pastel Accounting with monthly reconciliation. Dedicated finance officer. Annual external audit by PKF.");
    setHasDedicatedBank(true);
    setCofundingAvailable(true);
    setCofundingDescription("We can co-fund up to 30% of project costs through existing operational budget and in-kind contributions including venue space and staff time.");
    // Step 8: Team & Capacity
    setFteCount("12");
    setParttimeCount("8");
    setVolunteerCount("45");
    setBoardCount("7");
    setHasGrantWriter(true);
    setCeoName("Nomvula Mkhize");
    setCeoBio("Nomvula Mkhize has led Bright Futures Foundation since its inception in 2018. With 15 years of experience in youth development and a Master's in Social Development from UCT, she has secured over R20 million in grant funding. Previously, she managed programmes at the DG Murray Trust and served on the Western Cape Youth Commission.");
    setKeyStaff([
      { name: "James Petersen", title: "Programme Director", qualification: "BA Social Work (UWC)", experience: "10 years in youth development" },
      { name: "Fatima Adams", title: "M&E Manager", qualification: "MPH (Stellenbosch)", experience: "8 years in programme evaluation" },
      { name: "Thabo Ndlovu", title: "Finance Officer", qualification: "BCom Accounting (UNISA)", experience: "6 years in NGO finance" },
    ]);
    setHasBBBEE(true);
    setBbbeeLevel("2");
    setSelectedPolicies(["Child protection / safeguarding", "Financial management", "HR / employment", "Anti-fraud and corruption", "Data protection (POPIA)", "Health & safety"]);
    setHasStrategicPlan("yes");
    setStrategicPlanPeriod("2024-2028");
    setOrgAchievements(["Recipient of the National Lottery Commission Community Builder Award 2023", "Featured in Mail & Guardian Top 200 NGOs 2024", "Successfully managed 14 grants simultaneously with zero compliance findings"]);
    setGovernanceStructure("7-member Board of Directors meeting quarterly, with Finance, Programme, and HR sub-committees. Board includes legal, financial, education, and community representation. Annual AGM with published financial statements.");
    // Step 9: Past Funding & Partnerships
    setHasReceivedGrants(true);
    setPastFundersDetailed([
      { name: "National Lottery Commission", amount: "R2,500,000", year: "2023", project: "After-School Academy Expansion", outcome: "Expanded from 4 to 8 centres" },
      { name: "DG Murray Trust", amount: "R1,200,000", year: "2022", project: "Youth Leadership Accelerator", outcome: "200 youth trained, 70% employment rate" },
      { name: "FirstRand Foundation", amount: "R800,000", year: "2024", project: "Digital Skills Programme", outcome: "150 youth gained digital certificates" },
    ]);
    setLargestGrant("R2,500,000");
    setTotalFunding3yr("R8,500,000");
    setGrantManagement("Dedicated grant management system with milestone tracking, financial reporting aligned to donor templates, and quarterly narrative reports. 100% compliance record across all grants.");
    setProudAchievement("Securing multi-year funding from the DG Murray Trust based on our independently verified outcomes data — they cited our M&E rigour as the deciding factor.");
    setLessonsLearned("Early programme iterations focused too heavily on academics alone. We learned that holistic support addressing psychosocial needs, family dynamics, and career exposure is essential for sustainable impact. This insight transformed our model.");
    setPartnershipAppetite("open");
    setPartnershipRole("lead");
    setPartnershipBrings(["Strong community networks and trust", "Proven programme model with outcome data", "M&E expertise and systems"]);
    setPartnershipSeeks(["Technical skills training capacity", "Corporate mentorship networks", "Digital platform development"]);
    setPartnershipStatement("We actively seek partnerships that complement our youth development expertise with technical and vocational training capacity. Our community trust and programme infrastructure provide an ideal platform for partners looking to reach underserved youth in Cape Town.");
    setIsDiscoverable(true);

    toast({ title: "🧪 Dummy data loaded!", description: "All 9 steps pre-filled with test data. Review and submit." });
  };

  // ── RENDER ──
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">GrantMatch</span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button variant="outline" size="sm" className="text-xs border-amber-500/50 text-amber-600 hover:bg-amber-50" onClick={fillDummyData}>
              🧪 Insert Dummy Data
            </Button>
          )}
          <span className="text-xs text-muted-foreground hidden sm:inline">Profile: {completeness}%</span>
          <Progress value={completeness} className="w-20 sm:w-28 h-1.5" />
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { saveProgress(step); toast({ title: "Progress saved!" }); navigate("/dashboard"); }}>
            <Save className="h-3 w-3 mr-1" /> Save & exit
          </Button>
        </div>
      </div>

      {/* Info quality note + document upload */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium mb-1">Why so many questions?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Although it is a lot of info upfront, a good quality amount of information will help us design great proposals tailored specifically to your organisation. The more detail you provide, the stronger your AI-generated proposals will be.</p>
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-primary hover:text-primary/80 transition-colors">
                <Upload className="h-4 w-4" />
                <span className="font-medium">Upload an Annual Report to pre-fill fields</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    toast({ title: "📄 Document received", description: `Processing ${file.name}... This may take a minute.` });
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const resp = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
                        {
                          method: "POST",
                          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
                          body: formData,
                        }
                      );
                      if (!resp.ok) {
                        const err = await resp.json().catch(() => ({ error: "Parse failed" }));
                        throw new Error(err.error || `Error ${resp.status}`);
                      }
                      const { data: d } = await resp.json();
                      if (!d) throw new Error("No data extracted");
                      // Pre-fill all available fields
                      if (d.org_name) setOrgName(d.org_name);
                      if (d.trading_name) setTradingName(d.trading_name);
                      if (d.org_type) setOrgType(d.org_type);
                      if (d.registration_number) setRegNumber(d.registration_number);
                      if (d.country) setCountry(d.country);
                      if (d.region) setRegion(d.region);
                      if (d.founded_year) setYearEstablished(String(d.founded_year));
                      if (d.tax_status) setTaxStatus(d.tax_status);
                      if (d.pbo_number) setPboNumber(d.pbo_number);
                      if (d.physical_address) setPhysicalAddress(d.physical_address);
                      if (d.mission_statement) setMission(d.mission_statement);
                      if (d.vision_statement) setVision(d.vision_statement);
                      if (d.core_values?.length) setCoreValues(d.core_values);
                      if (d.problem_statement) setProblemStatement(d.problem_statement);
                      if (d.focus_areas?.length) setSelectedFocus(d.focus_areas);
                      if (d.beneficiary_groups?.length) setSelectedBeneficiaries(d.beneficiary_groups);
                      if (d.annual_beneficiary_reach) setBeneficiaryReach(String(d.annual_beneficiary_reach));
                      if (d.primary_target_group) setPrimaryTargetGroup(d.primary_target_group);
                      if (d.annual_budget) setAnnualBudget(String(d.annual_budget));
                      if (d.ceo_name) setCeoName(d.ceo_name);
                      if (d.fte_count) setFteCount(String(d.fte_count));
                      if (d.volunteer_count) setVolunteerCount(String(d.volunteer_count));
                      if (d.board_count) setBoardCount(String(d.board_count));
                      if (d.sdgs?.length) setSelectedSDGs(d.sdgs);
                      if (d.theory_of_change) setTheoryOfChange(d.theory_of_change);
                      if (d.impact_statement) setImpactStatement(d.impact_statement);
                      if (d.key_outcomes?.length) setKeyOutcomes(d.key_outcomes.length >= 3 ? d.key_outcomes : [...d.key_outcomes, ...Array(3 - d.key_outcomes.length).fill("")]);
                      if (d.is_audited !== undefined) setIsAudited(d.is_audited);
                      if (d.achievements?.length) setOrgAchievements(d.achievements.length >= 3 ? d.achievements : [...d.achievements, ...Array(3 - d.achievements.length).fill("")]);
                      if (d.programmes?.length) {
                        setProgrammes(d.programmes.map((p: any) => ({
                          name: p.name || "", shortDesc: p.description || "", fullDesc: p.description || "",
                          approaches: [], activities: ["", "", ""], outputs: ["", ""], outcomes: ["", ""],
                          impactStory: "", areas: "", reach: "", reachUnit: "individuals",
                          budget: "", status: "Active", yearStarted: "", partners: "",
                        })));
                      }
                      toast({ title: "✅ Fields pre-filled!", description: "Review and edit the extracted data across all steps." });
                    } catch (err: any) {
                      toast({ title: "Parse failed", description: err.message, variant: "destructive" });
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left sidebar — step nav (desktop) */}
        <div className="hidden lg:block w-56 border-r border-border/20 p-4 space-y-1">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                i === step ? "bg-primary/10 text-primary" : i < step ? "text-foreground/80" : "text-muted-foreground"
              }`}>
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] ${
                i < step ? "bg-emerald-500/20 text-emerald-400" : i === step ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className="truncate">{s.title}</span>
              <span className="ml-auto text-[9px] text-muted-foreground">{s.time}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Mobile stepper */}
          <div className="flex items-center gap-1 mb-4 lg:hidden overflow-x-auto pb-2">
            {steps.map((_, i) => (
              <div key={i} className="flex items-center gap-1 shrink-0">
                <button onClick={() => setStep(i)}
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-medium ${
                    i < step ? "bg-emerald-500/20 text-emerald-400" : i === step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </button>
                {i < 8 && <div className={`w-4 sm:w-8 h-0.5 rounded-full ${i < step ? "bg-emerald-500/30" : "bg-secondary"}`} />}
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <GlassCard hoverable={false} className="p-5 sm:p-8">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      {(() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
                      Step {step + 1}: {steps[step].title}
                    </h2>
                    <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{steps[step].time}</span>
                  </div>

                  {/* ═══ STEP 1: Legal Identity ═══ */}
                  {step === 0 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">Let's start with the basics. This ensures we find funders who can actually work with your organisation.
                        <WhyTooltip text="Many funders require NPO registration, audited financials, or specific legal structures." />
                      </p>
                      <div>
                        <Label className={labelClass}>Organisation Full Legal Name *</Label>
                        <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="As it appears on your registration certificate" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Trading/Common Name (if different)</Label>
                        <Input value={tradingName} onChange={e => setTradingName(e.target.value)} placeholder="Leave blank if same as legal name" className={inputClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Organisation Type *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                          {[
                            { v: "NPO", icon: "🏛️", desc: "Non-Profit Organisation" },
                            { v: "NPC", icon: "🏢", desc: "Non-Profit Company" },
                            { v: "CBO", icon: "🏘️", desc: "Community-Based Organisation" },
                            { v: "Trust", icon: "📋", desc: "Charitable Trust" },
                            { v: "Section 21", icon: "📄", desc: "Former NPC" },
                            { v: "INGO", icon: "🌍", desc: "International NGO" },
                            { v: "Other", icon: "✏️", desc: "Other" },
                          ].map(t => (
                            <button key={t.v} onClick={() => setOrgType(t.v)}
                              className={`p-2 rounded-lg text-xs border text-left ${orgType === t.v ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"}`}>
                              <span className="text-sm">{t.icon}</span> <span className="font-medium">{t.v}</span>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={labelClass}>Registration Number *</Label>
                          <Input value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="e.g. 123-456 NPO" className={inputClass} />
                        </div>
                        <div>
                          <Label className={labelClass}>Country *</Label>
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
                              <option value="">Select</option>
                              {saProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          ) : <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="Region" className={inputClass} />}
                        </div>
                        <div>
                          <Label className={labelClass}>Year Established *</Label>
                          <Input type="number" value={yearEstablished} onChange={e => setYearEstablished(e.target.value)} placeholder="2015" className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Tax Status *</Label>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {[
                            { v: "Tax exempt", icon: "✅", desc: "PBO approved" },
                            { v: "Not tax exempt", icon: "➖", desc: "Registered but not PBO" },
                            { v: "Unsure", icon: "❓", desc: "I need to check" },
                          ].map(t => (
                            <button key={t.v} onClick={() => setTaxStatus(t.v)}
                              className={`px-3 py-2 rounded-lg text-xs border ${taxStatus === t.v ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              {t.icon} {t.v}
                            </button>
                          ))}
                        </div>
                      </div>
                      {taxStatus === "Tax exempt" && (
                        <div>
                          <Label className={labelClass}>PBO Number</Label>
                          <Input value={pboNumber} onChange={e => setPboNumber(e.target.value)} placeholder="e.g. 930 123 456" className={inputClass} />
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <div>
                          <div className="text-xs text-foreground">Is your organisation audited?</div>
                          <div className="text-[10px] text-muted-foreground">Required by most funders above $250,000</div>
                        </div>
                        <Switch checked={isAudited} onCheckedChange={setIsAudited} />
                      </div>
                      {isAudited && (
                        <div>
                          <Label className={labelClass}>Last Audit Year</Label>
                          <Input type="number" value={lastAuditYear} onChange={e => setLastAuditYear(e.target.value)} placeholder="2025" className={inputClass} />
                        </div>
                      )}
                      <div>
                        <Label className={labelClass}>Physical/Business Address *</Label>
                        <Textarea value={physicalAddress} onChange={e => setPhysicalAddress(e.target.value)} placeholder="Street address, suburb, city, postal code" className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm placeholder:text-muted-foreground/60" required />
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 2: Mission & Theory of Change ═══ */}
                  {step === 1 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">This is the most important step. The AI uses your mission and Theory of Change in every proposal section it writes.
                        <WhyTooltip text="The more specific you are, the more compelling your proposals will be." />
                      </p>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className={labelClass}>Mission Statement *</Label>
                          <AIButton onClick={generateMission} loading={aiLoading === "mission"} label="Help me write this" />
                        </div>
                        <Textarea value={mission} onChange={e => setMission(e.target.value.slice(0, 500))}
                          placeholder="Example: To empower young people in underserved communities through access to quality education, mentorship and life skills..."
                          className="bg-secondary/30 border-border/50 min-h-[100px] text-foreground text-sm" />
                        <span className="text-[10px] text-muted-foreground">{mission.length}/500</span>
                      </div>
                      <div>
                        <Label className={labelClass}>Vision Statement (recommended)</Label>
                        <Textarea value={vision} onChange={e => setVision(e.target.value.slice(0, 300))}
                          placeholder="What does the world look like when your mission succeeds?"
                          className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm" />
                      </div>
                      <div>
                        <Label className={labelClass}>Core Values (up to 6)</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {coreValueOptions.map(v => (
                            <button key={v} onClick={() => setCoreValues(prev => prev.includes(v) ? prev.filter(x => x !== v) : prev.length < 6 ? [...prev, v] : prev)}
                              className={`px-2.5 py-1 rounded-full text-[11px] border ${coreValues.includes(v) ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Theory of Change — structured */}
                      <div className="space-y-2">
                        <Label className={labelClass}>Theory of Change — Structured *</Label>
                        <p className="text-[10px] text-muted-foreground">Build your Theory of Change step by step:</p>
                        <div className="space-y-2 p-3 rounded-lg bg-secondary/20 border border-border/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-primary font-medium w-16">If we...</span>
                            <Input value={tocAction} onChange={e => setTocAction(e.target.value)} placeholder="provide after-school tutoring and mentorship" className={inputClass + " flex-1"} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-primary font-medium w-16">With...</span>
                            <Input value={tocPopulation} onChange={e => setTocPopulation(e.target.value)} placeholder="young people aged 13-18 in low-income communities" className={inputClass + " flex-1"} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-primary font-medium w-16">Then...</span>
                            <Input value={tocChange} onChange={e => setTocChange(e.target.value)} placeholder="they will improve academically and develop resilience" className={inputClass + " flex-1"} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-primary font-medium w-16">Because...</span>
                            <Input value={tocMechanism} onChange={e => setTocMechanism(e.target.value)} placeholder="consistent adult support addresses barriers they face" className={inputClass + " flex-1"} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className={labelClass}>Full Theory of Change narrative</Label>
                          <AIButton onClick={generateToC} loading={aiLoading === "toc"} label="Generate from above" />
                        </div>
                        <Textarea value={theoryOfChange} onChange={e => setTheoryOfChange(e.target.value.slice(0, 1500))}
                          placeholder="A full paragraph describing how your work creates change..."
                          className="bg-secondary/30 border-border/50 min-h-[120px] text-foreground text-sm" />
                      </div>
                      {/* Beneficiary groups */}
                      <div>
                        <Label className={labelClass}>Primary Beneficiary Groups *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mt-1">
                          {beneficiaryGroups.map(b => (
                            <button key={b.key} onClick={() => setSelectedBeneficiaries(prev => prev.includes(b.key) ? prev.filter(x => x !== b.key) : [...prev, b.key])}
                              className={`p-2 rounded-lg text-xs border text-center ${selectedBeneficiaries.includes(b.key) ? "border-primary bg-primary/10" : "border-border/30 text-muted-foreground"}`}>
                              <div className="text-lg">{b.icon}</div>
                              <div className="text-[10px]">{b.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={labelClass}>Annual Beneficiary Reach *</Label>
                          <Input type="number" value={beneficiaryReach} onChange={e => setBeneficiaryReach(e.target.value)} placeholder="e.g. 500" className={inputClass} />
                        </div>
                        <div>
                          <Label className={labelClass}>Unit</Label>
                          <select value={beneficiaryReachUnit} onChange={e => setBeneficiaryReachUnit(e.target.value)} className={selectClass}>
                            <option value="individuals">Individuals</option>
                            <option value="households">Households</option>
                            <option value="communities">Communities</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Key Impact Statement (recommended)</Label>
                        <Input value={impactStatement} onChange={e => setImpactStatement(e.target.value.slice(0, 200))}
                          placeholder="e.g. We have supported 4,200 young people in the Western Cape to complete secondary school since 2016."
                          className={inputClass} />
                        <span className="text-[10px] text-muted-foreground">{impactStatement.length}/200 — This appears at the top of every proposal</span>
                      </div>
                      {/* SDGs */}
                      <div>
                        <Label className={labelClass}>SDG Alignment (recommended)</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-1">
                          {sdgGoals.map((g, i) => (
                            <button key={i} onClick={() => setSelectedSDGs(prev => prev.includes(i + 1) ? prev.filter(x => x !== i + 1) : [...prev, i + 1])}
                              className={`p-1.5 rounded-lg text-[10px] border text-center ${selectedSDGs.includes(i + 1) ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              <div className="font-bold text-xs">SDG {i + 1}</div>
                              <div className="truncate">{g}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 3: The Problem You Solve ═══ */}
                  {step === 2 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">Funders don't fund organisations — they fund solutions to problems. This is where most proposals win or lose.
                        <WhyTooltip text="The more specific your evidence, the stronger your proposals." />
                      </p>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className={labelClass}>Problem Statement *</Label>
                          <AIButton onClick={generateProblemStatement} loading={aiLoading === "problem"} label="Help me describe this" />
                        </div>
                        <Textarea value={problemStatement} onChange={e => setProblemStatement(e.target.value)}
                          placeholder="Describe the problem in your community as specifically as possible. Name the geography, population, and consequences..."
                          className="bg-secondary/30 border-border/50 min-h-[140px] text-foreground text-sm" />
                      </div>
                      <DynamicListInput items={problemEvidence} setItems={setProblemEvidence}
                        placeholder='e.g. "47% of Grade 12 learners failed Maths (WC Education Dept, 2023)"'
                        label="Evidence and Statistics * (add source where possible)" max={8} minEncouraged={2} />
                      <div>
                        <Label className={labelClass}>Root Causes *</Label>
                        <Textarea value={problemRootCauses} onChange={e => setProblemRootCauses(e.target.value.slice(0, 600))}
                          placeholder="What are the root causes of this problem? (not symptoms)"
                          className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground text-sm" />
                      </div>
                      <div>
                        <Label className={labelClass}>Why is this problem severe in your area? *</Label>
                        <Textarea value={problemGeoContext} onChange={e => setProblemGeoContext(e.target.value.slice(0, 500))}
                          placeholder="What makes this problem particularly acute in the community you serve?"
                          className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground text-sm" />
                      </div>
                      <div>
                        <Label className={labelClass}>Community Voice (recommended)</Label>
                        <Textarea value={communityVoice} onChange={e => setCommunityVoice(e.target.value.slice(0, 300))}
                          placeholder="A direct quote from a beneficiary or community member..."
                          className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm" />
                      </div>
                      <div>
                        <Label className={labelClass}>Gap in Services *</Label>
                        <Textarea value={gapInServices} onChange={e => setGapInServices(e.target.value.slice(0, 500))}
                          placeholder="What services exist and what critical gap does your organisation fill?"
                          className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground text-sm" />
                      </div>
                      <div>
                        <Label className={labelClass}>Why Your Organisation Specifically *</Label>
                        <Textarea value={whyYourOrg} onChange={e => setWhyYourOrg(e.target.value.slice(0, 500))}
                          placeholder="Why is YOUR org uniquely positioned? Community roots, years of presence, trust built..."
                          className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground text-sm" />
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 4: Programmes ═══ */}
                  {step === 3 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">Describe exactly what you do. The AI uses this to write your methodology — the section that tells funders how you'll spend their money.
                        <WhyTooltip text="Be specific: not 'we run workshops' but 'we run weekly 2-hour tutoring sessions for groups of 15 learners'." />
                      </p>
                      {/* Focus area selection embedded here */}
                      <div>
                        <Label className={labelClass}>Focus Areas (select all that apply, min 2) *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mt-1 max-h-64 overflow-y-auto">
                          {focusAreas.map(f => (
                            <button key={f.key} onClick={() => toggleFocus(f.key)}
                              className={`p-1.5 rounded-lg text-[10px] border text-center ${selectedFocus.includes(f.key) ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              <div className="text-sm">{f.icon}</div>
                              <div className="truncate">{f.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      {programmes.map((prog, idx) => (
                        <GlassCard key={idx} hoverable={false} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">Programme {idx + 1}</h4>
                            {programmes.length > 1 && (
                              <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => setProgrammes(p => p.filter((_, i) => i !== idx))}>Remove</Button>
                            )}
                          </div>
                          <div>
                            <Label className={labelClass}>Programme Name *</Label>
                            <Input value={prog.name} onChange={e => updateProgramme(idx, "name", e.target.value)} placeholder="e.g. AfterSchool Tutoring Programme" className={inputClass} />
                          </div>
                          <div>
                            <Label className={labelClass}>One-sentence description *</Label>
                            <Input value={prog.shortDesc} onChange={e => updateProgramme(idx, "shortDesc", e.target.value.slice(0, 150))} placeholder="e.g. Daily after-school tutoring for Grade 8-12 learners" className={inputClass} />
                          </div>
                          <div>
                            <Label className={labelClass}>Full Programme Description *</Label>
                            <Textarea value={prog.fullDesc} onChange={e => updateProgramme(idx, "fullDesc", e.target.value.slice(0, 1000))}
                              placeholder="Describe how this programme works from start to finish..."
                              className="bg-secondary/30 border-border/50 min-h-[100px] text-foreground text-sm" />
                          </div>
                          <div>
                            <Label className={labelClass}>Intervention Approach</Label>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {interventionApproaches.map(a => (
                                <button key={a} onClick={() => updateProgramme(idx, "approaches", prog.approaches.includes(a) ? prog.approaches.filter(x => x !== a) : [...prog.approaches, a])}
                                  className={`px-2 py-1 rounded-full text-[10px] border ${prog.approaches.includes(a) ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                                  {a}
                                </button>
                              ))}
                            </div>
                          </div>
                          <DynamicListInput items={prog.activities} setItems={v => updateProgramme(idx, "activities", v)}
                            placeholder="e.g. Weekly 3-hour tutoring sessions in Maths, English, Science" label="Specific Activities * (min 3)" max={8} minEncouraged={3} />
                          <DynamicListInput items={prog.outputs} setItems={v => updateProgramme(idx, "outputs", v)}
                            placeholder="e.g. 480 learners tutored per year across 7 schools" label="Key Outputs * (min 2)" max={6} minEncouraged={2} />
                          <DynamicListInput items={prog.outcomes} setItems={v => updateProgramme(idx, "outcomes", v)}
                            placeholder="e.g. Improved Mathematics results in Grade 10-12" label="Key Outcomes * (min 2)" max={6} minEncouraged={2} />
                          <div>
                            <Label className={labelClass}>Impact Story (recommended)</Label>
                            <Textarea value={prog.impactStory} onChange={e => updateProgramme(idx, "impactStory", e.target.value.slice(0, 500))}
                              placeholder="Tell us about one person whose life changed..."
                              className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className={labelClass}>Geographic Areas *</Label>
                              <Input value={prog.areas} onChange={e => updateProgramme(idx, "areas", e.target.value)} placeholder="e.g. Mitchells Plain, Bonteheuwel" className={inputClass} />
                            </div>
                            <div>
                              <Label className={labelClass}>Annual Reach *</Label>
                              <Input type="number" value={prog.reach} onChange={e => updateProgramme(idx, "reach", e.target.value)} placeholder="480" className={inputClass} />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className={labelClass}>Budget Range</Label>
                              <select value={prog.budget} onChange={e => updateProgramme(idx, "budget", e.target.value)} className={selectClass}>
                                <option value="">Select</option>
                                <option value="under_100k">Under $100k</option>
                                <option value="100k_250k">$100k–$250k</option>
                                <option value="250k_500k">$250k–$500k</option>
                                <option value="500k_1m">$500k–$1M</option>
                                <option value="1m_3m">$1M–$3M</option>
                                <option value="3m_plus">$3M+</option>
                              </select>
                            </div>
                            <div>
                              <Label className={labelClass}>Status *</Label>
                              <select value={prog.status} onChange={e => updateProgramme(idx, "status", e.target.value)} className={selectClass}>
                                <option value="Active">Active</option>
                                <option value="Planned">Planned</option>
                                <option value="Completed">Completed</option>
                                <option value="Paused">Paused</option>
                              </select>
                            </div>
                            <div>
                              <Label className={labelClass}>Year Started</Label>
                              <Input type="number" value={prog.yearStarted} onChange={e => updateProgramme(idx, "yearStarted", e.target.value)} placeholder="2018" className={inputClass} />
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                      {programmes.length < 8 && (
                        <Button variant="outline" size="sm" className="w-full text-xs border-dashed" onClick={addProgramme}>
                          <Plus className="h-3 w-3 mr-1" /> Add Another Programme
                        </Button>
                      )}
                      {programmes.filter(p => p.name).length > 0 && (
                        <div>
                          <Label className={labelClass}>What makes your approach different? (recommended)</Label>
                          <Textarea value={innovationFactor} onChange={e => setInnovationFactor(e.target.value.slice(0, 400))}
                            placeholder="What is innovative or distinctive about how you work?"
                            className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ STEP 5: Beneficiaries ═══ */}
                  {step === 4 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">Funders want precision — not "disadvantaged youth" but "150 young women aged 15-24 from Gauteng townships who have dropped out of school."
                        <WhyTooltip text="Specific numbers make the cost-per-beneficiary calculation easy for funders." />
                      </p>
                      <div>
                        <Label className={labelClass}>Detailed Description of Primary Target Group *</Label>
                        <Textarea value={primaryTargetGroup} onChange={e => setPrimaryTargetGroup(e.target.value.slice(0, 600))}
                          placeholder="Describe exactly who you serve — age, gender, location, and the specific vulnerability..."
                          className="bg-secondary/30 border-border/50 min-h-[120px] text-foreground text-sm" />
                      </div>
                      <div>
                        <Label className={labelClass}>How Do You Select Beneficiaries? *</Label>
                        <Textarea value={beneficiarySelection} onChange={e => setBeneficiarySelection(e.target.value.slice(0, 400))}
                          placeholder="How do you identify and select the people you serve?"
                          className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground text-sm" />
                      </div>
                      <div>
                        <Label className={labelClass}>Gender Split (% Female)</Label>
                        <Slider value={[genderFemale]} onValueChange={v => setGenderFemale(v[0])} max={100} step={5} className="mt-2" />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>{genderFemale}% Female</span><span>{100 - genderFemale}% Male/Other</span>
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Vulnerability Factors</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {["Living in poverty", "Disability", "Orphaned / child-headed household", "Affected by HIV/AIDS",
                            "Refugee / undocumented", "Affected by GBV", "School dropout risk", "NEET youth"].map(f => (
                            <button key={f} onClick={() => setVulnerabilityFactors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                              className={`px-2 py-1 rounded-full text-[10px] border ${vulnerabilityFactors.includes(f) ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={labelClass}>Direct Beneficiaries (annual) *</Label>
                          <Input type="number" value={directBeneficiaries} onChange={e => setDirectBeneficiaries(e.target.value)} placeholder="e.g. 480" className={inputClass} />
                          <span className="text-[10px] text-muted-foreground">People who directly receive your services</span>
                        </div>
                        <div>
                          <Label className={labelClass}>Indirect Beneficiaries (annual)</Label>
                          <Input type="number" value={indirectBeneficiaries} onChange={e => setIndirectBeneficiaries(e.target.value)} placeholder="e.g. 1440" className={inputClass} />
                          <span className="text-[10px] text-muted-foreground">Family/community who benefit from ripple effect</span>
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>How Are Beneficiaries Involved in Design? (recommended)</Label>
                        <Textarea value={beneficiaryParticipation} onChange={e => setBeneficiaryParticipation(e.target.value.slice(0, 300))}
                          placeholder="e.g. We conduct quarterly focus groups with participants and have a Youth Advisory Panel..."
                          className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm" />
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 6: Impact & Monitoring ═══ */}
                  {step === 5 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">This is the section most NGOs dread — but it's where funders decide whether you're serious. The AI will build your logframe from this.
                        <WhyTooltip text="An M&E section without real indicators and baselines is the number one reason proposals get rejected." />
                      </p>
                      <DynamicListInput items={keyOutcomes} setItems={setKeyOutcomes}
                        placeholder="e.g. Improved academic performance" label="Key Outcomes * (3-5 changes you create)" max={5} minEncouraged={3} />
                      {/* Indicators */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className={labelClass}>Key Performance Indicators * (min 3)</Label>
                          <AIButton onClick={generateIndicators} loading={aiLoading === "indicators"} label="Help me build indicators" />
                        </div>
                        <div className="space-y-3">
                          {indicators.map((ind, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-secondary/20 border border-border/20 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-foreground">Indicator {idx + 1}</span>
                                {indicators.length > 1 && (
                                  <Button variant="ghost" size="sm" className="h-5 text-[10px] text-destructive" onClick={() => setIndicators(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
                                )}
                              </div>
                              <Input value={ind.name} onChange={e => { const n = [...indicators]; n[idx].name = e.target.value; setIndicators(n); }}
                                placeholder="e.g. % of participants who improve Maths by one grade level" className={inputClass} />
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={ind.baseline} onChange={e => { const n = [...indicators]; n[idx].baseline = e.target.value; setIndicators(n); }}
                                  placeholder="Baseline: e.g. 37% (2022)" className={inputClass} />
                                <Input value={ind.target} onChange={e => { const n = [...indicators]; n[idx].target = e.target.value; setIndicators(n); }}
                                  placeholder="Target: e.g. 65% by Year 1" className={inputClass} />
                              </div>
                              <Input value={ind.method} onChange={e => { const n = [...indicators]; n[idx].method = e.target.value; setIndicators(n); }}
                                placeholder="How measured: e.g. School report cards collected each term" className={inputClass} />
                              <select value={ind.frequency} onChange={e => { const n = [...indicators]; n[idx].frequency = e.target.value; setIndicators(n); }} className={selectClass}>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="biannually">Bi-annually</option>
                                <option value="annually">Annually</option>
                              </select>
                            </div>
                          ))}
                        </div>
                        {indicators.length < 8 && (
                          <Button variant="ghost" size="sm" className="mt-1 text-xs text-primary" onClick={() => setIndicators(prev => [...prev, { name: "", type: "outcome", baseline: "", target: "", method: "", frequency: "quarterly" }])}>
                            <Plus className="h-3 w-3 mr-1" /> Add indicator
                          </Button>
                        )}
                      </div>
                      <div>
                        <Label className={labelClass}>Data Collection Methods *</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {dataCollectionOptions.map(m => (
                            <button key={m} onClick={() => setDataCollectionMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                              className={`px-2 py-1 rounded-full text-[10px] border ${dataCollectionMethods.includes(m) ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Do you have a formal M&E framework? *</Label>
                        <div className="flex gap-2 mt-1">
                          {["yes", "in_development", "no"].map(v => (
                            <button key={v} onClick={() => setHasMEFramework(v)}
                              className={`px-3 py-1.5 rounded-lg text-xs border ${hasMEFramework === v ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              {v === "yes" ? "Yes" : v === "in_development" ? "In development" : "No"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Reporting Frequency *</Label>
                        <select value={reportingFrequency} onChange={e => setReportingFrequency(e.target.value)} className={selectClass}>
                          <option value="">Select</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="biannual">Bi-annual</option>
                          <option value="annual">Annual</option>
                          <option value="depends">Depends on funder</option>
                        </select>
                      </div>
                      <div>
                        <Label className={labelClass}>3 Past Impact Achievements (recommended)</Label>
                        {pastImpactAchievements.map((a, i) => (
                          <Input key={i} value={a} onChange={e => { const n = [...pastImpactAchievements]; n[i] = e.target.value; setPastImpactAchievements(n); }}
                            placeholder={`Achievement ${i + 1}: e.g. 91% of 2-year participants passed Grade 12`}
                            className={inputClass + " mb-2"} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 7: Budget & Finance ═══ */}
                  {step === 6 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">This helps match you to funders who fund at the right scale and powers the budget narrative section.
                        <WhyTooltip text="Funders assess whether your ask matches your capacity." />
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={labelClass}>Annual Budget *</Label>
                          <Input type="number" value={annualBudget} onChange={e => setAnnualBudget(e.target.value)} placeholder="e.g. 1200000" className={inputClass} />
                        </div>
                        <div>
                          <Label className={labelClass}>Currency</Label>
                          <select value={budgetCurrency} onChange={e => setBudgetCurrency(e.target.value)} className={selectClass}>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="ZAR">ZAR (Rand)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Budget Breakdown</Label>
                        <div className="space-y-2 mt-1">
                          <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground w-24">Staff costs</span><Slider value={[staffPercent]} onValueChange={v => setStaffPercent(v[0])} max={100} step={5} className="flex-1" /><span className="text-xs text-foreground w-10">{staffPercent}%</span></div>
                          <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground w-24">Programme costs</span><Slider value={[programmesPercent]} onValueChange={v => setProgrammesPercent(v[0])} max={100} step={5} className="flex-1" /><span className="text-xs text-foreground w-10">{programmesPercent}%</span></div>
                          <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground w-24">Overheads</span><Slider value={[overheadsPercent]} onValueChange={v => setOverheadsPercent(v[0])} max={100} step={5} className="flex-1" /><span className="text-xs text-foreground w-10">{overheadsPercent}%</span></div>
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Funding Sources (%)</Label>
                        <div className="space-y-2 mt-1">
                          <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground w-24">Grants</span><Slider value={[pctGrants]} onValueChange={v => setPctGrants(v[0])} max={100} step={5} className="flex-1" /><span className="text-xs text-foreground w-10">{pctGrants}%</span></div>
                          <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground w-24">Government</span><Slider value={[pctGovernment]} onValueChange={v => setPctGovernment(v[0])} max={100} step={5} className="flex-1" /><span className="text-xs text-foreground w-10">{pctGovernment}%</span></div>
                          <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground w-24">Corporate CSR</span><Slider value={[pctCorporate]} onValueChange={v => setPctCorporate(v[0])} max={100} step={5} className="flex-1" /><span className="text-xs text-foreground w-10">{pctCorporate}%</span></div>
                          <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground w-24">Self-generated</span><Slider value={[pctSelfGenerated]} onValueChange={v => setPctSelfGenerated(v[0])} max={100} step={5} className="flex-1" /><span className="text-xs text-foreground w-10">{pctSelfGenerated}%</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={labelClass}>Current Funding Gap *</Label>
                          <Input type="number" value={fundingGap} onChange={e => setFundingGap(e.target.value)} placeholder="e.g. 350000" className={inputClass} />
                        </div>
                        <div>
                          <Label className={labelClass}>Typical Grant Size Sought</Label>
                          <select value={typicalGrantSize} onChange={e => setTypicalGrantSize(e.target.value)} className={selectClass}>
                            <option value="">Select</option>
                            <option value="under_50k">Under $50k</option>
                            <option value="50k_250k">$50k–$250k</option>
                            <option value="250k_1m">$250k–$1M</option>
                            <option value="1m_5m">$1M–$5M</option>
                            <option value="over_5m">Over $5M</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Financial Management System</Label>
                        <select value={financialSystem} onChange={e => setFinancialSystem(e.target.value)} className={selectClass}>
                          <option value="">Select</option>
                          <option value="pastel">Pastel / Sage</option>
                          <option value="quickbooks">QuickBooks</option>
                          <option value="xero">Xero</option>
                          <option value="excel">Excel / Manual</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <div className="text-xs text-foreground">Dedicated bank account for grants?</div>
                        <Switch checked={hasDedicatedBank} onCheckedChange={setHasDedicatedBank} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <div className="text-xs text-foreground">Can you provide co-funding?</div>
                        <Switch checked={cofundingAvailable} onCheckedChange={setCofundingAvailable} />
                      </div>
                      {cofundingAvailable && (
                        <div>
                          <Label className={labelClass}>Co-funding Description</Label>
                          <Textarea value={cofundingDescription} onChange={e => setCofundingDescription(e.target.value.slice(0, 300))}
                            placeholder="What in-kind or cash co-funding can you bring?"
                            className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm" />
                        </div>
                      )}
                      {/* Document uploads */}
                      <div className="space-y-2 p-3 rounded-lg bg-secondary/20 border border-border/20">
                        <Label className={labelClass}>Upload Key Documents (optional but recommended)</Label>
                        {[
                          { key: "financials", label: "Latest Audited Financials (PDF)" },
                          { key: "npo_cert", label: "NPO Registration Certificate" },
                          { key: "annual_report", label: "Latest Annual Report" },
                        ].map(doc => (
                          <div key={doc.key} className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer flex-1 p-2 rounded-lg border border-dashed border-border/30 hover:bg-secondary/20 text-xs text-muted-foreground">
                              <Upload className="h-3 w-3" />
                              {uploadedDocs[doc.key] ? <span className="text-emerald-400">✓ {doc.label}</span> : doc.label}
                              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleDocUpload(doc.key, e.target.files?.[0])} />
                            </label>
                            {uploadingDoc === doc.key && <span className="text-[10px] text-primary animate-pulse">Uploading...</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 8: Team & Capacity ═══ */}
                  {step === 7 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">Funders assess whether you have the team to deliver. A credible staff section can overcome other weaknesses in a proposal.
                        <WhyTooltip text="Knowing your capacity means AI can write truthful, credible capacity sections." />
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div><Label className={labelClass}>Full-time Staff</Label><Input type="number" value={fteCount} onChange={e => setFteCount(e.target.value)} placeholder="8" className={inputClass} /></div>
                        <div><Label className={labelClass}>Part-time</Label><Input type="number" value={parttimeCount} onChange={e => setParttimeCount(e.target.value)} placeholder="4" className={inputClass} /></div>
                        <div><Label className={labelClass}>Volunteers</Label><Input type="number" value={volunteerCount} onChange={e => setVolunteerCount(e.target.value)} placeholder="12" className={inputClass} /></div>
                        <div><Label className={labelClass}>Board Members</Label><Input type="number" value={boardCount} onChange={e => setBoardCount(e.target.value)} placeholder="7" className={inputClass} /></div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <div className="text-xs text-foreground">Do you have a dedicated grant writer?</div>
                        <Switch checked={hasGrantWriter} onCheckedChange={setHasGrantWriter} />
                      </div>
                      <div>
                        <Label className={labelClass}>Executive Director / CEO Name *</Label>
                        <Input value={ceoName} onChange={e => setCeoName(e.target.value)} placeholder="Full name" className={inputClass} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className={labelClass}>Executive Director Bio (100 words)</Label>
                          <AIButton onClick={generateCeoBio} loading={aiLoading === "bio"} label="Write bio" />
                        </div>
                        <Textarea value={ceoBio} onChange={e => setCeoBio(e.target.value.slice(0, 800))}
                          placeholder="A professional biography for proposals..."
                          className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground text-sm" />
                      </div>
                      {/* Key staff */}
                      <div>
                        <Label className={labelClass}>Key Staff Members</Label>
                        {keyStaff.map((s, i) => (
                          <div key={i} className="grid grid-cols-4 gap-2 mt-2">
                            <Input value={s.name} onChange={e => { const n = [...keyStaff]; n[i].name = e.target.value; setKeyStaff(n); }} placeholder="Name" className={inputClass} />
                            <Input value={s.title} onChange={e => { const n = [...keyStaff]; n[i].title = e.target.value; setKeyStaff(n); }} placeholder="Title" className={inputClass} />
                            <Input value={s.qualification} onChange={e => { const n = [...keyStaff]; n[i].qualification = e.target.value; setKeyStaff(n); }} placeholder="Qualification" className={inputClass} />
                            <div className="flex gap-1">
                              <Input value={s.experience} onChange={e => { const n = [...keyStaff]; n[i].experience = e.target.value; setKeyStaff(n); }} placeholder="Yrs exp" className={inputClass} />
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => setKeyStaff(prev => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        ))}
                        {keyStaff.length < 6 && (
                          <Button variant="ghost" size="sm" className="mt-1 text-xs text-primary" onClick={() => setKeyStaff(prev => [...prev, { name: "", title: "", qualification: "", experience: "" }])}>
                            <Plus className="h-3 w-3 mr-1" /> Add staff member
                          </Button>
                        )}
                      </div>
                      {country === "South Africa" && (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                          <div>
                            <div className="text-xs text-foreground">B-BBEE Compliant?</div>
                            <div className="text-[10px] text-muted-foreground">Required by most SA corporate funders</div>
                          </div>
                          <Switch checked={hasBBBEE} onCheckedChange={setHasBBBEE} />
                        </div>
                      )}
                      {hasBBBEE && (
                        <div>
                          <Label className={labelClass}>B-BBEE Level</Label>
                          <select value={bbbeeLevel} onChange={e => setBbbeeLevel(e.target.value)} className={selectClass}>
                            <option value="">Select</option>
                            {[1,2,3,4,5,6,7,8].map(l => <option key={l} value={String(l)}>Level {l}</option>)}
                          </select>
                        </div>
                      )}
                      <div>
                        <Label className={labelClass}>Policies in Place</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {policyOptions.map(p => (
                            <button key={p} onClick={() => setSelectedPolicies(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                              className={`px-2 py-1 rounded-full text-[10px] border ${selectedPolicies.includes(p) ? "border-primary bg-primary/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                              ✅ {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className={labelClass}>Strategic Plan?</Label>
                        <div className="flex gap-2 mt-1">
                          {["yes", "in_development", "no"].map(v => (
                            <button key={v} onClick={() => setHasStrategicPlan(v)}
                              className={`px-3 py-1.5 rounded-lg text-xs border ${hasStrategicPlan === v ? "border-primary bg-primary/10" : "border-border/30 text-muted-foreground"}`}>
                              {v === "yes" ? "Yes" : v === "in_development" ? "In development" : "No"}
                            </button>
                          ))}
                        </div>
                      </div>
                      {hasStrategicPlan === "yes" && (
                        <div>
                          <Label className={labelClass}>Strategic Plan Period</Label>
                          <Input value={strategicPlanPeriod} onChange={e => setStrategicPlanPeriod(e.target.value)} placeholder="e.g. 2024-2027" className={inputClass} />
                        </div>
                      )}
                      <div>
                        <Label className={labelClass}>3 Most Significant Organisational Achievements *</Label>
                        {orgAchievements.map((a, i) => (
                          <Input key={i} value={a} onChange={e => { const n = [...orgAchievements]; n[i] = e.target.value; setOrgAchievements(n); }}
                            placeholder={`Achievement ${i + 1}`} className={inputClass + " mb-2"} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 9: Past Funding & Partnerships ═══ */}
                  {step === 8 && (
                    <div className="space-y-4 mt-4">
                      <p className="text-xs text-muted-foreground">Your track record with funders is one of the strongest signals of credibility. Even if limited, telling this story well makes a big difference.
                        <WhyTooltip text="Past funders act as references. This powers your track record and sustainability sections." />
                      </p>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                        <div className="text-xs text-foreground">Have you received grants before?</div>
                        <Switch checked={hasReceivedGrants} onCheckedChange={setHasReceivedGrants} />
                      </div>
                      {hasReceivedGrants && (
                        <>
                          <div>
                            <Label className={labelClass}>Past Funders (up to 6)</Label>
                            {pastFundersDetailed.map((f, i) => (
                              <div key={i} className="grid grid-cols-5 gap-2 mt-2">
                                <Input value={f.name} onChange={e => { const n = [...pastFundersDetailed]; n[i].name = e.target.value; setPastFundersDetailed(n); }} placeholder="Funder name" className={inputClass} />
                                <select value={f.amount} onChange={e => { const n = [...pastFundersDetailed]; n[i].amount = e.target.value; setPastFundersDetailed(n); }} className={selectClass}>
                                  <option value="">Amount</option>
                                  <option value="under_50k">Under R50k</option>
                                  <option value="50k_250k">R50k–R250k</option>
                                  <option value="250k_1m">R250k–R1M</option>
                                  <option value="1m_plus">R1M+</option>
                                </select>
                                <Input value={f.year} onChange={e => { const n = [...pastFundersDetailed]; n[i].year = e.target.value; setPastFundersDetailed(n); }} placeholder="Year" className={inputClass} />
                                <Input value={f.project} onChange={e => { const n = [...pastFundersDetailed]; n[i].project = e.target.value; setPastFundersDetailed(n); }} placeholder="Project" className={inputClass} />
                                <div className="flex gap-1">
                                  <select value={f.outcome} onChange={e => { const n = [...pastFundersDetailed]; n[i].outcome = e.target.value; setPastFundersDetailed(n); }} className={selectClass}>
                                    <option value="">Outcome</option>
                                    <option value="completed">Completed</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="not_renewed">Not renewed</option>
                                  </select>
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => setPastFundersDetailed(prev => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
                                </div>
                              </div>
                            ))}
                            {pastFundersDetailed.length < 6 && (
                              <Button variant="ghost" size="sm" className="mt-1 text-xs text-primary"
                                onClick={() => setPastFundersDetailed(prev => [...prev, { name: "", amount: "", year: "", project: "", outcome: "" }])}>
                                <Plus className="h-3 w-3 mr-1" /> Add past funder
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className={labelClass}>Largest Grant Managed</Label>
                              <select value={largestGrant} onChange={e => setLargestGrant(e.target.value)} className={selectClass}>
                                <option value="">Select</option>
                                <option value="under_50k">Under R50k</option>
                                <option value="50k_250k">R50k–R250k</option>
                                <option value="250k_1m">R250k–R1M</option>
                                <option value="1m_5m">R1M–R5M</option>
                                <option value="over_5m">R5M+</option>
                              </select>
                            </div>
                            <div>
                              <Label className={labelClass}>Total Funding (Last 3 Years)</Label>
                              <select value={totalFunding3yr} onChange={e => setTotalFunding3yr(e.target.value)} className={selectClass}>
                                <option value="">Select</option>
                                <option value="under_500k">Under R500k</option>
                                <option value="500k_2m">R500k–R2M</option>
                                <option value="2m_5m">R2M–R5M</option>
                                <option value="5m_10m">R5M–R10M</option>
                                <option value="over_10m">Over R10M</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <Label className={labelClass}>How do you manage grant funds and reporting? *</Label>
                            <Textarea value={grantManagement} onChange={e => setGrantManagement(e.target.value.slice(0, 400))}
                              placeholder="Describe your financial controls, reporting process, and experience..."
                              className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground text-sm" />
                          </div>
                          <div>
                            <Label className={labelClass}>Most Proud Achievement with Past Funding *</Label>
                            <Textarea value={proudAchievement} onChange={e => setProudAchievement(e.target.value.slice(0, 400))}
                              placeholder="Your best paragraph — this closes your executive summary..."
                              className="bg-secondary/30 border-border/50 min-h-[80px] text-foreground text-sm" />
                          </div>
                          <div>
                            <Label className={labelClass}>Lessons Learned (recommended)</Label>
                            <Textarea value={lessonsLearned} onChange={e => setLessonsLearned(e.target.value.slice(0, 300))}
                              placeholder="What have you learned about what works and what doesn't?"
                              className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm" />
                          </div>
                        </>
                      )}

                      {/* Partnership section */}
                      <div className="pt-4 border-t border-border/20">
                        <h3 className="text-sm font-medium text-foreground mb-3">Partnership Appetite</h3>
                        <div>
                          <Label className={labelClass}>Are you open to partnering with other NGOs?</Label>
                          <div className="flex gap-2 mt-1">
                            {[
                              { v: "open", label: "Open to partnerships" },
                              { v: "selective", label: "Selective" },
                              { v: "not_looking", label: "Not currently" },
                            ].map(t => (
                              <button key={t.v} onClick={() => setPartnershipAppetite(t.v)}
                                className={`px-3 py-1.5 rounded-lg text-xs border ${partnershipAppetite === t.v ? "border-amber-500 bg-amber-500/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {(partnershipAppetite === "open" || partnershipAppetite === "selective") && (
                          <>
                            <div className="mt-3">
                              <Label className={labelClass}>Partnership Role Preference</Label>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                {[
                                  { v: "lead", icon: "🚀", label: "Lead Organisation" },
                                  { v: "equal", icon: "🤝", label: "Equal Partners" },
                                  { v: "sub", icon: "🧩", label: "Sub-grantee" },
                                ].map(r => (
                                  <button key={r.v} onClick={() => setPartnershipRole(r.v)}
                                    className={`p-2 rounded-lg text-xs border text-center ${partnershipRole === r.v ? "border-amber-500 bg-amber-500/10" : "border-border/30 text-muted-foreground"}`}>
                                    <div className="text-sm">{r.icon}</div>
                                    <div>{r.label}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="mt-3">
                              <Label className={labelClass}>What do you bring to a partnership?</Label>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {["Community relationships", "Technical expertise", "Geographic reach", "Beneficiary networks",
                                  "Research capability", "Finance management", "M&E", "Advocacy", "Cultural/language access"].map(s => (
                                  <button key={s} onClick={() => setPartnershipBrings(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                    className={`px-2 py-1 rounded-full text-[10px] border ${partnershipBrings.includes(s) ? "border-amber-500 bg-amber-500/10 text-foreground" : "border-border/30 text-muted-foreground"}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="mt-3">
                              <Label className={labelClass}>Partnership Statement (shown on your public profile)</Label>
                              <Textarea value={partnershipStatement} onChange={e => setPartnershipStatement(e.target.value.slice(0, 300))}
                                placeholder="2-3 sentences about what you're looking for in partners..."
                                className="bg-secondary/30 border-border/50 min-h-[60px] text-foreground text-sm" />
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/30 mt-3">
                          <div>
                            <div className="text-xs text-foreground">Discoverable to other NGOs?</div>
                            <div className="text-[10px] text-muted-foreground">Other GrantMatch users can find and message you</div>
                          </div>
                          <Switch checked={isDiscoverable} onCheckedChange={setIsDiscoverable} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between mt-6 pt-4 border-t border-border/20">
                    <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="text-sm">
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button onClick={next} disabled={saving} className="bg-primary text-primary-foreground text-sm">
                      {saving ? "Saving..." : step === 8 ? "Complete Profile" : "Save & Continue"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right sidebar — how this helps (desktop) */}
        <div className="hidden xl:block w-52 border-l border-border/20 p-4">
          <GlassCard hoverable={false} className="p-3">
            <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
              <FileText className="h-3 w-3 text-primary" /> How this helps
            </h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{steps[step].sidebar}</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
