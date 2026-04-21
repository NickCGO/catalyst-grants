import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Target, FileText, BarChart2, Lock, Check, Users, Search, Send, ChevronRight, Loader2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ParticleBackground from "@/components/ParticleBackground";
import AnimatedCounter from "@/components/AnimatedCounter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ─── Helpers ─── */
const fadeUpVariants = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.6, ease: "easeOut" as const } },
});

/* ─── Nav ─── */
function Nav({ waitlistCount }: { waitlistCount: number }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6 lg:px-12 transition-all duration-300 ${scrolled ? "bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5" : ""}`}
    >
      <div className="flex items-center gap-1">
        <span className="text-2xl font-bold text-[#F1F5F9]">Grant</span>
        <span className="text-2xl font-bold text-[#0EA5E9]">Match</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden md:inline text-sm text-[#94A3B8]">
          <AnimatedCounter end={waitlistCount} className="text-[#F1F5F9] font-semibold" /> NGOs waiting
        </span>
        <a href="#pricing">
          <Button className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white text-sm px-5 py-2 rounded-xl shadow-[0_0_32px_rgba(14,165,233,0.3)] hover:scale-[1.02] transition-transform border-0">
            Claim your spot
          </Button>
        </a>
      </div>
    </motion.nav>
  );
}

/* ─── Dashboard Mock ─── */
function DashboardMock() {
  const matches = [
    { name: "ABSA Foundation", score: 87, areas: "Education · Youth · Skills", window: "Open: Jan – May", method: "Proposal" },
    { name: "DG Murray Trust", score: 94, areas: "Education · Community Dev", window: "Open: Now", method: "● APPLY NOW", highlight: true },
    { name: "Anglo American", score: 81, areas: "Youth · Environment · Health", window: "Open: Feb – Apr", method: "Proposal" },
  ];

  return (
    <div
      className="w-full max-w-md mx-auto animate-float"
      style={{ transform: "perspective(1000px) rotateY(-3deg) rotateX(2deg)" }}
    >
      <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_80px_rgba(14,165,233,0.15)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-[#94A3B8] tracking-wider">GRANTMATCH DASHBOARD</span>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-[#EF4444]" />
            <div className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            <div className="h-2 w-2 rounded-full bg-[#10B981]" />
          </div>
        </div>
        <p className="text-sm text-[#F1F5F9] mb-4">Good morning, Thandiwe 👋</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { val: "47", label: "Matches" },
            { val: "$1.2M", label: "Pipeline" },
            { val: "89%", label: "Avg Match" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0F172A]/60 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[#F1F5F9]">{s.val}</div>
              <div className="text-[10px] text-[#64748B]">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-semibold text-[#94A3B8] tracking-wider mb-3">TOP MATCHES FOR YOU</p>
        <div className="space-y-2">
          {matches.map((m) => (
            <div key={m.name} className="bg-[#0F172A]/40 rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[#F1F5F9]">{m.name}</span>
                <span className={`text-xs font-bold ${m.score >= 90 ? "text-[#10B981]" : "text-[#0EA5E9]"}`}>{m.score}%</span>
              </div>
              <div className="text-[10px] text-[#64748B]">{m.areas}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[#64748B]">{m.window}</span>
                <span className={`text-[10px] font-medium ${m.highlight ? "text-[#10B981]" : "text-[#94A3B8]"}`}>{m.method}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Feature Mocks ─── */
function MatchEngineMock() {
  const funders = [
    { score: 94, name: "DG Murray Trust", open: true, areas: "Education · Youth · Community Dev", method: "Proposal · National · Jan-May" },
    { score: 87, name: "ABSA Foundation", open: true, areas: "Youth · Skills · Education", method: "Proposal · National · Jan-Feb" },
    { score: 81, name: "Anglo American Foundation", open: false, areas: "Youth · Environment · Health", method: "LOE First · National" },
  ];
  return (
    <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#94A3B8] tracking-wider">GRANT DISCOVERY</span>
        <span className="text-[10px] text-[#64748B]">Search... [Filter]</span>
      </div>
      <p className="text-[10px] text-[#64748B] mb-4">2,448 funders · 47 matched to your profile</p>
      <div className="space-y-2">
        {funders.map((f) => (
          <div key={f.name} className="bg-[#0F172A]/40 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-3 mb-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${f.score >= 90 ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#0EA5E9]/20 text-[#0EA5E9]"}`}>{f.score}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F1F5F9]">{f.name}</span>
                  <span className={`text-[10px] font-medium ${f.open ? "text-[#10B981]" : "text-[#F59E0B]"}`}>{f.open ? "● OPEN NOW" : "Opens Feb"}</span>
                </div>
                <div className="text-[10px] text-[#64748B]">{f.areas}</div>
                <div className="text-[10px] text-[#64748B]">{f.method}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {["Save ♡", "View details", "Apply →"].map((a) => (
                <span key={a} className="text-[9px] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded">{a}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProposalWriterMock() {
  return (
    <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#94A3B8] tracking-wider">PROPOSAL: DG Murray Trust</span>
        <span className="text-[10px] font-semibold text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded">Score: 84/100</span>
      </div>
      <p className="text-[10px] text-[#64748B] mb-4">AfterSchool Programme · Full Proposal</p>
      <div className="space-y-1.5 mb-4">
        {[
          { section: "Executive Summary", words: "287 / 300", done: true },
          { section: "Problem Statement", words: "498 / 500", done: true },
          { section: "Objectives", words: "312 / 300", done: true },
          { section: "Methodology", words: "AI writing...", writing: true },
          { section: "M&E Framework", words: "0 / 400", done: false },
          { section: "Budget Narrative", words: "0 / 300", done: false },
        ].map((s) => (
          <div key={s.section} className="flex items-center justify-between text-[10px] py-1">
            <span className="flex items-center gap-1.5">
              <span>{s.done ? "✅" : s.writing ? "🔄" : "○"}</span>
              <span className="text-[#F1F5F9]">{s.section}</span>
            </span>
            <span className={s.writing ? "text-[#0EA5E9] animate-pulse" : "text-[#64748B]"}>{s.words}</span>
          </div>
        ))}
      </div>
      <div className="bg-[#0F172A]/40 rounded-xl p-3 border border-white/5">
        <p className="text-[10px] text-[#94A3B8] font-semibold mb-1">METHODOLOGY</p>
        <p className="text-[10px] text-[#94A3B8] leading-relaxed">
          Our AfterSchool programme operates Monday to Thursday from 2:30pm to 5:30pm across 7 partner schools in Mitchells Plain and Bonteheuwel. Each session includes 90 minutes of subject tutoring in core subjects, followed by structured life skills activities facilitated by trained <span className="inline-block w-0.5 h-3 bg-[#0EA5E9] animate-pulse" />
        </p>
        <p className="text-right text-[9px] text-[#0EA5E9] mt-1">AI writing</p>
      </div>
      <div className="flex gap-2 mt-3">
        {["✨ Generate All", "Score Proposal", "Save Draft"].map((a) => (
          <span key={a} className="text-[9px] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-1 rounded">{a}</span>
        ))}
      </div>
    </div>
  );
}

function PipelineMock() {
  const cols = [
    { title: "BACKLOG (3)", items: [{ name: "Nedbank", score: 74, due: "May" }, { name: "Allan Gray", score: 82, due: "Jun" }] },
    { title: "IN PROGRESS (2)", items: [{ name: "DG Murray", score: 94, due: "Apr" }, { name: "Anglo Am", score: 81, due: "Apr" }] },
    { title: "SUBMITTED (4)", items: [{ name: "ABSA", status: "Awaiting response" }, { name: "Nedgroup", status: "✓ Funded", amount: "$45,000", celebrate: true }] },
  ];
  return (
    <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-[#94A3B8] tracking-wider">APPLICATION PIPELINE</span>
        <span className="text-[10px] text-[#64748B]">April 2026</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cols.map((col) => (
          <div key={col.title}>
            <p className="text-[9px] font-semibold text-[#64748B] mb-2">{col.title}</p>
            <div className="space-y-2">
              {col.items.map((item: any) => (
                <div key={item.name} className="bg-[#0F172A]/40 rounded-lg p-2 border border-white/5">
                  <p className="text-[10px] font-semibold text-[#F1F5F9]">{item.name}</p>
                  {item.score && <p className="text-[9px] text-[#0EA5E9]">{item.score}% match</p>}
                  {item.due && <p className="text-[9px] text-[#64748B]">Due: {item.due}</p>}
                  {item.status && <p className={`text-[9px] ${item.celebrate ? "text-[#10B981]" : "text-[#94A3B8]"}`}>{item.status} {item.celebrate && "🎉"}</p>}
                  {item.amount && <p className="text-[9px] text-[#10B981] font-semibold">{item.amount}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Waitlist Form ─── */
function WaitlistForm({ onSuccess }: { onSuccess: (data: { name: string; email: string; position: number }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [country, setCountry] = useState("South Africa");
  const [role, setRole] = useState("Executive Director");
  const [committed, setCommitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committed) {
      toast({ title: "Please confirm your commitment", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Get current count for position
      const { count } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
      const position = 7 + (count || 0) + 1;

      const { error } = await supabase.from("waitlist").insert({
        email, name, organisation: org, country, role,
        committed_to_pay: committed, position,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "You are already on the waitlist.", description: "Check your email for confirmation." });
        } else {
          throw error;
        }
        setSubmitting(false);
        return;
      }

      onSuccess({ name, email, position });
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const countries = ["South Africa", "Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda", "Ethiopia", "Rwanda", "Zimbabwe", "Mozambique", "Senegal", "Cameroon", "Malawi", "Zambia", "Botswana", "Namibia", "Other"];
  const roles = ["Executive Director", "Programme Manager", "Fundraiser", "Finance", "Other"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold text-[#F1F5F9] mb-1">Reserve your founding member spot</h3>
      <div>
        <Label className="text-xs text-[#94A3B8]">Your name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 bg-[#0F172A]/60 border-white/10 text-[#F1F5F9] placeholder:text-[#64748B]" placeholder="Full name" />
      </div>
      <div>
        <Label className="text-xs text-[#94A3B8]">Work email address</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-[#0F172A]/60 border-white/10 text-[#F1F5F9] placeholder:text-[#64748B]" placeholder="you@organisation.org" />
      </div>
      <div>
        <Label className="text-xs text-[#94A3B8]">Organisation name</Label>
        <Input value={org} onChange={(e) => setOrg(e.target.value)} required className="mt-1 bg-[#0F172A]/60 border-white/10 text-[#F1F5F9] placeholder:text-[#64748B]" placeholder="Your NGO name" />
      </div>
      <div>
        <Label className="text-xs text-[#94A3B8]">Country</Label>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full rounded-md bg-[#0F172A]/60 border border-white/10 text-[#F1F5F9] text-sm px-3 py-2">
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <Label className="text-xs text-[#94A3B8]">Your role</Label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-md bg-[#0F172A]/60 border border-white/10 text-[#F1F5F9] text-sm px-3 py-2">
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={committed} onChange={(e) => setCommitted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 accent-[#0EA5E9]" />
        <span className="text-xs text-[#94A3B8]">I commit to paying $47/month when GrantMatch launches. (No charge until launch day.)</span>
      </label>
      <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white text-base py-4 rounded-xl shadow-[0_0_32px_rgba(14,165,233,0.3)] hover:scale-[1.02] transition-transform border-0 h-auto">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Claim my founding member spot →
      </Button>
    </form>
  );
}

function WaitlistSuccess({ data }: { data: { name: string; email: string; position: number } }) {
  const shareText = `I just joined the GrantMatch waitlist. It is an AI tool that finds funders for African NGOs and writes the grant proposals. Launching soon at $47/month. Join here: ${window.location.origin}`;
  return (
    <div className="text-center py-8">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="text-xl font-bold text-[#F1F5F9] mb-2">You're on the list, {data.name}!</h3>
      <p className="text-[#94A3B8] mb-1">You are founding member <span className="text-[#0EA5E9] font-bold">#{data.position}</span></p>
      <p className="text-sm text-[#64748B] mb-6">We will email you at {data.email} when GrantMatch is ready to launch.</p>
      <p className="text-xs text-[#94A3B8] mb-4">In the meantime, tell another NGO:</p>
      <div className="flex flex-col gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full border-white/20 text-[#F1F5F9] hover:bg-white/5">Share on WhatsApp</Button>
        </a>
        <Button variant="outline" className="w-full border-white/20 text-[#F1F5F9] hover:bg-white/5" onClick={() => { navigator.clipboard.writeText(window.location.origin); toast({ title: "Link copied!" }); }}>
          <Copy className="h-3 w-3 mr-2" /> Copy my referral link
        </Button>
      </div>
      <p className="text-[10px] text-[#64748B] mt-4">Every NGO you refer moves you 3 spots up the queue.</p>
    </div>
  );
}

/* ─── Ticker ─── */
function LiveTicker() {
  const items = [
    { name: "ABSA Foundation", open: true, cat: "SA Corporate", method: "Proposal" },
    { name: "DG Murray Trust", open: true, cat: "SA Trusts", method: "Full Proposal" },
    { name: "Anglo American Foundation", open: false, cat: "SA Corporate", method: "" },
    { name: "Allan Gray Orbis", open: true, cat: "SA Trusts", method: "" },
    { name: "Bill & Melinda Gates", open: true, cat: "USA", method: "LOE first" },
    { name: "Nedbank Foundation", open: false, cat: "SA Corporate", method: "" },
    { name: "Ford Foundation", open: true, cat: "USA", method: "Letter of Enquiry" },
    { name: "Open Society Foundations", open: true, cat: "USA", method: "" },
    { name: "Standard Bank Foundation", open: false, cat: "SA Corporate", method: "" },
    { name: "Hivos", open: true, cat: "Europe", method: "" },
  ];
  const doubled = [...items, ...items];

  return (
    <section className="relative z-10 border-y border-white/5 bg-[#0F172A] overflow-hidden">
      <p className="text-center text-[10px] text-[#64748B] pt-2">Live funding opportunities from your database</p>
      <div className="py-3 animate-ticker flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-6 text-sm text-[#94A3B8]">
            <span className={`h-2 w-2 rounded-full ${item.open ? "bg-[#10B981]" : "bg-[#F59E0B]"}`} />
            <span className="font-medium text-[#F1F5F9]">{item.name}</span>
            <span>·</span>
            <span>{item.open ? "Open Now" : "Opens Soon"}</span>
            <span>·</span>
            <span>{item.cat}</span>
            {item.method && <><span>·</span><span>{item.method}</span></>}
            <span className="text-[#0EA5E9] ml-2">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
const LandingPage = () => {
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [successData, setSuccessData] = useState<{ name: string; email: string; position: number } | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const BASE_COUNT = 7;
  useEffect(() => {
    supabase.from("waitlist").select("*", { count: "exact", head: true }).then(({ count }) => {
      setWaitlistCount(BASE_COUNT + (count || 0));
    });
  }, []);

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  const featureTabs = ["Match Engine", "Proposal Writer", "Pipeline"];

  return (
    <div className="min-h-screen bg-[#0F172A] overflow-hidden">
      <Nav waitlistCount={waitlistCount} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-[72px]">
        <ParticleBackground />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="grid lg:grid-cols-[55%_45%] gap-12 items-center">
            <div>
              <motion.div variants={fadeUpVariants(0.1)} initial="hidden" animate="visible">
                <span className="inline-flex items-center gap-2 text-sm text-[#F59E0B] border border-[#F59E0B]/30 rounded-full px-4 py-1.5 mb-6">🌍 Built for African NGOs</span>
              </motion.div>
              <motion.h1 variants={fadeUpVariants(0.2)} initial="hidden" animate="visible" className="text-[40px] lg:text-[64px] font-bold text-[#F1F5F9] leading-[1.1] mb-6">
                Stop losing grants<br />to better-written<br /><span className="text-[#0EA5E9]">proposals.</span>
              </motion.h1>
              <motion.p variants={fadeUpVariants(0.35)} initial="hidden" animate="visible" className="text-lg lg:text-xl text-[#94A3B8] mb-4 max-w-lg">
                GrantMatch finds 2,448 funders matched to your mission, then writes the proposals for you. Finally, a fair fight for African NGOs.
              </motion.p>
              <motion.div variants={fadeUpVariants(0.35)} initial="hidden" animate="visible" className="flex items-center gap-3 text-sm text-[#64748B] mb-8">
                <span>✦ 2,448 funders in the database</span><span>·</span><span>✦ Match scores updated monthly</span>
              </motion.div>
              <motion.div variants={fadeUpVariants(0.5)} initial="hidden" animate="visible">
                <button onClick={scrollToPricing} className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-[0_0_32px_rgba(14,165,233,0.3)] hover:scale-[1.02] transition-transform">
                  Claim your spot: $47/month at launch →
                </button>
                <div className="mt-3 flex items-center gap-2 text-[13px] text-[#64748B]">
                  <Lock className="h-3 w-3" />
                  <span>Lock in your price before we launch. Cancel any time. No charge until launch day.</span>
                </div>
              </motion.div>
              <motion.div variants={fadeUpVariants(0.6)} initial="hidden" animate="visible" className="mt-6 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["🟤", "🟡", "🟢", "🔵", "🟣"].map((c, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-[#1E293B] border-2 border-[#0F172A] flex items-center justify-center text-sm">{c}</div>
                  ))}
                </div>
                <span className="text-sm text-[#94A3B8]">+<AnimatedCounter end={waitlistCount} className="text-[#F1F5F9] font-semibold" /> NGOs already waiting</span>
              </motion.div>
            </div>
            <motion.div variants={fadeUpVariants(0.4)} initial="hidden" animate="visible" className="hidden lg:block">
              <DashboardMock />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <LiveTicker />

      {/* ── PAIN ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUpVariants()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#F59E0B] mb-3">THE PROBLEM</p>
            <h2 className="text-[28px] lg:text-[40px] font-bold text-[#F1F5F9] max-w-3xl mx-auto">African NGOs do incredible work. And spend half their time lost in the funding maze.</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { stat: "47 hours", label: "Average time spent researching funders per application", copy: "Your programme staff are grant writers by default. Every hour spent on funder research is an hour not spent in the community." },
              { stat: "1 in 5", label: "Applications succeed on average for African NGOs", copy: "The odds are brutal. Not because your work isn't good enough. Because most proposals don't show it clearly." },
              { stat: "$2.4M", label: "Average funding gap African NGOs report annually", copy: "The money is out there. 312 funders are actively accepting applications right now. Most NGOs never find them in time." },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeUpVariants(i * 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="glass-card p-6 h-full">
                  <div className="text-4xl font-bold text-[#F59E0B] mb-2">{card.stat}</div>
                  <div className="text-sm font-semibold text-[#F1F5F9] mb-2">{card.label}</div>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{card.copy}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-lg lg:text-xl text-[#F1F5F9]">There is a better way. And you shouldn't need a full-time fundraiser to access it.</p>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUpVariants()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#0EA5E9] mb-3">THE SOLUTION</p>
            <h2 className="text-[28px] lg:text-[40px] font-bold text-[#F1F5F9] mb-4">GrantMatch does the heavy lifting. You focus on the work.</h2>
            <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">Match with the right funders. Write proposals that win. Track everything in one place. In a fraction of the time.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, color: "#0EA5E9", title: "Find your funders in seconds", copy: "Tell us your mission once. GrantMatch scores all 2,448 funders against your profile and surfaces the ones most likely to fund you. No more digging through PDF lists." },
              { icon: FileText, color: "#14B8A6", title: "AI writes your proposals", copy: "Full proposals, letters of enquiry, concept notes. Generated in minutes from your profile. Reviewed by you. Submitted when you're ready." },
              { icon: BarChart2, color: "#10B981", title: "Track every application", copy: "Kanban pipeline, deadline calendar, funder relationship history. Know exactly where every application stands and what to do next." },
            ].map((p, i) => (
              <motion.div key={i} variants={fadeUpVariants(i * 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="glass-card p-6 h-full">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${p.color}20` }}>
                    <p.icon className="h-6 w-6" style={{ color: p.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-[#F1F5F9] mb-2">{p.title}</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{p.copy}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUpVariants()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#14B8A6] mb-3">SEE IT IN ACTION</p>
            <h2 className="text-[28px] lg:text-[40px] font-bold text-[#F1F5F9]">Built for the way African NGOs actually work.</h2>
          </motion.div>
          <div className="flex justify-center gap-2 mb-8">
            {featureTabs.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? "bg-[#0EA5E9] text-white" : "bg-white/5 text-[#94A3B8] hover:bg-white/10"}`}>{tab}</button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto">
              {activeTab === 0 && <MatchEngineMock />}
              {activeTab === 1 && <ProposalWriterMock />}
              {activeTab === 2 && <PipelineMock />}
            </motion.div>
          </AnimatePresence>
          <p className="text-center text-xs text-[#64748B] mt-6">
            {activeTab === 0 && "Match scores calculated from your mission, focus areas, geography and application window. Updated monthly."}
            {activeTab === 1 && "AI generates each section from your onboarding profile. You review, edit, and approve before submitting."}
            {activeTab === 2 && "Drag-and-drop Kanban board. Every application tracked from discovery to decision. Never miss a deadline."}
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUpVariants()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#10B981] mb-3">GET STARTED IN MINUTES</p>
            <h2 className="text-[28px] lg:text-[40px] font-bold text-[#F1F5F9]">From signup to your first matched grant in under 10 minutes.</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] border-t-2 border-dashed border-white/10" />
            {[
              { num: "01", icon: Users, title: "Complete your profile once", copy: "Tell us about your organisation, your mission, your programmes, and who you serve. Our guided onboarding takes 10-15 minutes and powers everything after it." },
              { num: "02", icon: Search, title: "See your matched funders", copy: "GrantMatch scores all 2,448 funders against your profile instantly. You see the ones most likely to fund you, ranked by match score, with application windows clearly shown." },
              { num: "03", icon: Send, title: "Write and submit with AI", copy: "Click apply on any funder. GrantMatch reads their requirements and opens the right document type. Full proposal, letter of enquiry, or concept note, generated and ready to review." },
            ].map((step, i) => (
              <motion.div key={i} variants={fadeUpVariants(i * 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative text-center">
                <div className="text-5xl font-bold text-[#0EA5E9] mb-4">{step.num}</div>
                <div className="h-14 w-14 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-7 w-7 text-[#0EA5E9]" />
                </div>
                <h3 className="text-lg font-bold text-[#F1F5F9] mb-2">{step.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{step.copy}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-[#64748B] mt-12">Average time from signup to first proposal draft: 23 minutes. (We timed it.)</p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUpVariants()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#F59E0B] mb-3">JOIN THE WAITLIST</p>
            <h2 className="text-[28px] lg:text-[40px] font-bold text-[#F1F5F9] mb-4">Lock in $47/month before we launch.</h2>
            <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">After launch, pricing starts at $99/month. Waitlist members who commit now keep $47/month for life. That is our promise.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pricing card */}
            <motion.div variants={fadeUpVariants(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="rounded-2xl border-2 border-[#0EA5E9] p-8 bg-[#1E293B]/50 backdrop-blur-xl shadow-[0_0_40px_rgba(14,165,233,0.15)] h-full">
                <p className="text-xs font-semibold tracking-widest text-[#0EA5E9] mb-6">WAITLIST FOUNDING MEMBER</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-bold text-[#F1F5F9]">$47</span>
                  <span className="text-lg text-[#94A3B8]">/ month</span>
                </div>
                <p className="text-sm text-[#64748B] mb-8">(locks in at launch, cancel any time)</p>
                <div className="space-y-3 mb-8">
                  {[
                    "All 2,448 funders with match scores",
                    "AI proposal writer (full proposals, LOEs, concept notes)",
                    "Application pipeline & Kanban",
                    "Deadline intelligence engine",
                    "Impact report generator",
                    "Funder relationship CRM",
                    "NGO Partnership Hub",
                    "Analytics dashboard",
                    "Priority support at launch",
                    "Founding member badge",
                  ].map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#10B981] mt-0.5 shrink-0" />
                      <span className="text-sm text-[#F1F5F9]">{f}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#94A3B8] mb-4">vs <span className="line-through">$99/month</span> after launch</p>
                <button onClick={scrollToPricing} className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white text-base font-semibold px-6 py-4 rounded-xl shadow-[0_0_32px_rgba(14,165,233,0.3)] hover:scale-[1.02] transition-transform">
                  Claim my spot at $47/month →
                </button>
                <div className="mt-3 flex items-center gap-2 text-[13px] text-[#64748B] justify-center">
                  <Lock className="h-3 w-3" />
                  <span>No charge until launch day. Cancel before then, pay nothing.</span>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div variants={fadeUpVariants(0.2)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="glass-card p-8 h-full">
                {successData ? <WaitlistSuccess data={successData} /> : (
                  <WaitlistForm onSuccess={(data) => {
                    setSuccessData(data);
                    setWaitlistCount((c) => c + 1);
                  }} />
                )}
              </div>
            </motion.div>
          </div>

          {/* Urgency strip */}
          <div className="mt-10 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl px-6 py-4 text-center">
            <p className="text-sm text-[#F59E0B] font-medium">
              ⚡ Only founding member pricing available until launch. Price goes to $99/month after launch.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-[#0EA5E9]/5 blur-[100px] rounded-full" />
          <div className="relative">
            <h2 className="text-[36px] lg:text-[48px] font-bold text-[#F1F5F9] mb-4">Your next grant is already in the database.</h2>
            <p className="text-lg text-[#94A3B8] mb-8">2,448 funders. 312 accepting applications right now. Your match score calculated in seconds.</p>
            <button onClick={scrollToPricing} className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white text-lg font-semibold px-10 py-4 rounded-xl shadow-[0_0_32px_rgba(14,165,233,0.3)] hover:scale-[1.02] transition-transform">
              Claim your founding member spot →
            </button>
            <p className="text-[13px] text-[#64748B] mt-3">No charge until launch. Cancel any time. $47/month for life if you join now.</p>
            <p className="text-sm text-[#94A3B8] mt-6">🟢 <AnimatedCounter end={waitlistCount} className="text-[#F1F5F9] font-semibold" /> people on the waitlist</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-[#F1F5F9]">Grant</span>
            <span className="text-sm font-bold text-[#0EA5E9]">Match</span>
            <span className="text-xs text-[#64748B] ml-2">© 2026 GrantMatch. Built for African NGOs.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#64748B]">
            <span>Privacy Policy</span>
            <span>Terms</span>
            <span>info@grantmatch.co</span>
            <a href="/login" className="hover:text-[#94A3B8] transition-colors cursor-pointer">Team Login</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
