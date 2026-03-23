import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Sparkles, Bell, Puzzle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const focusAreaLabels = [
  "Children", "Families/Parents", "Disability", "Health/HIV", "Aged/Elderly",
  "Women/Gender", "LGBTQI", "Youth", "Education/ECD", "Science/Research",
  "Capacity Building", "Entrepreneur/Skills", "Poverty/Livelihood", "Housing",
  "Welfare", "Displaced/Refugees", "Peace/Conflict", "Human Rights",
  "Religion", "Arts/Culture", "Sports", "Community Dev", "Environment",
  "Agriculture/Land", "Animals",
];

const SettingsPage = () => {
  const [tone, setTone] = useState("formal");
  const [reportFormat, setReportFormat] = useState("narrative");
  const [writingLength, setWritingLength] = useState("standard");
  const [notifications, setNotifications] = useState({ newGrants: true, deadlines: true, reviews: false });
  const [modules, setModules] = useState({ emailHub: true, reports: true });
  const [selectedFocus, setSelectedFocus] = useState<string[]>(["Education/ECD", "Youth", "Community Dev", "Women/Gender", "Health/HIV"]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Settings
          </h1>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="bg-secondary/30 border border-border/30 mb-6">
            <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1" /> Organisation</TabsTrigger>
            <TabsTrigger value="ai"><Sparkles className="h-3.5 w-3.5 mr-1" /> AI Preferences</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1" /> Notifications</TabsTrigger>
            <TabsTrigger value="modules"><Puzzle className="h-3.5 w-3.5 mr-1" /> Modules</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Organisation Profile</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Organisation Name</Label>
                    <Input defaultValue="Elizayo Foundation" className="mt-1 bg-secondary/30 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Country</Label>
                    <Input defaultValue="South Africa" className="mt-1 bg-secondary/30 border-border/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Region</Label>
                    <Input defaultValue="Western Cape" className="mt-1 bg-secondary/30 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Organisation Size</Label>
                    <select className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                      <option>Micro (1-5)</option>
                      <option selected>Small (6-20)</option>
                      <option>Medium (21-50)</option>
                      <option>Large (50+)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mission Statement</Label>
                  <Textarea defaultValue="Empowering youth through education and community development in the Western Cape." className="mt-1 bg-secondary/30 border-border/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Focus Areas</Label>
                  <div className="flex flex-wrap gap-2">
                    {focusAreaLabels.map(area => (
                      <button
                        key={area}
                        onClick={() => setSelectedFocus(prev =>
                          prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
                        )}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                          selectedFocus.includes(area)
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast({ title: "Profile saved" })}>
                    Save Changes
                  </Button>
                  <Button variant="outline" className="border-border/50" onClick={() => toast({ title: "Recalculating matches...", description: "This may take a moment." })}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Recalculate Matches
                  </Button>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="ai">
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-4">AI Preferences</h3>
              <div className="space-y-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Default Proposal Tone</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["formal", "semi-formal", "community"].map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`p-3 rounded-lg text-xs text-center border transition-colors ${
                          tone === t ? "border-primary bg-primary/5 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Default Report Format</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: "narrative", label: "Narrative" },
                      { id: "logframe", label: "Logframe" },
                      { id: "results_framework", label: "Results Framework" },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setReportFormat(f.id)}
                        className={`p-3 rounded-lg text-xs text-center border transition-colors ${
                          reportFormat === f.id ? "border-primary bg-primary/5 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">AI Writing Length</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["concise", "standard", "detailed"].map(l => (
                      <button
                        key={l}
                        onClick={() => setWritingLength(l)}
                        className={`p-3 rounded-lg text-xs text-center border transition-colors ${
                          writingLength === l ? "border-primary bg-primary/5 text-foreground" : "border-border/30 text-muted-foreground hover:bg-secondary/30"
                        }`}
                      >
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
            <GlassCard hoverable={false}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  { key: "newGrants", label: "New matching grants", desc: "Get notified when new funders match your profile" },
                  { key: "deadlines", label: "Upcoming deadlines", desc: "Reminders 7 days before application deadlines" },
                  { key: "reviews", label: "Proposal review requested", desc: "When a team member requests your review" },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                    <div>
                      <div className="text-sm text-foreground">{n.label}</div>
                      <div className="text-xs text-muted-foreground">{n.desc}</div>
                    </div>
                    <Switch
                      checked={notifications[n.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [n.key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </GlassCard>
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
                    <Switch
                      checked={modules[m.key as keyof typeof modules]}
                      onCheckedChange={(checked) => setModules(prev => ({ ...prev, [m.key]: checked }))}
                    />
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
