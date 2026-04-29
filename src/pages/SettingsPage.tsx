import { useState, useEffect } from "react";
import { Settings, User, Sparkles, Bell, Puzzle, Upload, Check, Loader2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const focusAreaKeys = [
  { key: "children", label: "Children" }, { key: "families_parents", label: "Families/Parents" },
  { key: "disability", label: "Disability" }, { key: "health_aids_sexual_reproductive", label: "Health/HIV" },
  { key: "aged_elderly", label: "Aged/Elderly" }, { key: "women_gender_dv_girls", label: "Women/Gender" },
  { key: "lgbtqi_gender_equality", label: "LGBTQI" }, { key: "youth", label: "Youth" },
  { key: "education_ecd", label: "Education/ECD" }, { key: "science_research", label: "Science/Research" },
  { key: "capacity_building_governance", label: "Capacity Building" },
  { key: "entrepreneur_skills_vocational", label: "Entrepreneur/Skills" },
  { key: "poverty_livelihood", label: "Poverty/Livelihood" }, { key: "housing_homeless", label: "Housing" },
  { key: "welfare", label: "Welfare" }, { key: "displaced_refugees", label: "Displaced/Refugees" },
  { key: "peace_conflict_resolution", label: "Peace/Conflict" }, { key: "human_rights_advocacy", label: "Human Rights" },
  { key: "religion", label: "Religion" }, { key: "arts_culture", label: "Arts/Culture" },
  { key: "sports", label: "Sports" }, { key: "community_development", label: "Community Dev" },
  { key: "environment_conservation", label: "Environment" }, { key: "agriculture_land", label: "Agriculture/Land" },
  { key: "animals", label: "Animals" },
];

const notificationTypes = [
  { key: "newGrants", label: "New matching grants", desc: "Get notified when new funders match your profile" },
  { key: "deadlines", label: "Upcoming deadlines", desc: "Reminders 7 days before application deadlines" },
  { key: "reviews", label: "Proposal review requested", desc: "When a team member requests your review" },
  { key: "taskAssigned", label: "Task assigned to you", desc: "When you're assigned a new task" },
  { key: "partnershipRequest", label: "Partnership requests", desc: "When another NGO sends a partnership request" },
  { key: "teamInvite", label: "Team member joined", desc: "When an invited member joins your organisation" },
  { key: "aiComplete", label: "AI tasks completed", desc: "When AI finishes generating proposals or reports" },
];

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get("tab") || "profile";
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [orgSize, setOrgSize] = useState("");
  const [mission, setMission] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [regNumber, setRegNumber] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [pctGrants, setPctGrants] = useState(0);
  const [pctGovernment, setPctGovernment] = useState(0);
  const [pctCorporate, setPctCorporate] = useState(0);
  const [orgId, setOrgId] = useState("");

  // AI prefs
  const [tone, setTone] = useState("formal");
  const [reportFormat, setReportFormat] = useState("narrative");
  const [writingLength, setWritingLength] = useState("standard");

  // Notifications
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationTypes.map(n => [n.key, true]))
  );
  const [emailDigest, setEmailDigest] = useState<"off" | "immediate" | "daily">("daily");

  // Modules
  const [modules, setModules] = useState({ emailHub: true, reports: true });

  // Doc uploads
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: org } = await supabase.from("organisations").select("*").eq("user_id", user.id).maybeSingle();
      if (org) {
        setOrgId(org.id);
        setOrgName(org.name || "");
        setCountry(org.country || "");
        setRegion(org.region || "");
        setOrgSize(org.org_size || "");
        setMission(org.mission_statement || "");
        setWebsite(org.website || "");
        setSelectedFocus(org.focus_areas || []);
        setRegNumber(org.registration_number || "");
        setCeoName(org.ceo_name || "");
        setAnnualIncome(org.annual_income ? String(org.annual_income) : "");
        setPctGrants(org.pct_grants || 0);
        setPctGovernment(org.pct_government || 0);
        setPctCorporate(org.pct_corporate || 0);

        // Hydrate org_settings JSON
        const s = (org as any).org_settings || {};
        if (s.ai?.tone) setTone(s.ai.tone);
        if (s.ai?.reportFormat) setReportFormat(s.ai.reportFormat);
        if (s.ai?.writingLength) setWritingLength(s.ai.writingLength);
        if (s.notifications) setNotifications(prev => ({ ...prev, ...s.notifications }));
        if (s.emailDigest) setEmailDigest(s.emailDigest);
        if (s.modules) setModules(prev => ({ ...prev, ...s.modules }));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    if (!user || !orgId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("organisations").update({
        name: orgName,
        country,
        region: region || null,
        org_size: orgSize || null,
        mission_statement: mission || null,
        website: website || null,
        focus_areas: selectedFocus.length > 0 ? selectedFocus : null,
        registration_number: regNumber || null,
        ceo_name: ceoName || null,
        annual_income: annualIncome ? parseFloat(annualIncome) : null,
        pct_grants: pctGrants,
        pct_government: pctGovernment,
        pct_corporate: pctCorporate,
      }).eq("id", orgId);
      if (error) throw error;
      toast({ title: "Profile saved!" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  // Save a partial org_settings JSON merge
  const saveOrgSettings = async (patch: Record<string, any>, successMsg: string) => {
    if (!user || !orgId) return;
    setSaving(true);
    try {
      // Read current settings to merge
      const { data: current } = await supabase
        .from("organisations")
        .select("org_settings")
        .eq("id", orgId)
        .maybeSingle();
      const merged = { ...((current as any)?.org_settings || {}), ...patch };
      const { error } = await supabase
        .from("organisations")
        .update({ org_settings: merged } as any)
        .eq("id", orgId);
      if (error) throw error;
      toast({ title: successMsg });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const saveAIPrefs = () => saveOrgSettings({ ai: { tone, reportFormat, writingLength } }, "AI preferences saved");
  const saveNotifications = () => saveOrgSettings({ notifications, emailDigest }, "Notification preferences saved");
  const saveModules = () => saveOrgSettings({ modules }, "Module preferences saved");

  const handleDocUpload = async (docKey: string, file: File | undefined) => {
    if (!file || !orgId) return;
    setUploadingDoc(docKey);
    try {
      const filePath = `${orgId}/${docKey}_${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("org-documents").upload(filePath, file, { upsert: true });
      if (error) throw error;
      setUploadedDocs(prev => ({ ...prev, [docKey]: true }));
      toast({ title: "Document uploaded!", description: file.name });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploadingDoc(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Settings
          </h1>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="bg-secondary/30 border border-border/30 mb-6">
            <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1" /> Organisation</TabsTrigger>
            <TabsTrigger value="team" onClick={() => navigate("/settings/team")}><Users className="h-3.5 w-3.5 mr-1" /> Team</TabsTrigger>
            <TabsTrigger value="ai"><Sparkles className="h-3.5 w-3.5 mr-1" /> AI Preferences</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1" /> Notifications</TabsTrigger>
            <TabsTrigger value="modules"><Puzzle className="h-3.5 w-3.5 mr-1" /> Modules</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-6">
              <GlassCard hoverable={false}>
                <h3 className="text-sm font-semibold text-foreground mb-4">Organisation Profile</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Organisation Name</Label>
                      <Input value={orgName} onChange={e => setOrgName(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Country</Label>
                      <Input value={country} onChange={e => setCountry(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Region</Label>
                      <Input value={region} onChange={e => setRegion(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Organisation Size</Label>
                      <select value={orgSize} onChange={e => setOrgSize(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                        <option value="">Select</option>
                        <option value="micro (1-5)">Micro (1-5)</option>
                        <option value="small (6-20)">Small (6-20)</option>
                        <option value="medium (21-50)">Medium (21-50)</option>
                        <option value="large (50+)">Large (50+)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Registration Number</Label>
                      <Input value={regNumber} onChange={e => setRegNumber(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">CEO/Director</Label>
                      <Input value={ceoName} onChange={e => setCeoName(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <Input value={website} onChange={e => setWebsite(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Mission Statement</Label>
                    <Textarea value={mission} onChange={e => setMission(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Annual Income (USD)</Label>
                    <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} className="mt-1 bg-secondary/30 border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Income Sources (%)</Label>
                    {[
                      { label: "Grants", value: pctGrants, set: setPctGrants },
                      { label: "Government", value: pctGovernment, set: setPctGovernment },
                      { label: "Corporate", value: pctCorporate, set: setPctCorporate },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground w-20">{s.label}</span>
                        <Slider value={[s.value]} max={100} step={5} onValueChange={v => s.set(v[0])} className="flex-1" />
                        <span className="text-xs text-foreground w-8 text-right">{s.value}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Focus Areas</Label>
                    <div className="flex flex-wrap gap-2">
                      {focusAreaKeys.map(area => (
                        <button
                          key={area.key}
                          onClick={() => setSelectedFocus(prev =>
                            prev.includes(area.key) ? prev.filter(a => a !== area.key) : [...prev, area.key]
                          )}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                            selectedFocus.includes(area.key)
                              ? "bg-primary/15 border-primary/40 text-primary"
                              : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                          }`}
                        >
                          {area.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={saveProfile} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </GlassCard>

              {/* Document uploads */}
              <GlassCard hoverable={false}>
                <h3 className="text-sm font-semibold text-foreground mb-2">Organisation Documents</h3>
                <p className="text-xs text-muted-foreground mb-4">Upload certificates and reports to enhance AI proposal quality.</p>
                <div className="space-y-3">
                  {[
                    { key: "financials", label: "Audited Financials (PDF)" },
                    { key: "npo_cert", label: "NPO Registration Certificate" },
                    { key: "annual_report", label: "Annual Report" },
                    { key: "constitution", label: "Constitution / Founding Document" },
                    { key: "tax_cert", label: "Tax Exemption Certificate" },
                  ].map(doc => (
                    <div key={doc.key} className="flex items-center gap-3 p-3 rounded-lg border border-border/30">
                      <div className="flex-1">
                        <div className="text-xs text-foreground">{doc.label}</div>
                        {uploadedDocs[doc.key] && (
                          <div className="text-[10px] text-success flex items-center gap-1 mt-0.5">
                            <Check className="h-3 w-3" /> Uploaded
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer">
                        <input type="file" accept=".pdf,.jpg,.png" className="hidden"
                          onChange={e => handleDocUpload(doc.key, e.target.files?.[0])}
                          disabled={uploadingDoc === doc.key} />
                        <span className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          uploadingDoc === doc.key ? "border-primary/30 text-muted-foreground" :
                          "border-border/50 text-primary hover:bg-primary/5"
                        }`}>
                          {uploadingDoc === doc.key ? "Uploading..." : <><Upload className="h-3 w-3 inline mr-1" />Upload</>}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-4">AI Preferences</h3>
              <div className="space-y-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Default Proposal Tone</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["formal", "semi-formal", "community"].map(t => (
                      <button key={t} onClick={() => setTone(t)}
                        className={`p-3 rounded-lg text-xs text-center border transition-colors ${
                          tone === t ? "border-primary bg-primary/5 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                        }`}>
                        {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Default Report Format</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[{ id: "narrative", label: "Narrative" }, { id: "logframe", label: "Logframe" }, { id: "results_framework", label: "Results Framework" }].map(f => (
                      <button key={f.id} onClick={() => setReportFormat(f.id)}
                        className={`p-3 rounded-lg text-xs text-center border transition-colors ${
                          reportFormat === f.id ? "border-primary bg-primary/5 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                        }`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">AI Writing Length</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["concise", "standard", "detailed"].map(l => (
                      <button key={l} onClick={() => setWritingLength(l)}
                        className={`p-3 rounded-lg text-xs text-center border transition-colors ${
                          writingLength === l ? "border-primary bg-primary/5 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                        }`}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast({ title: "AI preferences saved" })}>
                  Save Preferences
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <GlassCard hoverable={false}>
                <h3 className="text-sm font-semibold text-foreground mb-1">Email Digest</h3>
                <p className="text-xs text-muted-foreground mb-4">Choose how you receive email notifications</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "off" as const, label: "Off", desc: "No email notifications" },
                    { id: "immediate" as const, label: "Immediate", desc: "Get emailed instantly" },
                    { id: "daily" as const, label: "Daily Digest", desc: "One summary email per day" },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => setEmailDigest(opt.id)}
                      className={`p-3 rounded-lg text-center border transition-colors ${
                        emailDigest === opt.id ? "border-primary bg-primary/5 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                      }`}>
                      <div className="text-xs font-medium">{opt.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </GlassCard>
              <GlassCard hoverable={false}>
                <h3 className="text-sm font-semibold text-foreground mb-1">In-App Notifications</h3>
                <div className="space-y-3">
                  {notificationTypes.map(n => (
                    <div key={n.key} className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                      <div>
                        <div className="text-sm text-foreground">{n.label}</div>
                        <div className="text-xs text-muted-foreground">{n.desc}</div>
                      </div>
                      <Switch checked={notifications[n.key]} onCheckedChange={c => setNotifications(p => ({ ...p, [n.key]: c }))} />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="modules">
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Optional Modules</h3>
              <div className="space-y-4">
                {[
                  { key: "emailHub", label: "Email Hub", desc: "AI-drafted funder communications", icon: "✉️" },
                  { key: "reports", label: "Impact Reports", desc: "AI-generated donor reports", icon: "📄" },
                ].map(m => (
                  <div key={m.key} className="flex items-center justify-between p-4 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-foreground">{m.label}</div>
                        <div className="text-xs text-muted-foreground">{m.desc}</div>
                      </div>
                    </div>
                    <Switch checked={modules[m.key as keyof typeof modules]} onCheckedChange={c => setModules(p => ({ ...p, [m.key]: c }))} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
