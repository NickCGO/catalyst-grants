import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Check, Building2, Heart, Target, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import GlassCard from "@/components/GlassCard";

const focusAreas = [
  { key: "children", label: "Children", icon: "👶" },
  { key: "families", label: "Families/Parents", icon: "👨‍👩‍👧" },
  { key: "disability", label: "Disability", icon: "♿" },
  { key: "health", label: "Health/HIV/AIDS", icon: "🏥" },
  { key: "elderly", label: "Aged/Elderly", icon: "👴" },
  { key: "women", label: "Women/Gender/DV", icon: "👩" },
  { key: "lgbtqi", label: "LGBTQI", icon: "🏳️‍🌈" },
  { key: "youth", label: "Youth", icon: "🧑" },
  { key: "education", label: "Education/ECD", icon: "📚" },
  { key: "science", label: "Science/Research", icon: "🔬" },
  { key: "capacity", label: "Capacity Building", icon: "📈" },
  { key: "entrepreneur", label: "Entrepreneur/Skills", icon: "💼" },
  { key: "poverty", label: "Poverty/Livelihood", icon: "🏠" },
  { key: "housing", label: "Housing/Homeless", icon: "🏗️" },
  { key: "welfare", label: "Welfare", icon: "🤝" },
  { key: "refugees", label: "Displaced/Refugees", icon: "🌍" },
  { key: "peace", label: "Peace/Conflict", icon: "☮️" },
  { key: "human_rights", label: "Human Rights", icon: "⚖️" },
  { key: "religion", label: "Religion", icon: "🙏" },
  { key: "arts", label: "Arts/Culture", icon: "🎨" },
  { key: "sports", label: "Sports", icon: "⚽" },
  { key: "community", label: "Community Dev", icon: "🏘️" },
  { key: "environment", label: "Environment", icon: "🌿" },
  { key: "agriculture", label: "Agriculture/Land", icon: "🌾" },
  { key: "animals", label: "Animals", icon: "🐾" },
];

const steps = [
  { title: "Your Organisation", icon: Building2 },
  { title: "Your Mission", icon: Heart },
  { title: "Focus Areas", icon: Target },
  { title: "Preferences", icon: Settings },
];

const OnboardingPage = () => {
  const [step, setStep] = useState(0);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleFocus = (key: string) => {
    setSelectedFocus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-6">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">GrantMatch</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-0.5 rounded-full ${i < step ? "bg-primary" : "bg-secondary"}`} />
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
              transition={{ duration: 0.3 }}
            >
              <GlassCard hoverable={false} className="p-8">
                <h2 className="text-xl font-bold text-foreground mb-1">{steps[step].title}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {step === 0 && "Tell us about your organisation."}
                  {step === 1 && "What drives your work?"}
                  {step === 2 && "Select all focus areas that match your work. This powers the matching engine."}
                  {step === 3 && "Almost done! Set your application preferences."}
                </p>

                {step === 0 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Organisation Name</Label>
                      <Input defaultValue="Elizayo Foundation" className="mt-1 bg-secondary/30 border-border/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Country</Label>
                        <select className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                          <option value="ZA">South Africa</option>
                          <option value="NG">Nigeria</option>
                          <option value="KE">Kenya</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Province/Region</Label>
                        <Input placeholder="e.g. Western Cape" className="mt-1 bg-secondary/30 border-border/50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Organisation Size</Label>
                        <select className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                          <option>Micro (1-5)</option>
                          <option>Small (6-20)</option>
                          <option>Medium (21-50)</option>
                          <option>Large (50+)</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Year Founded</Label>
                        <Input type="number" placeholder="2015" className="mt-1 bg-secondary/30 border-border/50" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Registration Number (optional)</Label>
                      <Input placeholder="NPO-123456" className="mt-1 bg-secondary/30 border-border/50" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Website (optional)</Label>
                      <Input placeholder="https://..." className="mt-1 bg-secondary/30 border-border/50" />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-muted-foreground">Mission Statement</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">
                          <Sparkles className="h-3 w-3 mr-1" /> AI Assist
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Describe your organisation's mission in 2-3 sentences..."
                        className="bg-secondary/30 border-border/50 min-h-[120px]"
                        maxLength={500}
                      />
                      <span className="text-[10px] text-muted-foreground">Max 500 characters</span>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Programmes You Run</Label>
                      <Input
                        placeholder="e.g. AfterSchool, ECD, Youth Development (comma-separated)"
                        className="mt-1 bg-secondary/30 border-border/50"
                      />
                      <span className="text-[10px] text-muted-foreground">Add your programme names, separated by commas</span>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {focusAreas.map((area) => (
                        <button
                          key={area.key}
                          onClick={() => toggleFocus(area.key)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs text-left transition-all ${
                            selectedFocus.includes(area.key)
                              ? "bg-primary/15 border border-primary/40 text-foreground"
                              : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
                          }`}
                        >
                          <span>{area.icon}</span>
                          <span>{area.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      {selectedFocus.length} selected · Minimum 2 required
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Preferred Method of Approach</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {["Proposal", "Letter of Enquiry", "Application Form", "Concept Note"].map((m) => (
                          <label key={m} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/30 cursor-pointer hover:bg-secondary/50">
                            <Checkbox className="h-3.5 w-3.5" />
                            <span className="text-xs text-foreground">{m}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Typical Funding Range Seeking</Label>
                      <select className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm text-foreground">
                        <option>Under R50,000</option>
                        <option>R50,000 - R250,000</option>
                        <option>R250,000 - R1,000,000</option>
                        <option>R1,000,000 - R5,000,000</option>
                        <option>Over R5,000,000</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/30">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={next} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {step === 3 ? "Finish & see my matches" : "Continue"} <ArrowRight className="ml-1 h-4 w-4" />
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
